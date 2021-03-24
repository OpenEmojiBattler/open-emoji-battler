import { decodeAddress } from "@polkadot/util-crypto"

import { getWasmSolver } from "./pow/wasm"
import { solvePowPure, SolverFn, getPowWasmBytes, getPowSolutionBNFromBytes } from "./utils"

let solver: SolverFn | null = null
export const solvePow = async (address: string, count: number) => {
  if (!solver) {
    const mod = await WebAssembly.compile(getPowWasmBytes())
    solver = await getWasmSolver(mod)
  }

  const publicKey = decodeAddress(address)
  const solution = getPowSolutionBNFromBytes(solvePowPure(solver, publicKey, count))

  return solution
}
