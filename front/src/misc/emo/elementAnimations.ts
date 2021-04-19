import { mtc_BoardEmo } from "common"

import type { EmoBases } from "~/misc/types"
import {
  animateIndefinitely,
  getFirstDivByClass,
  insertElementByIndex,
  getChildDivByIndex,
} from "~/misc/elementHelpers"
import {
  createEmoWithBoardEmo,
  updateEmoAttackPositive,
  updateEmoAttackNegative,
  updateEmoHealthPositive,
  updateEmoHealthNegative,
} from "~/misc/emo/element"
import { sleep } from "../utils"

export const emoElementWidth = 64 // ses $emo-width
export const emoElementHeight = 93 // ses $emo-height
export const emoElementMargin = "0px 4px" // ses $space
export const emoElementWithMarginWidth = 72 // ses $emo-width

export const addEmoToBoard = async (
  boardElement: HTMLDivElement,
  boardEmo: mtc_BoardEmo,
  index: number,
  emoBases: EmoBases,
  duration: number
) => {
  const emoElement = createEmoWithBoardEmo(boardEmo, emoBases)
  emoElement.style.width = "0px"
  emoElement.style.margin = "0px 0px"

  // avoid touching emoElement's opacity for the stacking context, for hover info's z-index
  const body = getFirstDivByClass(emoElement, "emo-body-outer")
  body.style.opacity = "0"

  insertElementByIndex(boardElement, emoElement, index)

  await animateIndefinitely(
    emoElement,
    { width: `${emoElementWidth}px`, margin: emoElementMargin },
    { duration, easing: "ease-in-out" }
  )
  await animateIndefinitely(body, { opacity: "1" }, { duration })

  return emoElement
}

export const removeEmoFromBoard = async (
  boardElement: HTMLDivElement,
  index: number,
  duration: number
) => {
  const emoElement = getChildDivByIndex(boardElement, index)
  const body = getFirstDivByClass(emoElement, "emo-body-outer")

  await animateIndefinitely(body, { opacity: "0", filter: "blur(6px)" }, { duration })
  await animateIndefinitely(
    emoElement,
    { width: "0px", margin: "0px" },
    { duration, easing: "ease-in-out" }
  )

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

  const pros: Promise<any>[] = []
  if (attack !== 0) {
    pros.push(showText(emoElement, "attack", color, `${sym}${attack}`))
  }
  if (health !== 0) {
    pros.push(showText(emoElement, "health", color, `${sym}${health}`))
  }

  const body = getFirstDivByClass(emoElement, "emo-body-outer")
  if (kind === "increase") {
    pros.push(
      body.animate(
        { filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"] },
        { duration: 600 }
      ).finished
    )
  } else {
    pros.push(
      body.animate(
        { filter: ["brightness(1)", "brightness(0.6)", "brightness(1)"] },
        { duration: 600 }
      ).finished
    )
  }

  await sleep(400)

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

  await Promise.all(pros)
}

const showText = async (
  element: HTMLDivElement,
  attackOrHealth: "attack" | "health",
  color: "positive" | "negative",
  text: string
) => {
  const e = document.createElement("div")
  e.textContent = text

  if (attackOrHealth === "attack") {
    e.classList.add("emo-attack-diff")
  } else {
    e.classList.add("emo-health-diff")
  }
  if (color === "positive") {
    e.classList.add("oeb-positive")
  } else {
    e.classList.add("oeb-negative")
  }

  e.style.opacity = "0"

  element.appendChild(e)

  await animateIndefinitely(e, { opacity: ["0", "1", "1", "0"] }, { duration: 800 })
  e.remove()
}
