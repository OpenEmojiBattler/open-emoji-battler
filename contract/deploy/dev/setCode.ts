import { readFileSync } from "fs"
import { resolve } from "path"

import { ContractPromise } from "@polkadot/api-contract"
import { txContract, connected } from "common"
import { getEndpointAndPair } from "../utils"

const main = async () => {
  const { endpoint, keyringPair } = await getEndpointAndPair()

  await connected(
    endpoint,
    async (api) => {
      const gameContract = new ContractPromise(
        api,
        readFileFromFileRelativePath(`../202109210_init/game.json`),
        JSON.parse(
          readFileFromFileRelativePath("../202109210_init/instantiatedAddress.game.production.json")
        )
      )

      await txContract(
        gameContract,
        "setCode",
        ["0xa1abd350d2fc6df5bda314404d5f9c2e91c2660b7b10a577434b620fa9b1408c"],
        keyringPair
      )
    },
    false
  )
}

const readFileFromFileRelativePath = (path: string) =>
  readFileSync(resolve(__dirname, path), "utf8")

main().catch(console.error).finally(process.exit)
