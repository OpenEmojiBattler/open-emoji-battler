import { connected, sudo } from "common"
import { getEndpointAndKeyringPair } from "common/src/scriptUtils"

import { loadEmoBases, getCurrentIds } from "./utils"

import availableEmoBaseIds from "./availableEmoBaseIds.json"

const main = async () => {
  const { endpoint, keyringPair } = await getEndpointAndKeyringPair(
    process.argv[2],
    process.argv[3]
  )
  const emoBases = loadEmoBases()

  await connected(endpoint, async () => {
    const {
      baseIds: oldBaseIds,
      fixedIds: oldFixedIds,
      builtIds: oldBuiltIds,
    } = await getCurrentIds()

    const h = await sudo(
      (t) =>
        t.game.updateEmoBases(
          emoBases,
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

const showDiff = <T>(oldArr: T[], newArr: T[]) => {
  const added = newArr.filter((n) => !oldArr.includes(n))
  const deleted = oldArr.filter((n) => !newArr.includes(n))
  console.log(`added: ${added.join(", ")}, deleted: ${deleted.join(", ")}`)
}

main().catch(console.error)
