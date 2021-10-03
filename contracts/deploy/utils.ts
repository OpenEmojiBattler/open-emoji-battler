import { readFileSync, writeFileSync } from "fs"
import path from "path"

import { WsProvider, ApiPromise } from "@polkadot/api"
import { CodePromise, ContractPromise } from "@polkadot/api-contract"
import type { IKeyringPair } from "@polkadot/types/types"

import { getContractsEndpointAndKeyringPair } from "common/src/scriptUtils"

const SDN = 1_000_000_000_000_000_000n
const MILLISDN = SDN / 1_000n

export const instantiateContract = async (
  api: ApiPromise,
  pair: IKeyringPair,
  contractName: string,
  constructorArgs: any[],
  dirname: string,
  envName: string
) => {
  const abi = readFileSync(path.resolve(dirname, `./${contractName}.json`), "utf8")
  const wasm = readFileSync(path.resolve(dirname, `./${contractName}.wasm`))

  const code = new CodePromise(api, abi, wasm)

  const endowment = 100n * MILLISDN
  const gasLimit = 200000n * 1000000n

  const contract: ContractPromise = await new Promise(async (resolve, reject) => {
    const unsub = await code.tx
      .new(endowment, gasLimit, ...constructorArgs)
      .signAndSend(pair, (result) => {
        if (result.status.isInBlock) {
          unsub()
          if (result.findRecord("system", "ExtrinsicSuccess")) {
            const c: ContractPromise = (result as any).contract
            resolve(c)
            return
          } else {
            reject(`contract instantiation error: ${contractName}`)
            return
          }
        }
      })
  })

  writeFileSync(
    path.resolve(dirname, `./instantiatedAddress.${contractName}.${envName}.json`),
    `${JSON.stringify(contract.address.toString())}\n`
  )

  console.log(`contract instantiated: ${contractName} ${contract.address.toString()}`)

  return contract
}

export const getContract = (api: ApiPromise, contractFileName: string, address: string) => {
  const abi = readFileSync(`${contractFileName}.json`, "utf8")
  return new ContractPromise(api, abi, address)
}

export const query = async (
  contract: ContractPromise,
  fnName: string,
  fnArgs: any[],
  caller: string
) => {
  const { gasRequired, result, output } = await contract.query[fnName](
    caller,
    { value: 0, gasLimit: -1 },
    ...fnArgs
  )
  if (result.isOk) {
    console.log(
      `query success: ${fnName} (gasRequired: ${gasRequired.toBigInt()}), returned: ${
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
  const envName = process.argv[2]
  const { endpoint, keyringPair } = await getContractsEndpointAndKeyringPair(
    envName,
    process.argv[3]
  )

  const wsProvider = new WsProvider(endpoint)
  const api = await ApiPromise.create({
    provider: wsProvider,
  })

  return { envName, api, keyringPair }
}
