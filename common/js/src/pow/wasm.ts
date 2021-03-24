// Adapted from the friendly-pow@0.1.2 package implementation
// (https://github.com/FriendlyCaptcha/friendly-pow/tree/01a1c9c4aa858d3517881347c3328b67575029a7, MIT Licensed)

import { instantiateWasmSolver } from "./loader"

export async function getWasmSolver(module: any) {
  const w = await instantiateWasmSolver(module)

  const arrPtr = w.exports.__retain(
    w.exports.__allocArray(w.exports.Uint8Array_ID, new Uint8Array(128))
  )
  let solution = w.exports.__getUint8Array(arrPtr)

  return (puzzleBuffer: Uint8Array, threshold: number, n = 4294967295) => {
    ;(solution as Uint8Array).set(puzzleBuffer)
    const hashPtr = w.exports.solveBlake2b(arrPtr, threshold, n)
    solution = w.exports.__getUint8Array(arrPtr)
    const hash = w.exports.__getUint8Array(hashPtr)
    w.exports.__release(hashPtr)
    return [solution, hash]
  }
}
