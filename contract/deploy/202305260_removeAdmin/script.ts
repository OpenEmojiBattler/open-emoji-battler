// result: https://shiden.subscan.io/extrinsic/4096799-2

import { readFileSync } from "fs"
import { resolve } from "path"
import { ContractPromise } from "@polkadot/api-contract"

import { txContract, connect } from "common"
import { getEndpointAndPair } from "../utils"

const main = async () => {
  const { endpoint, keyringPair } = await getEndpointAndPair()

  await txContract(
    new ContractPromise(
      await connect(endpoint, false),
      readFileFromFileRelativePath("../202109210_init/game.json"),
      JSON.parse(
        readFileFromFileRelativePath("../202109210_init/instantiatedAddress.game.production.json")
      )
    ),
    "removeAdmin",
    [keyringPair.address],
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
