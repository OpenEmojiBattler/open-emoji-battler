import type { ApiPromise } from "@polkadot/api"
import { ContractPromise } from "@polkadot/api-contract"

import { tx } from "./api"
import type { KeyringPairOrAddressAndSigner } from "./utils"

import storageAbi from "../../../contracts/deploy/202109210_init/storage.json"
import forwarderAbi from "../../../contracts/deploy/202109210_init/forwarder.json"

export const getStorageContract = (api: ApiPromise, address: string) =>
  new ContractPromise(api, storageAbi, address)

export const getForwarderContract = (api: ApiPromise, address: string) =>
  new ContractPromise(api, forwarderAbi, address)

export const queryContract = async (
  contract: ContractPromise,
  fnName: string,
  fnArgs: any[],
  caller: string
) => {
  if (!contract.query[fnName]) {
    throw new Error(`query fn not found: ${fnName}`)
  }

  const { result, output } = await contract.query[fnName](caller, { value: 0 }, ...fnArgs)

  if (!result.isOk) {
    throw new Error(`query error: ${fnName}, error: ${result.asErr.toHuman()}`)
  }
  if (!output) {
    throw new Error(`query output null: ${fnName}}`)
  }

  return output
}

export const txContract = (
  contract: ContractPromise,
  fnName: string,
  fnArgs: any[],
  account: KeyringPairOrAddressAndSigner
) => {
  if (!contract.tx[fnName]) {
    throw new Error(`tx fn not found: ${fnName}`)
  }

  return tx(
    contract.api as ApiPromise,
    // should have gasLimit?
    () => contract.tx[fnName]({ value: 0 }, ...fnArgs),
    account
  )
}
