import BN from "bn.js"

import { createType, mtc_Board } from "common"

import type { EmoBases } from "~/misc/types"
import { withToggleAsync, checkArraysEquality } from "~/misc/utils"
import { isDevelopment } from "~/misc/env"
import { finishBattle, MtcState, buildInitialMtcState, ResultState } from "~/misc/mtcUtils"
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

    const [seed, _pool, _ghosts] = await Promise.all([
      getSeed(connection, account.address),
      connection.query.playerPool(account.address),
      connection.query.playerGhosts(account.address),
    ])

    const pool = _pool.unwrap()

    const ghosts = createType(
      "Vec<mtc_Ghost>",
      _ghosts.unwrap().map(([_a, _e, ghost]) => ghost)
    )
    const ghostAddressesAndEps = _ghosts.unwrap().map(([address, ep, _g]) => ({
      address: address.toString(),
      ep: ep.toNumber(),
    }))

    return buildInitialMtcState(previousEp, seed, pool, ghosts, ghostAddressesAndEps)
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
      resultState: connection.query.playerEp(account.address).then((ep) => ({
        place,
        ep: ep.unwrap().toNumber(),
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

  connection.query.playerPool(address).then((p) => {
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

  connection.query.playerHealth(address).then((h) => {
    const subHealth = h.unwrap().toNumber()
    if (health !== subHealth) {
      throw new Error(`state diff found for health (front: ${health}, sub: ${subHealth})`)
    }
  })
  connection.query.playerGradeAndBoardHistory(address).then((_subBoards) => {
    const subBoards = _subBoards.unwrap()
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
