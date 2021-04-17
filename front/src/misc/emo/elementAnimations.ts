import { mtc_BoardEmo } from "common"

import type { EmoBases } from "~/misc/types"
import {
  animateIndefinitely,
  getFirstDivByClass,
  insertElementByIndex,
  getChildDivByIndex,
} from "~/misc/elementHelpers"
import {
  createEmoElementWithBoardEmo,
  updateEmoAttackPositive,
  updateEmoAttackNegative,
  updateEmoHealthPositive,
  updateEmoHealthNegative,
} from "~/misc/emo/element"

export const emoElementWidth = "64px" // ses $emo-width
export const emoElementMargin = "0px 4px" // ses $space
export const emoElementWithMarginWidth = "72px" // ses $emo-width

export const addEmoToBoard = async (
  boardElement: HTMLDivElement,
  boardEmo: mtc_BoardEmo,
  index: number,
  emoBases: EmoBases,
  duration: number
) => {
  const emoElement = createEmoElementWithBoardEmo(boardEmo, emoBases)
  emoElement.style.width = "0px"
  emoElement.style.margin = "0px 0px"

  // avoid touching emoElement's opacity for the stacking context, for hover info's z-index
  const body = getFirstDivByClass(emoElement, "emo-body-outer")
  body.style.opacity = "0"

  insertElementByIndex(boardElement, emoElement, index)

  await animateIndefinitely(
    emoElement,
    { width: emoElementWidth, margin: emoElementMargin },
    { duration }
  )
  await animateIndefinitely(body, { opacity: "1" }, { duration })
}

export const removeEmoFromBoard = async (
  boardElement: HTMLDivElement,
  index: number,
  duration: number
) => {
  const emoElement = getChildDivByIndex(boardElement, index)
  const body = getFirstDivByClass(emoElement, "emo-body-outer")

  await animateIndefinitely(body, { opacity: "0" }, { duration })
  await animateIndefinitely(emoElement, { width: "0px", margin: "0px" }, { duration })

  emoElement.remove()
}

export const updateStats = async (
  boardElement: HTMLDivElement,
  kind: "increase" | "decrease",
  emoIndex: number,
  attack: number,
  health: number,
  calculatedAttack: string,
  calculatedHealth: string
) => {
  const emoElement = getChildDivByIndex(boardElement, emoIndex)

  const color = kind === "increase" ? "positive" : "negative"
  const sym = kind === "increase" ? "+" : ""

  const pros: Promise<void>[] = []
  if (attack !== 0) {
    pros.push(showText(emoElement, color, `attack: ${sym}${attack}`))
  }
  if (health !== 0) {
    pros.push(showText(emoElement, color, `health: ${sym}${health}`))
  }
  await Promise.all(pros)

  if (kind === "increase") {
    if (attack !== 0) {
      updateEmoAttackPositive(emoElement, calculatedAttack)
    }
    if (health !== 0) {
      updateEmoHealthPositive(emoElement, calculatedHealth)
    }
  } else {
    if (attack !== 0) {
      updateEmoAttackNegative(emoElement, calculatedAttack)
    }
    if (health !== 0) {
      updateEmoHealthNegative(emoElement, calculatedHealth)
    }
  }
}

export const showText = async (
  element: HTMLDivElement,
  color: "positive" | "negative",
  text: string
) => {
  const e = document.createElement("div")
  e.textContent = text
  e.style.color = color === "positive" ? "lightgreen" : "lightsalmon"
  e.style.fontSize = "12px"
  e.style.textAlign = "center"
  e.style.opacity = "0"

  element.appendChild(e)

  await animateIndefinitely(e, { opacity: ["0", "1", "0"] }, { duration: 600 })
  e.remove()
}
