import { compactAddLength } from "@polkadot/util"

import { connected, tx } from "common"
import { getEndpointAndPair, newCode } from "../utils"

const main = async () => {
  const { endpoint, keyringPair } = await getEndpointAndPair()

  await connected(
    endpoint,
    async (api) => {
      const code = newCode(api, "game", __dirname, "../../game/target/ink/game.contract")

      await tx(api, (t) => t.contracts.uploadCode(compactAddLength(code.code), null), keyringPair)
    },
    false
  )
}

main().catch(console.error).finally(process.exit)
