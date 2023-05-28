import type { ApiPromise } from "@polkadot/api"
import type { SignerOptions } from "@polkadot/api/submittable/types"
import { ContractPromise } from "@polkadot/api-contract"

import { tx, buildErrorText, createType } from "./api"
import type { KeyringPairOrAddressAndSigner } from "./utils"

import gameAbi from "../../../contract/deploy/202109210_init/game.json"

export const getGameContract = (api: ApiPromise, address: string) =>
  new ContractPromise(api, gameAbi, address)

export const queryContract = async (
  contract: ContractPromise,
  fnName: string,
  fnArgs: any[] = [],
  caller = "5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM" // zero address
) => {
  if (!contract.query[fnName]) {
    throw new Error(`query fn not found: ${fnName}`)
  }

  const { result, output } = await contract.query[fnName](
    caller,
    {
      gasLimit: contractBigWeight,
      value: 0,
    },
    ...fnArgs
  )

  if (!result.isOk) {
    throw new Error(
      `query error: ${fnName}, error: ${buildErrorText(contract.api as ApiPromise, result.asErr)}`
    )
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
  account: KeyringPairOrAddressAndSigner,
  overrideOptions?: Partial<SignerOptions>
) => {
  if (!contract.tx[fnName]) {
    throw new Error(`tx fn not found: ${fnName}`)
  }

  return tx(
    contract.api as ApiPromise,
    () => contract.tx[fnName]({ gasLimit: contractBigWeight, value: 0 }, ...fnArgs),
    account,
    undefined,
    { tip: 1, ...overrideOptions }
  )
}

export const contractBigWeight = createType("WeightV2", {
  proofSize: 3_000_000,
  refTime: 300_000_000_000,
})
