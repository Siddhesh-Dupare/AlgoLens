import { ChildProcess } from 'child_process'
import { EventEmitter } from 'events'

export interface GDBMIRecord {
  type: 'result' | 'async' | 'notify' | 'console' | 'target'
  token?: number
  class: string
  data: Record<string, string>
  raw: string
}

export interface GDBVariable {
  name: string
  value: string
  type: string
}

export class GDBDriver extends EventEmitter {
  private proc: ChildProcess
  private buffer = ''
  private token = 1
  private pending: Map<number, (r: GDBMIRecord) => void> = new Map()

  constructor(proc: ChildProcess) {
    super()
    this.proc = proc
    this.proc.stdout?.setEncoding('utf8')
    this.proc.stdout?.on('data', (d: string) => this.handleData(d))
  }

  command(cmd: string, callback?: (record: GDBMIRecord) => void): number {
    const tok = this.token++
    if (callback) this.pending.set(tok, callback)
    this.proc.stdin?.write(`${tok}${cmd}\n`)
    return tok
  }

  commandAsync(cmd: string): Promise<GDBMIRecord> {
    return new Promise((resolve) => {
      const tok = this.command(cmd, resolve)
      setTimeout(() => {
        if (this.pending.has(tok)) {
          this.pending.delete(tok)
          resolve({ type: 'result', class: 'timeout', data: {}, raw: '' })
        }
      }, 3000)
    })
  }

  private handleData(data: string): void {
    this.buffer += data
    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() ?? ''
    for (const line of lines) {
      const t = line.replace(/\r$/, '').trim()
      if (!t || t === '(gdb)') continue
      this.parseLine(t)
    }
  }

  private parseLine(line: string): void {
    const tokenMatch = line.match(/^(\d+)/)
    const tok = tokenMatch ? parseInt(tokenMatch[1], 10) : undefined
    const rest = tok !== undefined ? line.slice(String(tok).length) : line

    if (rest.startsWith('^')) {
      const parts = rest.slice(1).split(',')
      const cls = parts[0] ?? ''
      const record: GDBMIRecord = {
        type: 'result',
        token: tok,
        class: cls,
        data: this.parseKV(parts.slice(1).join(',')),
        raw: line,
      }
      if (tok !== undefined && this.pending.has(tok)) {
        const cb = this.pending.get(tok)!
        this.pending.delete(tok)
        cb(record)
      }
    } else if (rest.startsWith('*')) {
      const commaIdx = rest.indexOf(',')
      const cls = commaIdx > 0 ? rest.slice(1, commaIdx) : rest.slice(1)
      const dataStr = commaIdx > 0 ? rest.slice(commaIdx + 1) : ''
      this.emit('async', {
        type: 'async',
        class: cls,
        data: this.parseKV(dataStr),
        raw: line,
      } as GDBMIRecord)
    } else if (rest.startsWith('=')) {
      this.emit('notify', { type: 'notify', class: '', data: {}, raw: line })
    } else if (rest.startsWith('~')) {
      // GDB console output — ignore
    } else if (rest.startsWith('@')) {
      const text = rest
        .slice(1)
        .replace(/^"|"$/g, '')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
      this.emit('output', text)
    }
  }

  private parseKV(str: string): Record<string, string> {
    const result: Record<string, string> = {}
    if (!str) return result
    const pairs = str.matchAll(/(\w+)="([^"\\]*(?:\\.[^"\\]*)*)"/g)
    for (const m of pairs) {
      const key = m[1]
      const val = m[2]
      result[key] = val.replace(/\\n/g, '\n').replace(/\\"/g, '"')
    }
    const reasonMatch = str.match(/reason="([^"]+)"/)
    if (reasonMatch) result['reason'] = reasonMatch[1]
    const lineMatch = str.match(/line="(\d+)"/)
    if (lineMatch) result['line'] = lineMatch[1]
    const fileMatch = str.match(/fullname="([^"]+)"/)
    if (fileMatch) result['fullname'] = fileMatch[1]
    const funcMatch = str.match(/func="([^"]+)"/)
    if (funcMatch) result['func'] = funcMatch[1]
    const exitMatch = str.match(/exit-code="([^"]+)"/)
    if (exitMatch) result['exit-code'] = exitMatch[1]
    const sigMatch = str.match(/signal-name="([^"]+)"/)
    if (sigMatch) result['signal'] = sigMatch[1]
    return result
  }

  async getVariables(): Promise<GDBVariable[]> {
    // --all-values includes values for arrays/structs/vectors (which
    // --simple-values omits). Type is not reported in this mode.
    const resp = await this.commandAsync('-stack-list-variables --all-values')
    const variables: GDBVariable[] = []
    const varMatches = resp.raw.matchAll(
      /\{name="([^"]+)"(?:,arg="[^"]*")?(?:,type="([^"]*)")?(?:,value="((?:[^"\\]|\\.)*)")?\}/g
    )
    for (const m of varMatches) {
      const name = m[1]
      const type = m[2]
      const value = m[3]
      if (name && !name.startsWith('__')) {
        variables.push({
          name,
          type: type ?? 'unknown',
          value: (value ?? '?').replace(/\\"/g, '"').replace(/\\n/g, ' '),
        })
      }
    }
    return variables
  }

  // Evaluate an expression (e.g. "*arr@7" to expand a decayed array pointer).
  async evaluate(expr: string): Promise<string | null> {
    const safe = expr.replace(/"/g, '\\"')
    const resp = await this.commandAsync(`-data-evaluate-expression "${safe}"`)
    const m = resp.raw.match(/value="((?:[^"\\]|\\.)*)"/)
    if (!m) return null
    return m[1].replace(/\\"/g, '"').replace(/\\n/g, ' ')
  }

  async getCallStack(): Promise<Array<{ func: string; line: string; file: string }>> {
    const resp = await this.commandAsync('-stack-list-frames')
    const frames: Array<{ func: string; line: string; file: string }> = []
    const frameMatches = resp.raw.matchAll(
      /\{level="\d+",addr="[^"]+",func="([^"]+)"(?:,file="([^"]*)")?(?:,fullname="[^"]*")?(?:,line="(\d+)")?/g
    )
    for (const m of frameMatches) {
      frames.push({ func: m[1] ?? '??', file: m[2] ?? '', line: m[3] ?? '0' })
    }
    return frames
  }
}
