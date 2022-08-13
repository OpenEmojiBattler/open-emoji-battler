import { createType } from "common"

import { buildInitialMtcState, getDefaultDeck } from "~/misc/mtcUtils"
import { buildPool } from "~/wasm"
import { sampleArray } from "~/misc/utils"
import { Connection } from "~/components/App/ConnectionProvider/tasks"
import { initialEp } from "~/misc/constants"

export const buildMtcState = (connection: Connection) =>
  Promise.all([
    connection.query.deckBuiltEmoBaseIds(),
    connection.query.deckFixedEmoBaseIds(),
    connection.query.matchmakingGhosts(initialEp / 100),
  ]).then(([_builtIds, _fixedIds, matchmakingGhosts]) => {
    const builtEmoBaseIds = _builtIds.map((id) => id.toString())
    const fixedEmoBaseIds = _fixedIds.map((id) => id.toString())

    if (matchmakingGhosts.isNone || matchmakingGhosts.unwrap().length < 3) {
      throw new Error("not enough ghosts")
    }
    const _ghosts = sampleArray(matchmakingGhosts.unwrap().toArray(), 3)
    const ghosts = createType(
      "Vec<mtc_Ghost>",
      _ghosts.map(([_a, _e, ghost]) => ghost)
    )
    const addresses = _ghosts.map(([a, _e, _]) => a.toString())

    const deckEmoBaseIds = getDefaultDeck(connection.emoBases, builtEmoBaseIds)

    const pool = buildPool(deckEmoBaseIds, connection.emoBases, fixedEmoBaseIds, builtEmoBaseIds)
    const seed = getSeed()

    return buildInitialMtcState(initialEp, seed, pool, ghosts, addresses)
  })

export const getSeed = () => `${Math.round(Math.random() * 10000)}`
