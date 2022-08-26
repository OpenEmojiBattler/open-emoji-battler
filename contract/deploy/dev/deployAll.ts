import { readFileSync } from "fs"
import { resolve } from "path"

import { randomAsU8a } from "@polkadot/util-crypto"
import { txContract, connected } from "common"
import { loadEmoBases } from "common/src/scriptUtils"
import { instantiateContract, getEndpointAndPair } from "../utils"

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
        getPathFromFileRelativePath("../../game/target/ink/game.contract"),
        randomAsU8a()
      )

      const availableEmoBaseIds = JSON.parse(
        readFileSync(
          getPathFromFileRelativePath("../202109210_init/availableEmoBaseIds.json"),
          "utf8"
        )
      )

      await txContract(
        gameContract,
        "updateEmoBases",
        [
          loadEmoBases(
            readFileSync(getPathFromFileRelativePath("../202109210_init/emoBases.json"), "utf8")
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

const getPathFromFileRelativePath = (path: string) => resolve(__dirname, path)

main().catch(console.error).finally(process.exit)
