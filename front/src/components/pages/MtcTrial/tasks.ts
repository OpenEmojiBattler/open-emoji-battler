import { sampleArray, createType } from "common"

import { buildInitialMtcState, getDefaultDeck } from "~/misc/mtcUtils"
import { buildPool } from "~/wasm"
import { Connection } from "~/components/App/ConnectionProvider/tasks"
import { initialEp, initialPlayerHealth } from "~/misc/constants"
import { get_upgrade_coin } from "~/wasm/raw"

export const buildMtcState = async (connection: Connection) => {
  const epBand = initialEp / 100

  const [_builtIds, _fixedIds, ghostsInfoOpt] = await Promise.all([
    connection.query.deckBuiltEmoBaseIds(),
    connection.query.deckFixedEmoBaseIds(),
    connection.query.matchmakingGhostsInfo(epBand),
  ])
  const builtEmoBaseIds = _builtIds.map((id) => id.toString())
  const fixedEmoBaseIds = _fixedIds.map((id) => id.toString())

  if (ghostsInfoOpt.isNone || ghostsInfoOpt.unwrap().length < 3) {
    throw new Error("not enough ghosts")
  }

  const ghostAddressesAndIndexes = sampleArray(
    ghostsInfoOpt
      .unwrap()
      .toArray()
      .map(([_, a], i) => [a.toString(), i] as const),
    3
  )

  const ghosts = createType(
    "Vec<mtc_Ghost>",
    await Promise.all(
      ghostAddressesAndIndexes.map(([_, ghostIndex]) =>
        connection.query.matchmakingGhostByIndex(epBand, ghostIndex)
      )
    ).then((gs) => gs.map((g) => g.unwrap()))
  )

  const deckEmoBaseIds = getDefaultDeck(connection.emoBases, builtEmoBaseIds)

  const pool = buildPool(deckEmoBaseIds, connection.emoBases, fixedEmoBaseIds, builtEmoBaseIds)
  const seed = getSeed()

  return buildInitialMtcState(
    initialEp,
    seed,
    pool,
    ghosts,
    ghostAddressesAndIndexes.map(([a, _]) => a),
    initialPlayerHealth,
    get_upgrade_coin(2) || null,
    createType("Vec<mtc_GhostState>", [initialGhostState, initialGhostState, initialGhostState]),
    0
  )
}

export const getSeed = () => `${Math.round(Math.random() * 10000)}`

const initialGhostState = { Active: { health: 20 } }
