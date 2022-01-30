import type { ApiPromise } from "@polkadot/api"
import { createType } from "common"

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

export const getCurrentIds = async (api: ApiPromise) => {
  const baseIds = Array.from((await api.query.game.emoBases()).unwrap()[0].keys()).map((id) =>
    id.toString()
  )
  const fixedIds = (await api.query.game.deckFixedEmoBaseIds())
    .unwrap()
    .toArray()
    .map((id) => id.toString())
  const builtIds = (await api.query.game.deckBuiltEmoBaseIds())
    .unwrap()
    .toArray()
    .map((id) => id.toString())

  return { baseIds, fixedIds, builtIds }
}
