import { readFileSync } from "fs"
import path from "path"

import { txContract, connected } from "common"
import { loadEmoBases } from "common/src/scriptUtils"
import { instantiateContract, getEndpointAndPair } from "../utils"

import availableEmoBaseIds from "../../../data/availableEmoBaseIds.json"

const main = async () => {
  const { envName, endpoint, keyringPair } = await getEndpointAndPair()

  await connected(
    endpoint,
    async (api) => {
      const storageContract = await instantiateContract(
        api,
        keyringPair,
        "storage",
        [],
        __dirname,
        envName,
        "../../target/ink/storage/storage.contract"
      )

      const logicContract = await instantiateContract(
        api,
        keyringPair,
        "logic",
        [storageContract.address.toString()],
        __dirname,
        envName,
        "../../target/ink/logic/logic.contract"
      )

      const forwarderContract = await instantiateContract(
        api,
        keyringPair,
        "forwarder",
        [logicContract.address.toString()],
        __dirname,
        envName,
        "../../target/ink/forwarder/forwarder.contract"
      )

      await txContract(
        storageContract,
        "allowAccount",
        [logicContract.address.toString()],
        keyringPair
      )
      await txContract(
        logicContract,
        "allowAccount",
        [forwarderContract.address.toString()],
        keyringPair
      )

      const bases = loadEmoBases(
        readFileSync(path.resolve(__dirname, "../../../data/emoBases.json"), "utf8")
      )
      await txContract(
        logicContract,
        "updateEmoBases",
        [bases.toU8a(), availableEmoBaseIds.fixed, availableEmoBaseIds.built, true],
        keyringPair
      )
    },
    false
  )
}

main().catch(console.error).finally(process.exit)
