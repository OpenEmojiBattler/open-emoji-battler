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
  addSpecialToEmoElement,
  removeSpecialToEmoElement,
  addInfoAbility,
  removeInfoAbility,
  createEmoElementWithBoardEmo,
  updateEmoHealthNegative,
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
  const boards = await setupBoards(
    playerBoardElement,
    rivalBoardElement,
    playerBoard,
    rivalBoard,
    emoBases
  )

  let stack: Promise<void>[] = []

  await sleep(700)

  for (let i = 0; i < logs.length; i++) {
    const l = logs[i]

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
      const asIncreaseStats = l.asIncreaseStats

      if (logs[i]?.isIncreaseStats) {
        const nextParams = logs[i].asIncreaseStats
        if (isSameUpdatingStatsDiff(asIncreaseStats, nextParams)) {
          stack.push(increaseStats(boards, asIncreaseStats))
          continue
        }
      }

      if (stack.length > 0) {
        await Promise.all(stack)
        stack = []
        continue
      }

      await increaseStats(boards, asIncreaseStats)
      continue
    }
    if (l.isDecreaseStats) {
      const asDecreaseStats = l.asDecreaseStats

      if (logs[i]?.isDecreaseStats) {
        const nextParams = logs[i].asDecreaseStats
        if (isSameUpdatingStatsDiff(asDecreaseStats, nextParams)) {
          stack.push(decreaseStats(boards, asDecreaseStats))
          continue
        }
      }

      if (stack.length > 0) {
        await Promise.all(stack)
        stack = []
        continue
      }

      await decreaseStats(boards, asDecreaseStats)
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

const setupBoards = async (
  playerBoardElement: HTMLDivElement,
  rivalBoardElement: HTMLDivElement,
  playerBoard: mtc_Board,
  rivalBoard: mtc_GhostBoard,
  emoBases: EmoBases
): Promise<Boards> => {
  removeAllChildren(playerBoardElement)
  removeAllChildren(rivalBoardElement)

  const animes: Promise<void>[] = []

  for (const e of playerBoard) {
    const el = createEmoElementWithBoardEmo(e, emoBases)
    const body = getFirstDivByClass(el, "emo-body-outer")
    body.style.opacity = "0"
    playerBoardElement.appendChild(el)
    animes.push(animateIndefinitely(body, { opacity: "1" }, { duration: 500 }))
  }
  for (const e of rivalBoard) {
    const el = createEmoElementWithBoardEmo(e, emoBases)
    const body = getFirstDivByClass(el, "emo-body-outer")
    body.style.opacity = "0"
    rivalBoardElement.appendChild(el)
    animes.push(animateIndefinitely(body, { opacity: "1" }, { duration: 500 }))
  }

  await Promise.all(animes)

  return [playerBoardElement, rivalBoardElement]
}

const isSameUpdatingStatsDiff = <
  T extends mtc_battle_Log_IncreaseStats | mtc_battle_Log_DecreaseStats
>(
  a: T,
  b: T
) => a.player_index.eq(b.player_index) && a.attack.eq(b.attack) && a.health.eq(b.health)

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
  const isAttackPlayerZero = params.attack_player_index.isZero()
  let xDiff = defenderBody.getBoundingClientRect().left - attackerBody.getBoundingClientRect().left
  if (xDiff > 0) {
    xDiff -= 30
  }
  if (xDiff < 0) {
    xDiff += 30
  }

  attackerBody.style.zIndex = "1"

  await Promise.all([
    animateIndefinitely(attackerBody, { transform: "scale(1.05)" }, { duration: 200 }),
    animateIndefinitely(defenderBody, { transform: "scale(1.05)" }, { duration: 200 }),
  ])

  await sleep(300)

  await Promise.all([
    attackerBody.animate(
      [
        { transform: "translate(0px, 0px)" },
        { transform: `translate(0px, ${isAttackPlayerZero ? "" : "-"}2px)`, offset: 0.3 },
        { transform: `translate(${xDiff}px, ${isAttackPlayerZero ? "-" : ""}40px)` },
        { transform: "translate(0px, 0px)" },
      ],
      { duration: 700, composite: "add", easing: "ease-in-out" }
    ).finished,
    sleep(550).then(
      () =>
        defenderBody.animate(
          {
            transform: [
              "translateY(0px)",
              `translateY(${isAttackPlayerZero ? "-5" : "5"}px)`,
              "translateY(0px)",
            ],
          },
          { duration: 300, composite: "add", easing: "ease-out" }
        ).finished
    ),
  ])

  attackerBody.style.zIndex = "auto"

  await sleep(200)

  await Promise.all([
    animateIndefinitely(attackerBody, { transform: "scale(1.0)" }, { duration: 200 }),
    animateIndefinitely(defenderBody, { transform: "scale(1.0)" }, { duration: 200 }),
  ])
}

const damage = async (boards: Boards, params: mtc_battle_Log_Damage) => {
  const emoElement = getEmoElement(boards, params.player_index, params.emo_index)

  const inner = getFirstDivByClass(emoElement, "emo-body-inner")
  const damageEl = document.createElement("div")
  damageEl.classList.add("emo-body-inner-damage")
  damageEl.textContent = params.damage.toString()
  damageEl.style.opacity = "0"
  damageEl.style.transform = "translateY(4px)"
  inner.appendChild(damageEl)

  await Promise.all([
    damageEl
      .animate(
        [
          {
            opacity: "0",
            transform: "translateY(4px)",
          },
          {
            opacity: "1",
            transform: "translateY(0px)",
            offset: 0.1,
          },
          {
            opacity: "1",
            transform: "translateY(0px)",
            offset: 0.9,
          },
          {
            opacity: "0",
            transform: "translateY(4px)",
          },
        ],
        { duration: 900 }
      )
      .finished.then(() => damageEl.remove()),
    sleep(300).then(() => updateEmoHealthNegative(emoElement, `${params.health}`)),
  ])
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
