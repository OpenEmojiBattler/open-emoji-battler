import { createType, query, connected, sudo } from "common"
import { getEndpointAndKeyringPair } from "common/src/scriptUtils"

import emoBases from "./emoBases.json"
import availableEmoBaseIds from "./availableEmoBaseIds.json"

const main = async () => {
  const { endpoint, keyringPair } = await getEndpointAndKeyringPair(
    process.argv[2],
    process.argv[3]
  )

  await connected(endpoint, async () => {
    const basesMap = new Map()
    for (const m of emoBases) {
      basesMap.set(m.id, m)
    }
    const bases = createType("emo_Bases", [basesMap])

    const fixedBaseIds = availableEmoBaseIds.fixed
    const builtBaseIds = availableEmoBaseIds.built

    const h = await sudo(
      (t) => t.game.updateEmoBases(bases, fixedBaseIds, builtBaseIds, true),
      keyringPair
    )

    console.log(h.toString())

    console.log("bases", (await query((q) => q.game.emoBases())).unwrap().toJSON())
    console.log("fixed", (await query((q) => q.game.deckFixedEmoBaseIds())).unwrap().toJSON())
    console.log("built", (await query((q) => q.game.deckBuiltEmoBaseIds())).unwrap().toJSON())
  })
}

main().catch(console.error)
