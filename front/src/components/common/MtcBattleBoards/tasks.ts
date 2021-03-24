import type { u8 } from "@polkadot/types/primitive"

import {
  mtc_battle_Logs,
  mtc_battle_Log_Attack,
  mtc_battle_Log_Damage,
  mtc_battle_Log_Remove,
  mtc_battle_Log_Add,
  mtc_battle_Log_IncreaseStats,
  mtc_battle_Log_DecreaseStats,
  mtc_battle_Log_AddBattleAbility,
  mtc_battle_Log_RemoveBattleAbility,
  createType,
  mtc_Board,
  mtc_GhostBoard,
} from "common"

import type { EmoBases } from "~/misc/types"
import {
  updateEmoHealthElement,
  addSpecialToEmoElement,
  removeSpecialToEmoElement,
  addInfoAbility,
  removeInfoAbility,
  createEmoElementWithBoardEmo,
} from "~/misc/emo/element"
import { sleep } from "~/misc/utils"
import {
  getFirstDivByClass,
  animateIndefinitely,
  getChildDivByIndex,
  removeAllChildren,
} from "~/misc/elementHelpers"
import { addEmoToBoard, removeEmoFromBoard, updateStats } from "~/misc/emo/elementAnimations"

type Boards = [HTMLDivElement, HTMLDivElement]

export const animate = async (
  playerBoardElement: HTMLDivElement,
  rivalBoardElement: HTMLDivElement,
  playerBoard: mtc_Board,
  rivalBoard: mtc_GhostBoard,
  logs: mtc_battle_Logs,
  emoBases: EmoBases
) => {
  const boards = setupBoards(
    playerBoardElement,
    rivalBoardElement,
    playerBoard,
    rivalBoard,
    emoBases
  )

  await sleep(800)

  for (const l of logs) {
    if (l.isAttack) {
      await attack(boards, l.asAttack)
      continue
    }
    if (l.isDamage) {
      await damage(boards, l.asDamage)
      continue
    }
    if (l.isRemove) {
      await remove(boards, l.asRemove)
      continue
    }
    if (l.isAdd) {
      await add(boards, l.asAdd, emoBases)
      continue
    }
    if (l.isIncreaseStats) {
      await increaseStats(boards, l.asIncreaseStats)
      continue
    }
    if (l.isDecreaseStats) {
      await decreaseStats(boards, l.asDecreaseStats)
      continue
    }
    if (l.isAddBattleAbility) {
      await addBattleAbility(boards, l.asAddBattleAbility, emoBases)
      continue
    }
    if (l.isRemoveBattleAbility) {
      await removeBattleAbility(boards, l.asRemoveBattleAbility)
      continue
    }

    throw new Error(`undefined log type: ${l.type}`)
  }
}

const setupBoards = (
  playerBoardElement: HTMLDivElement,
  rivalBoardElement: HTMLDivElement,
  playerBoard: mtc_Board,
  rivalBoard: mtc_GhostBoard,
  emoBases: EmoBases
): Boards => {
  removeAllChildren(playerBoardElement)
  removeAllChildren(rivalBoardElement)

  for (const e of playerBoard) {
    playerBoardElement.appendChild(createEmoElementWithBoardEmo(e, emoBases))
  }
  for (const e of rivalBoard) {
    rivalBoardElement.appendChild(createEmoElementWithBoardEmo(e, emoBases))
  }

  return [playerBoardElement, rivalBoardElement]
}

const attack = async (boards: Boards, params: mtc_battle_Log_Attack) => {
  const attackerBody = getEmoElementBody(
    boards,
    params.attack_player_index,
    params.attack_emo_index
  )
  const defenderBody = getEmoElementBody(
    boards,
    switchPlayerIndex(params.attack_player_index),
    params.defense_emo_index
  )

  await Promise.all([
    animateIndefinitely(attackerBody, { transform: "scale(1.05)" }, { duration: 200 }),
    animateIndefinitely(defenderBody, { transform: "scale(1.05)" }, { duration: 200 }),
  ])

  await sleep(300)

  await attackerBody.animate(
    {
      transform: [
        "translateY(0%)",
        `translateY(${params.attack_player_index.isZero() ? "-10" : "10"}%)`,
        "translateY(0%)",
      ],
    },
    { duration: 300, composite: "add" }
  ).finished

  await defenderBody.animate(
    {
      transform: ["translateX(0%)", "translateX(5%)", "translateX(-5%)", "translateX(0%)"],
    },
    { duration: 300, composite: "add" }
  ).finished

  await sleep(200)

  await Promise.all([
    animateIndefinitely(attackerBody, { transform: "scale(1.0)" }, { duration: 200 }),
    animateIndefinitely(defenderBody, { transform: "scale(1.0)" }, { duration: 200 }),
  ])
}

const damage = async (boards: Boards, params: mtc_battle_Log_Damage) => {
  const emoElement = getEmoElement(boards, params.player_index, params.emo_index)
  const damageEl = document.createElement("div")
  damageEl.textContent = params.damage.toString()
  damageEl.style.color = "lightsalmon"
  damageEl.style.fontSize = "large"
  damageEl.style.opacity = "0"
  emoElement.appendChild(damageEl)
  await damageEl.animate({ opacity: ["0", "1", "0"] }, { duration: 500 }).finished
  damageEl.remove()
  updateEmoHealthElement(emoElement, `${params.health}`)
  await sleep(300)
}

const remove = async (boards: Boards, params: mtc_battle_Log_Remove) => {
  const boardElement = boards[params.player_index.toNumber()]
  await removeEmoFromBoard(boardElement, params.emo_index.toNumber(), 200)
}

const add = async (boards: Boards, params: mtc_battle_Log_Add, emoBases: EmoBases) => {
  const boardElement = boards[params.player_index.toNumber()]
  const emo = createType("mtc_BoardEmo", {
    mtc_emo_ids: [],
    base_id: params.base_id,
    attributes: params.attributes,
  })
  await addEmoToBoard(boardElement, emo, params.emo_index.toNumber(), emoBases, 200)
}

const increaseStats = async (boards: Boards, params: mtc_battle_Log_IncreaseStats) => {
  await updateStats(
    boards[params.player_index.toNumber()],
    "increase",
    params.emo_index.toNumber(),
    params.attack.toNumber(),
    params.health.toNumber(),
    params.calculated_attack.toString(),
    params.calculated_health.toString()
  )

  await sleep(250)
}

const decreaseStats = async (boards: Boards, params: mtc_battle_Log_DecreaseStats) => {
  await updateStats(
    boards[params.player_index.toNumber()],
    "decrease",
    params.emo_index.toNumber(),
    params.attack.toNumber(),
    params.health.toNumber(),
    params.calculated_attack.toString(),
    params.calculated_health.toString()
  )

  await sleep(250)
}

const addBattleAbility = async (
  boards: Boards,
  params: mtc_battle_Log_AddBattleAbility,
  emoBases: EmoBases
) => {
  const emoElement = getEmoElement(boards, params.player_index, params.emo_index)

  addInfoAbility(
    emoElement,
    createType("emo_ability_Ability", { Battle: params.ability }),
    params.is_emo_triple.isTrue,
    emoBases
  )

  if (!params.ability.isSpecial) {
    return
  }
  addSpecialToEmoElement(emoElement, params.ability.asSpecial.type)
  await sleep(300)
}

const removeBattleAbility = async (boards: Boards, params: mtc_battle_Log_RemoveBattleAbility) => {
  const emoElement = getEmoElement(boards, params.player_index, params.emo_index)

  removeInfoAbility(emoElement, params.ability_index.toNumber())

  if (params.ability.isSpecial) {
    removeSpecialToEmoElement(emoElement, params.ability.asSpecial.type)
  }

  await sleep(300)
}

const getEmoElement = (boards: Boards, playerIndex: u8, emoIndex: u8) =>
  getChildDivByIndex(boards[playerIndex.toNumber()], emoIndex.toNumber())

const getEmoElementBody = (boards: Boards, playerIndex: u8, emoIndex: u8) =>
  getFirstDivByClass(getEmoElement(boards, playerIndex, emoIndex), "emo-body-outer")

const switchPlayerIndex = (index: u8) =>
  index.isZero() ? createType("u8", 1) : createType("u8", 0)
