import { createType } from "common"

import { buildInitialMtcState, getDefaultDeck } from "~/misc/mtcUtils"
import { buildPool } from "~/wasm"
import { sampleArray } from "~/misc/utils"
import { Connection } from "~/components/App/ConnectionProvider/tasks"
import { initialEp, initialPlayerHealth } from "~/misc/constants"
import { get_upgrade_coin } from "~/wasm/raw"

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
    const ghostAddresses = _ghosts.map(([a, _e, _]) => a.toString())

    const deckEmoBaseIds = getDefaultDeck(connection.emoBases, builtEmoBaseIds)

    const pool = buildPool(deckEmoBaseIds, connection.emoBases, fixedEmoBaseIds, builtEmoBaseIds)
    const seed = getSeed()

    return buildInitialMtcState(
      initialEp,
      seed,
      pool,
      ghosts,
      ghostAddresses,
      initialPlayerHealth,
      get_upgrade_coin(2) || null,
      createType("Vec<mtc_GhostState>", [initialGhostState, initialGhostState, initialGhostState]),
      0
    )
  })

export const getSeed = () => `${Math.round(Math.random() * 10000)}`

const initialGhostState = { Active: { health: 20 } }
