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
  const emoBases = loadEmoBases(readFileSync("./emoBases.json", "utf8"))

  await connected(endpoint, async (api) => {
    const {
      baseIds: oldBaseIds,
      fixedIds: oldFixedIds,
      builtIds: oldBuiltIds,
    } = await getCurrentIds(api)

    const h = await sudo(
      api,
      (t) =>
        t.game.updateEmoBases(
          emoBases,
          availableEmoBaseIds.fixed,
          availableEmoBaseIds.built,
          false
        ),
      keyringPair
    )
    console.log(h.status.asInBlock.toString())

    const {
      baseIds: newBaseIds,
      fixedIds: newFixedIds,
      builtIds: newBuiltIds,
    } = await getCurrentIds(api)

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
