import { compactAddLength } from "@polkadot/util"

import { connect, tx } from "common"
import { getEndpointAndPair, newCode } from "../utils"

const main = async () => {
  const { endpoint, keyringPair } = await getEndpointAndPair()

  const api = await connect(endpoint, false)
  const code = newCode(api, "game", __dirname, "../../game/target/ink/game.contract")

  await tx(api, (t) => t.contracts.uploadCode(compactAddLength(code.code), null), keyringPair)
}

main()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
