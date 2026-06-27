import { CppExecutor } from './cppExecutor'

// C shares the entire C++ implementation; only the toolchain, file extension,
// and language standard differ — all driven by isC().
export class CExecutor extends CppExecutor {
  protected isC(): boolean {
    return true
  }
}
