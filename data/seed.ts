import { connected, sudo } from "common"
import { getEndpointAndKeyringPair } from "common/src/scriptUtils"

import { loadEmoBases, getCurrentIds } from "./utils"

import availableEmoBaseIds from "./availableEmoBaseIds.json"

const main = async () => {
  const { endpoint, keyringPair } = await getEndpointAndKeyringPair(
    process.argv[2],
    process.argv[3]
  )
  const bases = loadEmoBases()

  await connected(endpoint, async () => {
    const h = await sudo(
      (t) =>
        t.game.updateEmoBases(bases, availableEmoBaseIds.fixed, availableEmoBaseIds.built, true),
      keyringPair
    )

    console.log(h.toString())

    const { baseIds, fixedIds, builtIds } = await getCurrentIds()
    console.log(baseIds, fixedIds, builtIds)
  })
}

main().catch(console.error)
