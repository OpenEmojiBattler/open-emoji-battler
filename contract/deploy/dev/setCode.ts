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
        readFileFromFileRelativePath("../../game/target/ink/metadata.json"),
        JSON.parse(readFileFromFileRelativePath("./instantiatedAddress.game.production.json"))
      )

      await txContract(
        gameContract,
        "setCode",
        ["0xd58d432a8f520344536db2a63d8e41902b482d2df800763ed1ec531925d3aa32"],
        keyringPair
      )
    },
    false
  )
}

const readFileFromFileRelativePath = (path: string) =>
  readFileSync(resolve(__dirname, path), "utf8")

main().catch(console.error).finally(process.exit)
