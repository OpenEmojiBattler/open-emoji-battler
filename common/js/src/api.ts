import BN from "bn.js"
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api"
import { TypeRegistry } from "@polkadot/types"

import type { SubmittableExtrinsic } from "@polkadot/api/types"
import type { SubmittableResult } from "@polkadot/api/submittable"
import type { IKeyringPair, Codec, DetectCodec } from "@polkadot/types/types"
import type { DispatchErrorModule } from "@polkadot/types/interfaces"
import type { Hash } from "@polkadot/types/interfaces/runtime"

import { buildTypes, KeyringPairOrAddressAndSigner, extractTxArgs } from "./utils"

let endpoint = ""
let apiPromise: ApiPromise | null = null
const registry = new TypeRegistry()
const types = buildTypes()
registry.register(types)

export const connected = async (endpoint: string, f: () => Promise<any>) => {
  let api: ApiPromise | null = null
  try {
    api = await connect(endpoint)
    await f()
  } catch (e) {
    console.error(e)
  } finally {
    if (api) {
      await api.disconnect()
    }
  }
}

export const connect = async (newEndpoint: string) => {
  if (apiPromise) {
    if (endpoint === newEndpoint) {
      return apiPromise
    }
    await apiPromise.disconnect()
  }

  endpoint = newEndpoint
  // if we don't pass `types` here,
  // it seems the types data will be cleared when the runtime upgrade occurs
  apiPromise = await ApiPromise.create({
    provider: new WsProvider(newEndpoint),
    registry,
    types,
  })
  return apiPromise
}

export const disconnect = async () => {
  const api = getApi()
  api.disconnect()
}

const getApi = () => {
  if (apiPromise) {
    return apiPromise
  }
  throw new Error("not connected")
}

export const query = <T>(f: (query: ApiPromise["query"]) => Promise<T>): Promise<T> => {
  const api = getApi()
  return f(api.query)
}

export const rpc = <T>(f: (rpc: ApiPromise["rpc"]) => Promise<T>): Promise<T> => {
  const api = getApi()
  return f(api.rpc)
}

export const derive = <T>(f: (derive: ApiPromise["derive"]) => Promise<T>): Promise<T> => {
  const api = getApi()
  return f(api.derive)
}

export const tx = (
  f: (tx: ApiPromise["tx"]) => SubmittableExtrinsic<"promise">,
  account: KeyringPairOrAddressAndSigner,
  powSolution?: BN
) => {
  const api = getApi()

  const [pairOrAddress, options] = extractTxArgs(account, powSolution)

  return new Promise<Hash>(async (resolve, reject) => {
    const unsub = await f(api.tx)
      .signAndSend(pairOrAddress, options, (result: SubmittableResult) => {
        if (!result.isCompleted) {
          return
        }
        if (unsub) {
          unsub()
        }
        if (result.isError) {
          reject("tx: result.isError")
          return
        }
        if (result.findRecord("system", "ExtrinsicSuccess")) {
          const sudid = result.findRecord("sudo", "Sudid")
          if (sudid) {
            const d = sudid.event.data[0] as any
            if (d && d.isError) {
              reject(`sudo: ${buildErrorText(api, d.asError.asModule)}`)
              return
            }
          }
          const status = result.status
          const hash = status.isInBlock ? status.asInBlock : status.asFinalized
          resolve(hash)
          return
        }
        if (result.dispatchError) {
          if (result.dispatchError.isModule) {
            reject(buildErrorText(api, result.dispatchError.asModule))
            return
          } else {
            reject(`tx: ${result.dispatchError.toString()}`)
            return
          }
        }
        reject("tx: unknown state")
        return
      })
      .catch(() => {
        reject("tx: failed")
        return
      })
  })
}

export const sudo = (
  f: (tx: ApiPromise["tx"]) => SubmittableExtrinsic<"promise">,
  account: IKeyringPair
) => {
  const api = getApi()
  return tx((tx) => api.tx.sudo.sudo(f(tx)), account)
}

const buildErrorText = (api: ApiPromise, mod: DispatchErrorModule) => {
  const { docs, index, name, section } = api.registry.findMetaError(mod)
  return `tx: ${section}.${name}: (${index}) ${docs.join(" ")}`
}

export const getRuntimeVersion = () => getApi().runtimeVersion

export const createType = <T extends Codec = Codec, K extends string = string>(
  type: K,
  ...params: unknown[]
): DetectCodec<T, K> => registry.createType(type, ...params)

// slow, be careful
export const buildKeyringPair = (mnemonic: string) =>
  new Keyring({ type: "ed25519" }).createFromUri(mnemonic)
