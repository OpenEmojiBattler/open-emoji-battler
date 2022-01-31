import { readFileSync } from "fs"
import path from "path"

import { txContract } from "common"
import { loadEmoBases } from "common/src/scriptUtils"
import { instantiateContract, getApiAndPair } from "../utils"

import availableEmoBaseIds from "./availableEmoBaseIds.json"

const main = async () => {
  const { envName, api, keyringPair } = await getApiAndPair()

  const storageContract = await instantiateContract(
    api,
    keyringPair,
    "storage",
    [],
    __dirname,
    envName
  )

  const logicContract = await instantiateContract(
    api,
    keyringPair,
    "logic",
    [storageContract.address.toString()],
    __dirname,
    envName
  )

  const forwarderContract = await instantiateContract(
    api,
    keyringPair,
    "forwarder",
    [logicContract.address.toString()],
    __dirname,
    envName
  )

  await txContract(storageContract, "allowAccount", [logicContract.address.toString()], keyringPair)
  await txContract(
    logicContract,
    "allowAccount",
    [forwarderContract.address.toString()],
    keyringPair
  )

  const bases = loadEmoBases(readFileSync(path.resolve(__dirname, "./emoBases.json"), "utf8"))
  await txContract(
    logicContract,
    "updateEmoBases",
    [bases.toU8a(), availableEmoBaseIds.fixed, availableEmoBaseIds.built, true],
    keyringPair
  )
}

main().catch(console.error).finally(process.exit)
