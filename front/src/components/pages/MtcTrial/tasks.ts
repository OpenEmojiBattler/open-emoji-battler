import { createType } from "common"

import type { EmoBases } from "~/misc/types"
import { buildInitialMtcState, getDefaultDeck } from "~/misc/mtcUtils"
import { buildPool } from "~/wasm"
import { sampleArray } from "~/misc/utils"
import { GlobalAsync } from "~/components/App/ChainProvider/tasks"

export const buildMtcState = (globalAsync: GlobalAsync) =>
  Promise.all([
    globalAsync.api.query.game.deckBuiltEmoBaseIds(),
    globalAsync.api.query.game.deckFixedEmoBaseIds(),
    globalAsync.api.query.game.matchmakingGhosts(1000 / 100),
  ]).then(([_builtIds, _fixedIds, matchmakingGhosts]) => {
    const builtEmoBaseIds = _builtIds.unwrap().map((id) => id.toString())
    const fixedEmoBaseIds = _fixedIds.unwrap().map((id) => id.toString())

    if (matchmakingGhosts.isNone || matchmakingGhosts.unwrap().length < 3) {
      throw new Error("not enough ghosts")
    }
    const _ghosts = sampleArray(matchmakingGhosts.unwrap().toArray(), 3)
    const ghosts = createType(
      "Vec<mtc_Ghost>",
      _ghosts.map(([_a, _e, ghost]) => ghost)
    )
    const addressesAndEps = _ghosts.map(([a, e, _]) => ({
      address: a.toString(),
      ep: e.toNumber(),
    }))

    const deckEmoBaseIds = getDefaultDeck(globalAsync.emoBases, builtEmoBaseIds)

    const pool = buildPool(deckEmoBaseIds, globalAsync.emoBases, fixedEmoBaseIds, builtEmoBaseIds)
    const seed = getSeed()

    return buildInitialMtcState(1000, seed, pool, ghosts, addressesAndEps)
  })

export const getSeed = () => `${Math.round(Math.random() * 10000)}`
