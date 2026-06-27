import { PythonExecutor } from './pythonExecutor'
import { JavaScriptExecutor } from './javascriptExecutor'
import { CppExecutor } from './cppExecutor'
import { CExecutor } from './cExecutor'
import { JavaExecutor } from './javaExecutor'
import { ProcessManager } from '../sandbox/processManager'
import { RuntimePaths } from '../utils/pathResolver'
import { Language } from '../types'
import { BaseExecutor } from './baseExecutor'

export function createExecutor(
  language: Language,
  pm: ProcessManager,
  runtimes: RuntimePaths
): BaseExecutor {
  switch (language) {
    case 'python':
      return new PythonExecutor(pm, runtimes)
    case 'javascript':
      return new JavaScriptExecutor(pm, runtimes)
    case 'cpp':
      return new CppExecutor(pm, runtimes)
    case 'c':
      return new CExecutor(pm, runtimes)
    case 'java':
      return new JavaExecutor(pm, runtimes)
    default:
      throw new Error(`Unsupported language: ${language}`)
  }
}
