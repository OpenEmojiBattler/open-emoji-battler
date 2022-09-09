import type { Vec, u16 } from "@polkadot/types"
import type { ITuple } from "@polkadot/types-codec/types"
import type { AccountId } from "@polkadot/types/interfaces/runtime"

import {
  mtc_Emo,
  mtc_Ghost,
  mtc_Board,
  emo_Typ,
  emo_Base,
  emo_Bases,
  mtc_GhostState,
  createType,
} from "common"

import { emoTyps, EmoTyp } from "~/misc/constants"
import { EmoBases } from "./types"
import { groupBy } from "~/misc/utils"
import { battleAll, selectBattleGhostIndex } from "~/wasm"

import emoNames from "~/misc/emo/names.json"

export const buildEmoBases = (codec: emo_Bases): EmoBases => ({
  codec,
  stringKey: new Map(Array.from(codec[0].entries()).map(([k, v]) => [k.toString(), v])),
})

export const findEmoBase = (id: u16, bases: EmoBases) => findEmoBaseByStringId(id.toString(), bases)

export const findEmoBaseByStringId = (id: string, bases: EmoBases) => {
  const base = bases.stringKey.get(id)
  if (!base) {
    throw new Error(`emo base not found: ${id}`)
  }
  return base
}

export const getEmoTypString = (typ: emo_Typ): EmoTyp => {
  const t = typ.type as any
  if (emoTyps.includes(t)) {
    return t
  }
  throw new Error(`undefined typ: ${t}`)
}

export const getEmoBaseEmoji = (base: emo_Base) => String.fromCodePoint(base.codepoint.toNumber())
export const getEmoBaseName = (base: emo_Base) => getEmoName(getEmoBaseEmoji(base))

export const getEmoName = (emoji: string): string => {
  const name = (emoNames as any)[emoji]
  if (!name) {
    throw new Error(`EMO name not found: ${emoji}`)
  }
  return name
}

export const getGradeText = (grade: string) => {
  switch (grade) {
    case "1":
      return "𝟙"
    case "2":
      return "𝟚"
    case "3":
      return "𝟛"
    case "4":
      return "𝟜"
    case "5":
      return "𝟝"
    case "6":
      return "𝟞"
    default:
      throw new Error(`undefined grade text: ${grade}`)
  }
}

export const getCoinText = (coin: number) => {
  const t = "⓪①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳".charAt(coin)
  if (t === "") {
    return `${coin}`
  }
  return t
}

export const getShortAddress = (address: string) => `${address.slice(0, 8)}...`

export const getHealthFromState = (state: mtc_GhostState) => {
  if (state.isActive) {
    return state.asActive.health.toNumber()
  } else {
    return 0
  }
}

export const buildEmoAttributesWithBase = (base: emo_Base) =>
  createType("emo_Attributes", {
    attack: base.attack,
    health: base.health,
    abilities: base.abilities,
    is_triple: false,
  })

export const groupEmoBasesByGrades = (emoBases: EmoBases, emoBaseIds: string[]) =>
  groupBy(
    emoBaseIds.map((id) => findEmoBaseByStringId(id, emoBases)),
    (m) => m.grade.toString()
  ).sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10))

export const getDefaultDeck = (emoBases: EmoBases, builtEmoBaseIds: string[]) =>
  groupEmoBasesByGrades(emoBases, builtEmoBaseIds).map(([, ms]) => ms[0].id.toString())

export interface MtcState {
  previousEp: number
  turn: number
  seed: string
  pool: Vec<mtc_Emo>
  board: mtc_Board
  grade: number
  upgradeCoin: number | null
  health: number
  ghosts: Vec<mtc_Ghost>
  ghostStates: Vec<mtc_GhostState>
  ghostAddresses: string[]
  battleGhostIndex: number
}

export interface ResultState {
  place: number
  ep: number
}

export const buildInitialMtcState = (
  previousEp: number,
  seed: string,
  pool: Vec<mtc_Emo>,
  ghosts: Vec<mtc_Ghost>,
  ghostAddresses: string[],
  health: number,
  upgradeCoin: number | null,
  ghostStates: Vec<mtc_GhostState>,
  battleGhostIndex: number
): MtcState => {
  return {
    previousEp,
    turn: 1,
    board: createType("mtc_Board", []),
    grade: 1,
    upgradeCoin,
    health,
    ghostStates,
    battleGhostIndex,
    seed,
    pool,
    ghosts,
    ghostAddresses,
  }
}

export const finishBattle = (
  mtcState: MtcState,
  emoBases: EmoBases
): { mtcState: MtcState; finalPlace: number | null } => {
  const [health, ghostStates, _finalPlace] = battleAll(
    mtcState.board,
    mtcState.grade,
    mtcState.health,
    mtcState.ghosts,
    mtcState.ghostStates,
    mtcState.battleGhostIndex,
    mtcState.turn,
    mtcState.seed,
    emoBases
  )
  const finalPlace = _finalPlace.isSome ? _finalPlace.unwrap().toNumber() : null

  const state = { health, ghostStates }

  if (finalPlace) {
    return { mtcState: { ...mtcState, ...state }, finalPlace }
  }

  const battleGhostIndex = selectBattleGhostIndex(
    ghostStates,
    mtcState.battleGhostIndex,
    mtcState.seed
  )

  const upgradeCoin = mtcState.upgradeCoin === null ? null : Math.max(mtcState.upgradeCoin - 1, 0)

  return {
    mtcState: { ...mtcState, ...state, turn: mtcState.turn + 1, upgradeCoin, battleGhostIndex },
    finalPlace: null,
  }
}

export interface LeaderboardElement {
  rank: number
  ep: number
  address: string
}

export const translateLeaderboardCodec = (leaderboard: Vec<ITuple<[u16, AccountId]>>) =>
  leaderboard
    .toArray()
    .map(
      ([e, a], i): LeaderboardElement => ({ rank: i + 1, ep: e.toNumber(), address: a.toString() })
    )

export const getPlayerFromLeaderboard = (leaderboard: LeaderboardElement[], address: string) => {
  const o = leaderboard.find((o) => o.address === address)
  return o ? { rank: o.rank, ep: o.ep } : null
}
