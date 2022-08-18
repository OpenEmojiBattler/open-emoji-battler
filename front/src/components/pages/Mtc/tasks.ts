import BN from "bn.js"

import { createType, mtc_Board } from "common"

import type { EmoBases } from "~/misc/types"
import { withToggleAsync, checkArraysEquality } from "~/misc/utils"
import { isDevelopment } from "~/misc/env"
import {
  finishBattle,
  MtcState,
  buildInitialMtcState,
  ResultState,
  getRankFromLeaderboardCodec,
} from "~/misc/mtcUtils"
import type { Account, Connection } from "~/components/App/ConnectionProvider/tasks"

export const start = (
  connection: Connection,
  account: Account,
  deckEmoBaseIds: string[],
  setWaiting: (b: boolean) => void,
  previousEp: number,
  solution?: BN
) => {
  if (connection.kind !== account.kind) {
    throw new Error("different kinds")
  }
  if (account.kind === "chain" ? !solution : !!solution) {
    throw new Error("invalid solution")
  }

  return withToggleAsync(setWaiting, async () => {
    await connection.tx.startMtc(deckEmoBaseIds, account, solution)

    const [seed, immutable, _mutable] = await Promise.all([
      getSeed(connection, account.address),
      connection.query.playerMtcImmutable(account.address),
      connection.query.playerMtcMutable(account.address),
    ])

    const [pool, _ghosts] = immutable.unwrap()

    const ghosts = createType(
      "Vec<mtc_Ghost>",
      _ghosts.map(([_a, ghost]) => ghost)
    )
    const ghostAddresses = _ghosts.map(([address, _e, _g]) => address.toString())

    const mutable = _mutable.unwrap()

    return buildInitialMtcState(
      previousEp,
      seed,
      pool,
      ghosts,
      ghostAddresses,
      mutable.health.toNumber(),
      mutable.upgrade_coin.isSome ? mutable.upgrade_coin.unwrap().toNumber() : null,
      mutable.ghost_states,
      mutable.battle_ghost_index.toNumber()
    )
  })
}

export const getSeed = (connection: Connection, address: string) =>
  connection.query.playerSeed(address).then((s) => {
    if (s.isNone) {
      throw new Error("no seed")
    }
    return s.unwrap().toString()
  })

export const finishBattleAndBuildState = (
  connection: Connection,
  account: Account,
  mtcState: MtcState,
  emoBases: EmoBases
): { mtcState: MtcState; resultState: Promise<ResultState> | null } => {
  const s = finishBattle(mtcState, emoBases)

  const place = s.finalPlace
  if (place) {
    ensureFinished(connection, account.address)
    return {
      mtcState: s.mtcState,
      resultState: Promise.all([
        connection.query.playerEp(account.address),
        connection.query.leaderboard(),
      ]).then(([ep, l]) => ({
        place,
        ep: ep.unwrap().toNumber(),
        rank: getRankFromLeaderboardCodec(l, account.address),
      })),
    }
  }

  ensureNoStateDiff(connection, account.address, s.mtcState.health, mtcState.board)

  return { mtcState: s.mtcState, resultState: null }
}

const ensureFinished = (connection: Connection, address: string) => {
  if (!isDevelopment) {
    return
  }

  connection.query.playerMtcMutable(address).then((p) => {
    if (p.isSome) {
      throw new Error("looks like not finished")
    }
  })
}

const ensureNoStateDiff = (
  connection: Connection,
  address: string,
  health: number,
  board: mtc_Board
) => {
  if (!isDevelopment) {
    return
  }

  connection.query.playerMtcMutable(address).then((m) => {
    const subHealth = m.unwrap().health.toNumber()
    if (health !== subHealth) {
      throw new Error(`state diff found for health (front: ${health}, sub: ${subHealth})`)
    }

    const subBoards = m.unwrap().grade_and_board_history
    const localIds = board.map((e) => e.mtc_emo_ids.map((i) => i.toString())).flat()
    const subIds = subBoards[subBoards.length - 1].board
      .map((e) => e.mtc_emo_ids.map((i) => i.toString()))
      .flat()
    if (!checkArraysEquality(localIds, subIds)) {
      throw new Error(
        `state diff found for board: local: ${localIds.join(",")}, sub: ${subIds.join(",")}`
      )
    }
  })
}
