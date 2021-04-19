import { mtc_BoardEmo } from "common"

import type { EmoBases } from "~/misc/types"
import {
  animateIndefinitely,
  insertElementByIndex,
  getChildDivByIndex,
} from "~/misc/elementHelpers"
import { createEmoWithBoardEmo, updateEmoStat, getEmoBodyOuterFromEmo } from "~/misc/emo/element"
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
  const body = getEmoBodyOuterFromEmo(emoElement)
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
  const body = getEmoBodyOuterFromEmo(emoElement)

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
  positiveOrNegative: "positive" | "negative",
  emoIndex: number,
  attack: number,
  health: number,
  calculatedAttack: string,
  calculatedHealth: string
) => {
  const emoElement = getChildDivByIndex(boardElement, emoIndex)
  const pros: Promise<any>[] = []

  if (attack !== 0) {
    pros.push(showStatsText(emoElement, positiveOrNegative, "attack", attack))
  }
  if (health !== 0) {
    pros.push(showStatsText(emoElement, positiveOrNegative, "health", health))
  }

  pros.push(
    getEmoBodyOuterFromEmo(emoElement).animate(
      {
        filter: [
          "brightness(1)",
          `brightness(${positiveOrNegative === "positive" ? "1.4" : "0.6"}`,
          "brightness(1)",
        ],
      },
      { duration: 600 }
    ).finished
  )

  await sleep(400)

  if (attack !== 0) {
    updateEmoStat(emoElement, "attack", positiveOrNegative, calculatedAttack)
  }
  if (health !== 0) {
    updateEmoStat(emoElement, "health", positiveOrNegative, calculatedHealth)
  }

  await Promise.all(pros)
}

const showStatsText = async (
  element: HTMLDivElement,
  positiveOrNegative: "positive" | "negative",
  attackOrHealth: "attack" | "health",
  value: number
) => {
  const e = document.createElement("div")

  e.textContent = `${positiveOrNegative === "positive" ? "+" : ""}${value}`
  e.classList.add(`emo-${attackOrHealth}-diff`)
  e.classList.add(`oeb-${positiveOrNegative}`)
  e.style.opacity = "0"

  element.appendChild(e)

  await e.animate({ opacity: ["0", "1", "1", "0"] }, { duration: 800 }).finished
  e.remove()
}
