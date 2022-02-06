import BN from "bn.js"
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api"
import { TypeRegistry } from "@polkadot/types"

import type { SubmittableExtrinsic } from "@polkadot/api/types"
import type { SubmittableResult } from "@polkadot/api/submittable"
import type { IKeyringPair, Codec, DetectCodec } from "@polkadot/types/types"
import type { DispatchErrorModule } from "@polkadot/types/interfaces"

import { buildTypes, KeyringPairOrAddressAndSigner, extractTxArgs } from "./utils"

const registry = new TypeRegistry()
const types = buildTypes()
registry.register(types)

export const connected = async <T>(
  endpoint: string,
  f: (api: ApiPromise) => Promise<T>,
  withTypes = true
) => {
  let api: ApiPromise | null = null
  try {
    api = await connect(endpoint, withTypes)
    await f(api)
  } catch (e) {
    console.error(e)
  } finally {
    if (api) {
      await api.disconnect()
    }
  }
}

export const connect = (endpoint: string, withTypes = true) => {
  const provider = new WsProvider(endpoint)
  if (withTypes) {
    // if we don't pass `types` here,
    // it seems the types data will be cleared when the runtime upgrade occurs
    return ApiPromise.create({
      provider,
      registry,
      types,
    })
  } else {
    return ApiPromise.create({
      provider,
    })
  }
}

export const tx = (
  api: ApiPromise,
  f: (tx: ApiPromise["tx"]) => SubmittableExtrinsic<"promise">,
  account: KeyringPairOrAddressAndSigner,
  powSolution?: BN
) => {
  const [pairOrAddress, options] = extractTxArgs(account, powSolution)

  return new Promise<SubmittableResult>(async (resolve, reject) => {
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
          resolve(result)
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
  api: ApiPromise,
  f: (tx: ApiPromise["tx"]) => SubmittableExtrinsic<"promise">,
  account: IKeyringPair
) => tx(api, (tx) => api.tx.sudo.sudo(f(tx)), account)

const buildErrorText = (api: ApiPromise, mod: DispatchErrorModule) => {
  const { docs, index, name, section } = api.registry.findMetaError(mod)
  return `tx: ${section}.${name}: (${index}) ${docs.join(" ")}`
}

export const createType = <T extends Codec = Codec, K extends string = string>(
  type: K,
  ...params: unknown[]
): DetectCodec<T, K> => registry.createType(type, ...params)

// slow, be careful
export const buildKeyringPair = (mnemonic: string) =>
  new Keyring({ type: "ed25519" }).createFromUri(mnemonic)
