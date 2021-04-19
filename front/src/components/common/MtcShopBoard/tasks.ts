import {
  mtc_shop_BoardLogs,
  mtc_shop_BoardLog_Add,
  mtc_shop_BoardLog_AddAbility,
  mtc_shop_BoardLog_Move,
  mtc_shop_BoardLog_Remove,
  mtc_shop_BoardLog_Triple,
  mtc_shop_BoardLog_IncreaseStats,
  mtc_Emo,
  mtc_Board,
} from "common"

import type { EmoBases } from "~/misc/types"
import { startShop, addEmo, sellEmo, moveEmo } from "~/wasm"
import { emoBuyCoin } from "~/misc/constants"
import { sleep } from "~/misc/utils"
import { animateIndefinitely, getChildDivByIndex } from "~/misc/elementHelpers"
import {
  getEmoBodyFromEmo,
  addInfoAbility,
  createEmoWithBoardEmo,
  getSpecial,
} from "~/misc/emo/element"
import {
  removeEmoFromBoard,
  emoElementWithMarginWidth,
  addEmoToBoard,
  updateStats,
  emoElementWidth,
  emoElementHeight,
} from "~/misc/emo/elementAnimations"

export type Operation =
  | { kind: "pre-shop" }
  | { kind: "move"; index: number; isRight: boolean }
  | { kind: "sell"; index: number }
  | { kind: "set"; index: number; mtcEmo: mtc_Emo }
  | { kind: "none" }

export const operate = async (
  emoLineEmosElement: HTMLDivElement,
  board: mtc_Board,
  operation: Operation,
  preShopSeed: string,
  emoBases: EmoBases
) => {
  let newBoardEmos,
    coinDiff = 0,
    logs

  if (operation.kind === "pre-shop") {
    setupEmoLineEmosElement(emoLineEmosElement, board, emoBases)
    const [_board, gottenCoin, _logs] = startShop(board, preShopSeed, emoBases)
    newBoardEmos = _board
    coinDiff += gottenCoin
    logs = _logs
    if (_logs.length > 0) {
      await sleep(600)
    }
  } else {
    if (operation.kind === "set") {
      const [_newBoardEmos, gottenCoin, _logs] = addEmo(
        board,
        [operation.mtcEmo.id],
        operation.mtcEmo.base_id,
        false,
        operation.index,
        emoBases
      )
      newBoardEmos = _newBoardEmos
      coinDiff = coinDiff - emoBuyCoin + gottenCoin
      logs = _logs
    } else if (operation.kind === "sell") {
      const [_newBoardEmos, gottenCoin, _logs] = sellEmo(board, operation.index, emoBases)
      newBoardEmos = _newBoardEmos
      coinDiff += gottenCoin
      logs = _logs
    } else if (operation.kind === "move") {
      const [_newBoardEmos, gottenCoin, _logs] = moveEmo(board, operation.index, operation.isRight)
      newBoardEmos = _newBoardEmos
      coinDiff += gottenCoin
      logs = _logs
    } else {
      throw new Error(`unimplemented kind: ${operation.kind}`)
    }
  }

  await animate(emoLineEmosElement, logs, emoBases)

  return { newBoardEmos, coinDiff, operation }
}

const animate = async (element: HTMLDivElement, logs: mtc_shop_BoardLogs, emoBases: EmoBases) => {
  for (const l of logs) {
    if (l.isAdd) {
      await add(element, l.asAdd, emoBases)
      continue
    }
    if (l.isRemove) {
      await remove(element, l.asRemove)
      continue
    }
    if (l.isMove) {
      await move(element, l.asMove)
      continue
    }
    if (l.isIncreaseStats) {
      await increaseStats(element, l.asIncreaseStats)
      continue
    }
    if (l.isAddAbility) {
      await addAbility(element, l.asAddAbility, emoBases)
      continue
    }
    if (l.isTriple) {
      await triple(element, l.asTriple)
      continue
    }
    throw new Error(`undefined log type: ${l.type}`)
  }
}

const add = async (element: HTMLDivElement, params: mtc_shop_BoardLog_Add, emoBases: EmoBases) => {
  const isTriple = params.board_emo.attributes.is_triple.isTrue

  const emoElement = await addEmoToBoard(
    element,
    params.board_emo,
    params.index.toNumber(),
    emoBases,
    isTriple ? 250 : 150
  )

  if (isTriple) {
    const { left, top } = emoElement.getBoundingClientRect()
    emoElement.style.zIndex = "2"
    const pros: Promise<void>[] = []
    for (let i = 0; i < 20; i++) {
      pros.push(
        createParticle(
          Math.floor(left + emoElementWidth / 2),
          Math.floor(top + emoElementHeight / 2)
        )
      )
    }
    Promise.all(pros).then(() => {
      if (emoElement.style.zIndex === "2") {
        emoElement.style.zIndex = "auto"
      }
    })
    await sleep(1000)
  }
}

const remove = async (element: HTMLDivElement, params: mtc_shop_BoardLog_Remove) => {
  await removeEmoFromBoard(element, params.index.toNumber(), 150)
}

const move = async (element: HTMLDivElement, params: mtc_shop_BoardLog_Move) => {
  const fromIndex = params.from_index.toNumber()
  const toIndex = params.to_index.toNumber()

  if (fromIndex - toIndex !== 1 && toIndex - fromIndex !== 1) {
    throw new Error("move: unimplemented for non adjacent")
  }

  const emoElement1 = getChildDivByIndex(element, fromIndex)
  const emoElement2 = getChildDivByIndex(element, toIndex)

  emoElement1.style.zIndex = "2"
  emoElement2.style.zIndex = "1"

  const opt: KeyframeAnimationOptions = { duration: 150, easing: "ease-in-out" }
  if (fromIndex > toIndex) {
    await Promise.all([
      emoElement1.animate({ transform: `translateX(-${emoElementWithMarginWidth}px)` }, opt)
        .finished,
      emoElement2.animate({ transform: `translateX(${emoElementWithMarginWidth}px)` }, opt)
        .finished,
    ])
    element.insertBefore(emoElement1, emoElement2)
  } else {
    await Promise.all([
      emoElement1.animate({ transform: `translateX(${emoElementWithMarginWidth}px)` }, opt)
        .finished,
      emoElement2.animate({ transform: `translateX(-${emoElementWithMarginWidth}px)` }, opt)
        .finished,
    ])
    element.insertBefore(emoElement2, emoElement1)
  }

  emoElement1.style.zIndex = "auto"
  emoElement2.style.zIndex = "auto"
}

const increaseStats = async (element: HTMLDivElement, params: mtc_shop_BoardLog_IncreaseStats) => {
  await updateStats(
    element,
    "positive",
    params.index.toNumber(),
    params.attack.toNumber(),
    params.health.toNumber(),
    params.calculated_attack.toString(),
    params.calculated_health.toString()
  )
}

const addAbility = async (
  element: HTMLDivElement,
  params: mtc_shop_BoardLog_AddAbility,
  emoBases: EmoBases
) => {
  const emoElement = getChildDivByIndex(element, params.index.toNumber())

  addInfoAbility(emoElement, params.ability, params.is_target_triple.isTrue, emoBases)

  if (
    !params.ability.isBattle ||
    !params.ability.asBattle.isSpecial ||
    (!params.ability.asBattle.asSpecial.isShield && !params.ability.asBattle.asSpecial.isAttractive)
  ) {
    return
  }

  const special = getSpecial(emoElement, params.ability.asBattle.asSpecial.type)

  const originalSize = window.getComputedStyle(special).getPropertyValue("font-size")

  special.style.fontSize = "0px"
  special.style.display = "inline"
  await animateIndefinitely(special, { fontSize: originalSize }, { duration: 200 })
}

const triple = async (element: HTMLDivElement, params: mtc_shop_BoardLog_Triple) => {
  await Promise.all(
    Array.from(params.removed_indexes).map(async (index) => {
      const emoElement = getChildDivByIndex(element, index)
      const body = getEmoBodyFromEmo(emoElement)

      await animateIndefinitely(body, { opacity: "0", filter: "saturate(3)" }, { duration: 500 })
      await animateIndefinitely(emoElement, { width: "0px", margin: "0px" }, { duration: 200 })

      emoElement.remove()
    })
  )
}

const setupEmoLineEmosElement = (
  emoLineEmosElement: HTMLDivElement,
  board: mtc_Board,
  emoBases: EmoBases
) => {
  for (const boardEmo of board) {
    emoLineEmosElement.appendChild(createEmoWithBoardEmo(boardEmo, emoBases))
  }
}

const createParticle = async (x: number, y: number) => {
  const particle = document.createElement("i")
  particle.classList.add("mtc-shop-particle")
  document.body.appendChild(particle)

  const size = Math.floor(Math.random() * 10 + 5)
  particle.style.width = `${size}px`
  particle.style.height = `${size}px`
  particle.style.background = `hsl(${Math.random() * 30 + 30}, ${Math.floor(
    Math.random() * 40 + 50
  )}%, ${Math.floor(Math.random() * 40 + 50)}%)`

  const destinationX = Math.floor(x + (Math.random() - 0.5) * 2 * 100)
  const destinationY = Math.floor(y + (Math.random() - 0.5) * 2 * 100)

  return particle
    .animate(
      [
        {
          transform: `translate(${Math.floor(x - size / 2)}px, ${Math.floor(y - size / 2)}px)`,
          opacity: 1,
        },
        {
          transform: `translate(${destinationX}px, ${destinationY}px)`,
          opacity: 0,
        },
      ],
      {
        duration: Math.floor(500 + Math.random() * 1000),
        easing: "ease-out",
        delay: Math.floor(Math.random() * 200),
      }
    )
    .finished.then(() => particle.remove())
}
