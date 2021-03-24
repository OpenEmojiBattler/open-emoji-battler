import { createType, query } from "common"

import type { EmoBases } from "~/misc/types"
import { buildInitialMtcState, getDefaultDeck } from "~/misc/mtcUtils"
import { buildPool } from "~/wasm"

export const buildMtcState = (bases: EmoBases) =>
  Promise.all([
    query((q) => q.game.deckBuiltEmoBaseIds()),
    query((q) => q.game.deckFixedEmoBaseIds()),
    query((q) => q.game.matchmakingGhosts(1000 / 100)),
  ]).then(([_builtIds, _fixedIds, _ghosts]) => {
    const builtEmoBaseIds = _builtIds.unwrap().map((id) => id.toString())
    const fixedEmoBaseIds = _fixedIds.unwrap().map((id) => id.toString())
    const ghosts = createType(
      "Vec<mtc_Ghost>",
      _ghosts
        .unwrap()
        .toArray()
        .slice(0, 3)
        .map(([_a, _e, ghost]) => ghost)
    )

    if (ghosts.length !== 3) {
      throw new Error(`enough ghost not found: ${ghosts.length}`)
    }

    const deckEmoBaseIds = getDefaultDeck(bases, builtEmoBaseIds)

    const pool = buildPool(deckEmoBaseIds, bases, fixedEmoBaseIds, builtEmoBaseIds)
    const seed = getSeed()

    return buildInitialMtcState(1000, seed, pool, ghosts, [
      { address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", ep: 1000 }, // alice
      { address: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", ep: 1000 }, // bob
      { address: "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y", ep: 1000 }, // charlie
    ])
  })

export const getSeed = () => `${Math.round(Math.random() * 10000)}`
