'use strict'

const WebSocket = require('ws')
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const userFile = process.argv[2]
if (!userFile) {
  process.stderr.write('No file provided\n')
  process.exit(1)
}

const userCode = fs.readFileSync(userFile, 'utf8')
let msgIdCounter = 1
let frameIndex = 0
let inspectorWs = null
const pendingCallbacks = new Map()
let prevVars = {}
let started = false // true once we've reached the user's code
const MAX_FRAMES = 5000
const userBase = path.basename(userFile)
const scriptUrls = new Map() // scriptId -> url (callFrame.url is often empty)

function escapeRegex(s) {
  return s.replace(/[.\\+*?^$()[\]{}|/]/g, '\\$&')
}

// ── Spawn user script with inspector ───────────────────────
const child = spawn(process.execPath, ['--inspect-brk=0', userFile], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env },
})

child.stdout.on('data', (d) => process.stdout.write(d))

let inspectorFound = false
child.stderr.on('data', (d) => {
  const text = d.toString()
  if (!inspectorFound) {
    const match = text.match(/ws:\/\/[^\s\n]+/)
    if (match) {
      inspectorFound = true
      setTimeout(() => connectInspector(match[0]), 200)
    }
  }
})

child.on('exit', () => {
  if (inspectorWs) {
    try {
      inspectorWs.close()
    } catch {}
  }
  process.exit(0)
})

// ── CDP helpers ─────────────────────────────────────────────
function sendCmd(method, params = {}) {
  const id = msgIdCounter++
  inspectorWs.send(JSON.stringify({ id, method, params }))
  return id
}

function sendCmdAsync(method, params = {}) {
  return new Promise((resolve) => {
    const id = msgIdCounter++
    pendingCallbacks.set(id, resolve)
    inspectorWs.send(JSON.stringify({ id, method, params }))
    setTimeout(() => {
      if (pendingCallbacks.has(id)) {
        pendingCallbacks.delete(id)
        resolve(null)
      }
    }, 3000)
  })
}

// ── Inspector connection ────────────────────────────────────
function connectInspector(wsUrl) {
  inspectorWs = new WebSocket(wsUrl)

  inspectorWs.on('open', () => {
    sendCmd('Debugger.enable')
    sendCmd('Runtime.enable')
    sendCmd('Debugger.setPauseOnExceptions', { state: 'none' })
    // Stop when the user's file first executes, then step from there.
    sendCmd('Debugger.setBreakpointByUrl', {
      lineNumber: 0,
      urlRegex: escapeRegex(userBase),
    })
    sendCmd('Runtime.runIfWaitingForDebugger')
  })

  inspectorWs.on('message', async (rawMsg) => {
    let msg
    try {
      msg = JSON.parse(rawMsg.toString())
    } catch {
      return
    }

    if (msg.id && pendingCallbacks.has(msg.id)) {
      const cb = pendingCallbacks.get(msg.id)
      pendingCallbacks.delete(msg.id)
      cb(msg)
      return
    }

    if (msg.method === 'Debugger.paused') {
      await handlePaused(msg.params)
      return
    }

    if (msg.method === 'Debugger.scriptParsed') {
      scriptUrls.set(msg.params.scriptId, msg.params.url || '')
      return
    }

    if (msg.method === 'Runtime.executionContextDestroyed') {
      try {
        child.kill()
      } catch {}
      process.exit(0)
    }
  })

  inspectorWs.on('error', (err) => {
    process.stderr.write('Inspector WS error: ' + err.message + '\n')
  })
}

// ── Recursive value serialization (Python-repr style) ───────
async function getProps(objectId) {
  const r = await sendCmdAsync('Runtime.getProperties', {
    objectId,
    ownProperties: true,
  })
  return r && r.result && r.result.result ? r.result.result : []
}

// Turn a CDP remote object into a Python-like repr the classifier understands:
// arrays -> "[...]" (nested -> "[[...]]" so 2-D arrays render as grids),
// strings -> "'...'", objects -> "{k: v}". Bounded depth so big graphs stay sane.
async function reprValue(val, depth = 0) {
  if (!val || val.type === 'undefined') return 'undefined'
  if (val.type === 'string') return "'" + val.value + "'"
  if (val.type === 'number' || val.type === 'boolean' || val.type === 'bigint') {
    return String(val.value ?? val.description ?? '')
  }
  if (val.type === 'object') {
    if (val.subtype === 'null') return 'null'
    if (depth >= 4 || !val.objectId) return val.description || 'object'

    if (val.subtype === 'array') {
      const props = await getProps(val.objectId)
      const items = []
      for (const p of props) {
        if (!/^\d+$/.test(p.name)) continue // numeric indices only
        if (items.length >= 200) break
        items.push(await reprValue(p.value, depth + 1))
      }
      return '[' + items.join(', ') + ']'
    }

    // plain object / instance -> {k: v}
    const props = await getProps(val.objectId)
    const pairs = []
    for (const p of props) {
      if (!p.value || p.name.startsWith('__')) continue
      if (pairs.length >= 50) break
      pairs.push(p.name + ': ' + (await reprValue(p.value, depth + 1)))
    }
    return '{' + pairs.join(', ') + '}'
  }
  return String(val.value ?? val.description ?? '')
}

// ── Handle a debugger pause ─────────────────────────────────
async function handlePaused(params) {
  const callFrames = params.callFrames || []
  if (callFrames.length === 0) {
    sendCmd('Debugger.resume')
    return
  }

  const topFrame = callFrames[0]
  const scriptUrl =
    topFrame.url || scriptUrls.get(topFrame.location.scriptId) || ''
  const inUserFile = scriptUrl.includes(userBase)

  // Not in user code: before we've started, resume to the breakpoint;
  // after, step out of the library call back to user code.
  if (!inUserFile) {
    if (started) sendCmd('Debugger.stepOut')
    else sendCmd('Debugger.resume')
    return
  }

  started = true

  if (frameIndex > MAX_FRAMES) {
    sendCmd('Debugger.resume')
    return
  }

  const lineNumber = topFrame.location.lineNumber + 1

  const variables = {}
  for (const scope of topFrame.scopeChain) {
    if (scope.type !== 'local' && scope.type !== 'block') continue
    if (!scope.object || !scope.object.objectId) continue

    const propsResp = await sendCmdAsync('Runtime.getProperties', {
      objectId: scope.object.objectId,
      ownProperties: true,
      generatePreview: true,
    })

    if (!propsResp || !propsResp.result || !propsResp.result.result) continue

    for (const prop of propsResp.result.result) {
      const name = prop.name
      if (
        name.startsWith('__') ||
        name === 'module' ||
        name === 'exports' ||
        name === 'require'
      )
        continue

      const val = prop.value
      if (!val) continue
      if (val.type === 'undefined') continue

      // Recursively serialize so nested arrays (2-D -> grids), strings and
      // objects render the same way the Python tracer emits them.
      const strValue = await reprValue(val)
      let typeName = val.type
      if (val.subtype === 'array') typeName = 'array'
      else if (val.type === 'string') typeName = 'string'
      else if (val.subtype === 'null') typeName = 'null'

      const changed = prevVars[name] !== strValue
      variables[name] = { name, value: strValue, type: typeName, changed }
    }
  }

  prevVars = Object.fromEntries(
    Object.entries(variables).map(([k, v]) => [k, v.value])
  )

  const callStack = callFrames.slice(0, 8).map((cf) => ({
    functionName: cf.functionName || '(anonymous)',
    lineNumber: cf.location.lineNumber + 1,
    filename: path.basename(userFile),
  }))

  const changedVars = Object.values(variables).filter((v) => v.changed)
  let stepType = 'line'
  if (changedVars.length > 1) stepType = 'assign'

  const frame = {
    type: 'frame',
    frameIndex: frameIndex++,
    lineNumber,
    variables,
    stepType,
    callStack,
    sourceCode: userCode,
  }

  process.stdout.write('__ALGOLENS_FRAME__:' + JSON.stringify(frame) + '\n')
  // Step into so we descend into the user's own functions (library calls are
  // stepped back out of via the !inUserFile branch above).
  sendCmd('Debugger.stepInto')
}
