import type { ApiPromise } from "@polkadot/api"

export const getCurrentDataIds = async (api: ApiPromise) => {
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
