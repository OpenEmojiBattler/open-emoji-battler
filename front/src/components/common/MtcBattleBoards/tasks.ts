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
import { sleep } from "~/misc/utils"
import { animateIndefinitely, getChildDivByIndex, removeAllChildren } from "~/misc/elementHelpers"
import {
  addSpecial,
  removeSpecial,
  addInfoAbility,
  removeInfoAbility,
  createEmoWithBoardEmo,
  getEmoBodyOuterFromEmo,
  updateEmoStat,
  createEmoDamage,
  getEmoBodyInnerFromEmo,
} from "~/misc/emo/element"
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

  const updatingStatsBatchParams: Array<
    mtc_battle_Log_IncreaseStats | mtc_battle_Log_DecreaseStats
  > = []

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
      await updateStatsBatch(
        boards,
        l.asIncreaseStats,
        logs[i + 1]?.isIncreaseStats ? logs[i + 1].asIncreaseStats : null,
        updatingStatsBatchParams,
        increaseStats
      )
      continue
    }
    if (l.isDecreaseStats) {
      await updateStatsBatch(
        boards,
        l.asDecreaseStats,
        logs[i + 1]?.isDecreaseStats ? logs[i + 1].asDecreaseStats : null,
        updatingStatsBatchParams,
        decreaseStats
      )
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

  const pros: Promise<void>[] = []

  for (const [board, boardElement] of [
    [playerBoard, playerBoardElement],
    [rivalBoard, rivalBoardElement],
  ] as const) {
    for (const e of board) {
      const el = createEmoWithBoardEmo(e, emoBases)
      const body = getEmoBodyOuterFromEmo(el)
      body.style.opacity = "0"
      boardElement.appendChild(el)
      pros.push(animateIndefinitely(body, { opacity: "1" }, { duration: 500 }))
    }
  }

  await Promise.all(pros)

  return [playerBoardElement, rivalBoardElement]
}

const updateStatsBatch = async <
  T extends mtc_battle_Log_IncreaseStats | mtc_battle_Log_DecreaseStats
>(
  boards: Boards,
  current: T,
  next: T | null,
  params: T[],
  fn: (boards: Boards, params: T) => Promise<void>
) => {
  if (
    next &&
    current.player_index.eq(next.player_index) &&
    current.attack.eq(next.attack) &&
    current.health.eq(next.health) &&
    !current.emo_index.eq(next.emo_index) &&
    !params.map((s) => s.emo_index.toNumber()).includes(next.emo_index.toNumber())
  ) {
    params.push(current)
    return
  }

  if (params.length > 0) {
    params.push(current)
    await Promise.all(params.map((s) => fn(boards, s)))
    params.length = 0
    return
  }

  await fn(boards, current)
  return
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
  const isAttackPlayerZero = params.attack_player_index.isZero()
  let xDiff = defenderBody.getBoundingClientRect().left - attackerBody.getBoundingClientRect().left
  if (xDiff > 0) {
    if (xDiff < 300) {
      xDiff -= 30
    } else {
      xDiff -= 60
    }
  }
  if (xDiff < 0) {
    if (xDiff > -300) {
      xDiff += 30
    } else {
      xDiff += 60
    }
  }

  attackerBody.style.zIndex = "1"

  await Promise.all(
    [attackerBody, defenderBody].map((b) =>
      animateIndefinitely(b, { transform: "scale(1.05)" }, { duration: 200 })
    )
  )

  await sleep(300)

  await Promise.all([
    attackerBody.animate(
      [
        { transform: "translate(0px, 0px)" },
        { transform: `translate(${xDiff}px, ${isAttackPlayerZero ? "-" : ""}30px)` },
        { transform: "translate(0px, 0px)" },
      ],
      { duration: 500, composite: "add", easing: "ease" }
    ).finished,
    sleep(300).then(
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

  await Promise.all(
    [attackerBody, defenderBody].map((b) =>
      animateIndefinitely(b, { transform: "scale(1)" }, { duration: 200 })
    )
  )

  await sleep(100)
}

const damage = async (boards: Boards, params: mtc_battle_Log_Damage) => {
  const emoElement = getEmoElement(boards, params.player_index, params.emo_index)

  const inner = getEmoBodyInnerFromEmo(emoElement)
  const damageEl = createEmoDamage(params.damage.toString())
  damageEl.style.opacity = "0"
  inner.appendChild(damageEl)

  await Promise.all([
    animateIndefinitely(
      damageEl,
      {
        opacity: ["0", "1", "1"],
        transform: ["scale(0.7)", "scale(1.3)", "scale(0.9)", "scale(1)"],
      },
      { duration: 600, easing: "ease" }
    ),
    sleep(400).then(() => updateEmoStat(emoElement, "health", "negative", `${params.health}`)),
  ])

  await sleep(500)

  await damageEl.animate({ opacity: "0" }, { duration: 100 }).finished
  damageEl.remove()

  await sleep(200)
}

const remove = async (boards: Boards, params: mtc_battle_Log_Remove) => {
  const boardElement = boards[params.player_index.toNumber()]
  await removeEmoFromBoard(boardElement, params.emo_index.toNumber(), 300)
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
    "positive",
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
    "negative",
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

  addSpecial(emoElement, params.ability.asSpecial.type)

  await sleep(300)
}

const removeBattleAbility = async (boards: Boards, params: mtc_battle_Log_RemoveBattleAbility) => {
  const emoElement = getEmoElement(boards, params.player_index, params.emo_index)

  removeInfoAbility(emoElement, params.ability_index.toNumber())

  if (params.ability.isSpecial) {
    removeSpecial(emoElement, params.ability.asSpecial.type)
  }

  await sleep(300)
}

const getEmoElement = (boards: Boards, playerIndex: u8, emoIndex: u8) =>
  getChildDivByIndex(boards[playerIndex.toNumber()], emoIndex.toNumber())

const getEmoElementBody = (boards: Boards, playerIndex: u8, emoIndex: u8) =>
  getEmoBodyOuterFromEmo(getEmoElement(boards, playerIndex, emoIndex))

const switchPlayerIndex = (index: u8) =>
  index.isZero() ? createType("u8", 1) : createType("u8", 0)
