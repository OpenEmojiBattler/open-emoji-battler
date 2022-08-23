import { readFileSync } from "fs"
import path from "path"

import { randomAsU8a } from "@polkadot/util-crypto"
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
        "../../game/target/ink/game.contract",
        randomAsU8a()
      )
      // const gameContract = new ContractPromise(
      //   api,
      //   readFileSync(path.resolve(__dirname, `../202109210_init/game.json`), "utf8"),
      //   JSON.parse(
      //     readFileSync(path.resolve(__dirname, "./instantiatedAddress.game.local.json"), "utf8")
      //   )
      // )

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
