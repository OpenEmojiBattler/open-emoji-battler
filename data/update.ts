import { query, connected, sudo } from "common"
import { getEndpointAndKeyringPair } from "common/src/scriptUtils"

import { loadEmoBases } from "./utils"

import availableEmoBaseIds from "./availableEmoBaseIds.json"

const main = async () => {
  const { endpoint, keyringPair } = await getEndpointAndKeyringPair(
    process.argv[2],
    process.argv[3]
  )

  await connected(endpoint, async () => {
    const {
      baseIds: oldBaseIds,
      fixedIds: oldFixedIds,
      builtIds: oldBuiltIds,
    } = await getCurrentIds()

    const h = await sudo(
      (t) =>
        t.game.updateEmoBases(
          loadEmoBases(),
          availableEmoBaseIds.fixed,
          availableEmoBaseIds.built,
          false
        ),
      keyringPair
    )
    console.log(h.toString())

    const {
      baseIds: newBaseIds,
      fixedIds: newFixedIds,
      builtIds: newBuiltIds,
    } = await getCurrentIds()

    console.log("bases")
    showDiff(oldBaseIds, newBaseIds)
    console.log("fixed")
    showDiff(oldFixedIds, newFixedIds)
    console.log("built")
    showDiff(oldBuiltIds, newBuiltIds)
  })
}

const getCurrentIds = async () => {
  const baseIds = Array.from((await query((q) => q.game.emoBases())).unwrap()[0].keys()).map((id) =>
    id.toString()
  )
  const fixedIds = (await query((q) => q.game.deckFixedEmoBaseIds()))
    .unwrap()
    .toArray()
    .map((id) => id.toString())
  const builtIds = (await query((q) => q.game.deckBuiltEmoBaseIds()))
    .unwrap()
    .toArray()
    .map((id) => id.toString())

  return { baseIds, fixedIds, builtIds }
}

const showDiff = <T>(oldArr: T[], newArr: T[]) => {
  const added = newArr.filter((n) => !oldArr.includes(n))
  const deleted = oldArr.filter((n) => !newArr.includes(n))
  console.log(`added: ${added.join(", ")}, deleted: ${deleted.join(", ")}`)
}

main().catch(console.error)
