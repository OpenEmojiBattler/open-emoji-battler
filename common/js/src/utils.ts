import BN from "bn.js"

import type { RegistryTypes } from "@polkadot/types/types/registry"
import type { SignerOptions } from "@polkadot/api/submittable/types"
import type { Signer } from "@polkadot/api/types"
import type { IKeyringPair } from "@polkadot/types/types"

import { decode } from "./pow/base64"
import { base64 } from "./pow/optimized.wrap"
import { getWasmSolver } from "./pow/wasm"
import * as definitions from "./interfaces/definitions"

export const buildTypes = () => {
  let types: RegistryTypes = {
    Address: "MultiAddress",
    LookupSource: "MultiAddress",
  }
  for (const [n, t] of Object.values(definitions).flatMap((d) => Object.entries(d.types))) {
    types[n] = t
  }
  return types
}

export type KeyringPairOrAddressAndSigner = IKeyringPair | { address: string; signer: Signer }
export const extractTxArgs = (account: KeyringPairOrAddressAndSigner, powSolution?: BN) => {
  let pairOrAddress: IKeyringPair | string
  let options: Partial<SignerOptions> = {}

  if ("signer" in account) {
    pairOrAddress = account.address
    options.signer = account.signer
  } else {
    pairOrAddress = account
  }

  if (powSolution) {
    options.tip = new BN(1).shln(127).add(powSolution)
  }

  return [pairOrAddress, options] as const
}

const PowThreshold = 2655
export const solvePowByBytes = async (
  wasmBytes: Uint8Array,
  publicKey: Uint8Array,
  count: number
) => {
  const mod = await WebAssembly.compile(wasmBytes)
  const solver = await getWasmSolver(mod)

  return solvePowPure(solver, publicKey, count)
}

export type SolverFn = (buffer: Uint8Array, threshold: number) => Uint8Array[]
export const solvePowPure = (solver: SolverFn, publicKey: Uint8Array, count: number) => {
  const buffer = new Uint8Array(128)

  buffer.set(publicKey, 0)
  const c = new ArrayBuffer(4)
  new DataView(c).setUint32(0, count, true)
  buffer.set(new Uint8Array(c), 32)
  const key = new ArrayBuffer(4)
  new DataView(key).setUint32(0, 123, true)
  buffer.set(new Uint8Array(key), 36)

  const label = `pow (count: ${count}, publicKey: ${publicKey.toString()})`
  console.time(label)
  const [s, hash] = solver(buffer, PowThreshold)
  console.timeEnd(label)
  if (hash.length === 0) {
    throw new Error(`Internal error or no solution found: ${label}`)
  }

  return s.slice(-8)
}

export const getPowWasmBytes = () => decode(base64)
export const getPowSolutionBNFromBytes = (solution: Uint8Array) => new BN(solution, undefined, "le")
