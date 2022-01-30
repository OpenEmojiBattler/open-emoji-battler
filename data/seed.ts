import { connected, sudo } from "common"
import { getChainEndpointAndKeyringPair } from "common/src/scriptUtils"

import { loadEmoBases, getCurrentIds } from "./utils"

import availableEmoBaseIds from "./availableEmoBaseIds.json"

const main = async () => {
  const { endpoint, keyringPair } = await getChainEndpointAndKeyringPair(
    process.argv[2],
    process.argv[3]
  )
  const bases = loadEmoBases()

  await connected(endpoint, async (api) => {
    const h = await sudo(
      api,
      (t) =>
        t.game.updateEmoBases(bases, availableEmoBaseIds.fixed, availableEmoBaseIds.built, true),
      keyringPair
    )

    console.log(h.toString())

    const { baseIds, fixedIds, builtIds } = await getCurrentIds(api)
    console.log(baseIds, fixedIds, builtIds)
  })
}

main().catch(console.error)
