import { readFileSync } from "fs"
import { WsProvider, ApiPromise } from "@polkadot/api"
import { CodePromise, ContractPromise } from "@polkadot/api-contract"
import { Keyring } from "@polkadot/keyring"
import { cryptoWaitReady } from "@polkadot/util-crypto"
import type { IKeyringPair } from "@polkadot/types/types"

export const instantiateContract = async (
  api: ApiPromise,
  pair: IKeyringPair,
  contractFileName: string,
  constructorArgs: any[]
) => {
  const contractJson = readFileSync(contractFileName, "utf8")

  const code = new CodePromise(api, contractJson, null)

  const endowment = 1000000000n * 1000000n
  const gasLimit = 200000n * 1000000n

  const contract: ContractPromise = await new Promise(async (resolve, reject) => {
    const unsub = await code.tx
      .new(endowment, gasLimit, ...constructorArgs)
      .signAndSend(pair, (result) => {
        if (result.status.isInBlock) {
          unsub()
          if (result.findRecord("system", "ExtrinsicSuccess")) {
            const c: ContractPromise = (result as any).contract
            console.log(`contract instantiated: ${contractFileName} ${c.address.toString()}`)
            resolve(c)
            return
          } else {
            reject(`contract instantiation error: ${contractFileName}`)
            return
          }
        }
      })
  })

  return contract
}

export const getContract = (api: ApiPromise, metadataFileName: string, address: string) => {
  const metadataJson = readFileSync(metadataFileName, "utf8")
  return new ContractPromise(api, metadataJson, address)
}

export const query = async (
  contract: ContractPromise,
  fnName: string,
  fnArgs: any[],
  caller: string
) => {
  const { gasConsumed, result, output } = await contract.query[fnName](
    caller,
    { value: 0, gasLimit: -1 },
    ...fnArgs
  )
  if (result.isOk) {
    console.log(
      `query success: ${fnName} (gasConsumed: ${gasConsumed.toBigInt()}), returned: ${
        output ? output.toHuman() : ""
      }`
    )
    return output
  } else {
    throw new Error(`query error: ${fnName}, error: ${result.asErr.toHuman()}`)
  }
}

export const tx = (pair: IKeyringPair, contract: ContractPromise, fnName: string, fnArgs: any[]) =>
  new Promise(async (resolve, reject) => {
    if (!contract.tx[fnName]) {
      reject(`tx fn not found: ${fnName}`)
      return
    }
    const unsub = await contract.tx[fnName](
      { value: 0, gasLimit: 100000n * 1000000n },
      ...fnArgs
    ).signAndSend(pair, (result) => {
      if (result.status.isInBlock) {
        unsub()
        if (result.findRecord("system", "ExtrinsicSuccess")) {
          console.log(`tx success: ${fnName}`)
          resolve(`tx success: ${fnName}`)
          return
        } else {
          reject(`tx error: ${fnName}`)
          return
        }
      }
    })
  })

export const getApiAndPair = async () => {
  const wsProvider = new WsProvider("ws://127.0.0.1:9944")
  const api = await ApiPromise.create({
    provider: wsProvider,
  })

  await cryptoWaitReady()
  const keyring = new Keyring({ ss58Format: 42, type: "sr25519" })
  const pair = keyring.addFromUri("//Alice")

  return { api, pair }
}
