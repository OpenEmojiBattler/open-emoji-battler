import { readFileSync } from "fs"
import { resolve } from "path"

import { compactAddLength } from "@polkadot/util"
import { ContractPromise } from "@polkadot/api-contract"
import { tx, txContract, connect } from "common"
import { getEndpointAndPair, newCode } from "../utils"

const main = async () => {
  const { endpoint, keyringPair } = await getEndpointAndPair()

  const api = await connect(endpoint, false)
  await tx(
    api,
    (t) =>
      t.contracts.uploadCode(
        compactAddLength(
          newCode(api, "game", __dirname, "../../game/target/ink/game.contract").code
        ),
        null
      ),
    keyringPair
  )

  const abi = readFileFromFileRelativePath("../../game/target/ink/metadata.json")

  const gameContract = new ContractPromise(
    api,
    abi,
    JSON.parse(readFileFromFileRelativePath("./instantiatedAddress.game.production.json"))
  )

  await txContract(gameContract, "setCode", [JSON.parse(abi).source.hash], keyringPair)
}

const readFileFromFileRelativePath = (path: string) =>
  readFileSync(resolve(__dirname, path), "utf8")

main()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
