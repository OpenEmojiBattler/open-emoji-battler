import type { Vec } from "@polkadot/types"
import type { u16 } from "@polkadot/types/primitive"

import {
  createType,
  mtc_Emo,
  mtc_Ghost,
  mtc_Board,
  mtc_GhostBoard,
  mtc_GhostState,
  mtc_GradeAndGhostBoard,
} from "common"

import {
  add_emo,
  march_pvg,
  start_shop,
  sell_emo,
  move_emo,
  get_grade_and_ghost_board,
  get_catalog,
  select_battle_ghost_index,
  battle_all,
  build_pool,
} from "~/wasm/raw"
import type { EmoBases } from "~/misc/types"

export const buildPool = (
  selectedBuiltBaseIds: string[],
  emoBases: EmoBases,
  fixedBaseIds: string[],
  builtBaseIds: string[]
) =>
  createType(
    "Vec<mtc_Emo>",
    build_pool(
      Uint16Array.from(selectedBuiltBaseIds.map((id) => parseInt(id, 10))),
      emoBases.codec.toU8a(),
      Uint16Array.from(fixedBaseIds.map((id) => parseInt(id, 10))),
      Uint16Array.from(builtBaseIds.map((id) => parseInt(id, 10)))
    )
  )

export const startShop = (board: mtc_Board, seed: string, emoBases: EmoBases) =>
  decodeForShop(start_shop(board.toU8a(), seed, emoBases.codec.toU8a()))

export const addEmo = (
  board: mtc_Board,
  mtcEmoIds: u16[],
  emoBaseId: u16,
  isTriple: boolean,
  emoIndex: number,
  emoBases: EmoBases
) =>
  decodeForShop(
    add_emo(
      board.toU8a(),
      Uint16Array.from(mtcEmoIds.map((id) => id.toNumber())),
      emoBaseId.toNumber(),
      isTriple,
      emoIndex,
      emoBases.codec.toU8a()
    )
  )

export const sellEmo = (board: mtc_Board, emoIndex: number, emoBases: EmoBases) =>
  decodeForShop(sell_emo(board.toU8a(), emoIndex, emoBases.codec.toU8a()))

export const moveEmo = (board: mtc_Board, emoIndex: number, isRight: boolean) =>
  decodeForShop(move_emo(board.toU8a(), emoIndex, isRight))

export const marchPvg = (
  board: mtc_Board,
  ghostBoard: mtc_GhostBoard,
  seed: string,
  emoBases: EmoBases
) => {
  const [boardGrade, ghostBoardGrade, logs] = createType(
    "(u8, u8, mtc_battle_Logs)",
    march_pvg(board.toU8a(), ghostBoard.toU8a(), seed, emoBases.codec.toU8a())
  )
  return [boardGrade.toNumber(), ghostBoardGrade.toNumber(), logs] as const
}

export const getGradeAndGhostBoard = (
  gradeAndGhostBoards: Vec<mtc_GradeAndGhostBoard>,
  ghostState: mtc_GhostState,
  turn: number
) =>
  createType(
    "mtc_GradeAndGhostBoard",
    get_grade_and_ghost_board(gradeAndGhostBoards.toU8a(), ghostState.toU8a(), turn)
  )

export const getCatalog = (pool: Vec<mtc_Emo>, board: mtc_Board, seed: string) =>
  createType("mtc_shop_Catalog", get_catalog(pool.toU8a(), board.toU8a(), seed))

export const selectBattleGhostIndex = (
  ghostStates: Vec<mtc_GhostState>,
  previousIndex: number,
  seed: string
) => select_battle_ghost_index(ghostStates.toU8a(), previousIndex, seed)

export const battleAll = (
  board: mtc_Board,
  grade: number,
  health: number,
  ghosts: Vec<mtc_Ghost>,
  ghostStates: Vec<mtc_GhostState>,
  battleGhostIndex: number,
  turn: number,
  seed: string,
  emoBases: EmoBases
) => {
  const [_health, _ghostStates, _finalPlace] = createType(
    "(u8, Vec<mtc_GhostState>, Option<u8>)",
    battle_all(
      board.toU8a(),
      grade,
      health,
      ghosts.toU8a(),
      ghostStates.toU8a(),
      battleGhostIndex,
      turn,
      seed,
      emoBases.codec.toU8a()
    )
  )
  return [_health.toNumber(), _ghostStates, _finalPlace] as const
}

const decodeForShop = (u: Uint8Array) => {
  const [board, logs, coin] = createType("(mtc_Board, mtc_shop_BoardLogs, u8)", u)
  return [board, coin.toNumber(), logs] as const
}
