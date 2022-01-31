import { readFileSync } from "fs"
import { connected, sudo } from "common"
import { loadEmoBases, getChainEndpointAndKeyringPair } from "common/src/scriptUtils"

import { getCurrentIds } from "./utils"

import availableEmoBaseIds from "./availableEmoBaseIds.json"

const main = async () => {
  const { endpoint, keyringPair } = await getChainEndpointAndKeyringPair(
    process.argv[2],
    process.argv[3]
  )
  const bases = loadEmoBases(readFileSync("./emoBases.json", "utf8"))

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
