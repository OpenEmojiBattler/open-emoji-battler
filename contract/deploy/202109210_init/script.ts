import { readFileSync } from "fs"
import { resolve } from "path"

import { txContract, connect } from "common"
import { loadEmoBases } from "common/src/scriptUtils"
import { instantiateContract, getEndpointAndPair } from "../utils"

const main = async () => {
  const { envName, endpoint, keyringPair } = await getEndpointAndPair()

  const api = await connect(endpoint, false)
  const gameContract = await instantiateContract(
    api,
    keyringPair,
    "game",
    [],
    __dirname,
    envName,
    "../../game/target/ink/game.contract" // remove this later
  )

  const availableEmoBaseIds = JSON.parse(readFileFromFileRelativePath("./availableEmoBaseIds.json"))

  await txContract(
    gameContract,
    "updateEmoBases",
    [
      loadEmoBases(readFileFromFileRelativePath("./emoBases.json")).toU8a(),
      availableEmoBaseIds.fixed,
      availableEmoBaseIds.built,
      true,
    ],
    keyringPair
  )
}

const readFileFromFileRelativePath = (path: string) =>
  readFileSync(resolve(__dirname, path), "utf8")

main()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
