import { createType, query } from "common"

import emoBases from "./emoBases.json"

export const loadEmoBases = () => {
  const basesMap = new Map()

  const usedIds: number[] = []
  for (const m of emoBases) {
    const id = m.id

    if (usedIds.includes(id)) {
      throw new Error(`found id duplication: ${id}`)
    }
    usedIds.push(id)

    basesMap.set(id, m)
  }

  return createType("emo_Bases", [basesMap])
}

export const getCurrentIds = async () => {
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
