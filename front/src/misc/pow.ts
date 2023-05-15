import BN from "bn.js"
import { decodeAddress } from "@polkadot/util-crypto"

import { getPowWasmBytes, getPowSolutionBNFromBytes } from "common"

import PowWorker from "./pow.worker"

const wasmBytes = getPowWasmBytes()

export const solvePow = (address: string, powCount: number) =>
  new Promise((resolve: (s: BN) => void, reject) => {
    const worker = new PowWorker()

    worker.onerror = (evt) => {
      reject(evt)
    }
    worker.onmessage = (evt) => {
      const data = evt.data
      worker.terminate()
      if (data.type === "done") {
        resolve(getPowSolutionBNFromBytes(data.solution))
      } else {
        reject(evt)
      }
    }

    worker.postMessage({
      type: "start",
      wasmBytes,
      publicKey: decodeAddress(address),
      count: powCount,
    })
  })
