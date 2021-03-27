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
