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
      const gameContract = await instantiateContract(
        api,
        keyringPair,
        "game",
        [],
        __dirname,
        envName,
        "../../game/target/ink/game.contract"
      )

      await txContract(
        gameContract,
        "updateEmoBases",
        [
          loadEmoBases(
            readFileSync(path.resolve(__dirname, "../../../data/emoBases.json"), "utf8")
          ).toU8a(),
          availableEmoBaseIds.fixed,
          availableEmoBaseIds.built,
          true,
        ],
        keyringPair
      )
    },
    false
  )
}

main().catch(console.error).finally(process.exit)
