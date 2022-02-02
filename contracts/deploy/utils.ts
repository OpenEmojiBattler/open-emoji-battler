import { readFileSync, writeFileSync } from "fs"
import path from "path"

import { tx } from "common"

import { WsProvider, ApiPromise } from "@polkadot/api"
import { CodePromise, ContractPromise } from "@polkadot/api-contract"
import type { IKeyringPair } from "@polkadot/types/types"

import { getContractEnvAndKeyringPair } from "common/src/scriptUtils"

// const SDN = 1_000_000_000_000_000_000n
// const MILLISDN = SDN / 1_000n

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

  const contract = (
    (await tx(
      api,
      () => code.tx.new({ gasLimit: 200_000n * 1_000_000n }, ...constructorArgs),
      pair
    )) as any
  ).contract as ContractPromise

  writeFileSync(
    path.resolve(dirname, `./instantiatedAddress.${contractName}.${envName}.json`),
    `${JSON.stringify(contract.address.toString())}\n`
  )

  console.log(`contract instantiated: ${contractName} ${contract.address.toString()}`)

  return contract
}

export const getContract = (
  api: ApiPromise,
  contractName: string,
  address: string,
  dirname: string
) => {
  const abi = readFileSync(path.resolve(dirname, `./${contractName}.json`), "utf8")
  return new ContractPromise(api, abi, address)
}

export const query = async (
  contract: ContractPromise,
  fnName: string,
  fnArgs: any[],
  caller: string
) => {
  const { gasRequired, result, output, storageDeposit } = await contract.query[fnName](
    caller,
    { value: 0 },
    ...fnArgs
  )
  if (result.isOk) {
    console.log(
      `query success: ${fnName} (gasRequired: ${gasRequired.toBigInt()}, storageDeposit: ${storageDeposit.toHuman()}), returned: ${
        output ? output.toHuman() : ""
      }`
    )
    return output
  } else {
    throw new Error(`query error: ${fnName}, error: ${result.asErr.toHuman()}`)
  }
}

export const getEndpointAndPair = async () => {
  const envName = process.argv[2]
  const { contract, keyringPair } = await getContractEnvAndKeyringPair(envName, process.argv[3])

  return { envName, endpoint: contract.endpoint, keyringPair }
}
