import {
  emo_ability_Ability,
  emo_Typ,
  emo_Attributes,
  mtc_GhostBoardEmo,
  mtc_BoardEmo,
} from "common"

import type { EmoBases } from "~/misc/types"
import { shieldText, attractiveText } from "~/misc/constants"
import { getFirstSpanByClass } from "~/misc/elementHelpers"
import { getGradeText, getEmoName, findEmoBase, getEmoBaseEmoji } from "../mtcUtils"
import { buildEmoAbilityText } from "./abilityText"

export const createEmoElement = (
  emoji: string,
  typ: emo_Typ,
  grade: string,
  attributes: emo_Attributes,
  isInactive: boolean,
  emoBases: EmoBases
) => {
  const emo = createParent(typ, attributes.is_triple.isTrue, isInactive)

  emo.appendChild(createBody(emoji, grade, attributes))
  emo.appendChild(createInfo(emoji, attributes, emoBases))

  return emo
}

export const createEmoElementWithBoardEmo = (
  boardEmo: mtc_BoardEmo | mtc_GhostBoardEmo,
  emoBases: EmoBases
) => {
  const base = findEmoBase(boardEmo.base_id, emoBases)
  return createEmoElement(
    getEmoBaseEmoji(base),
    base.typ,
    base.grade.toString(),
    boardEmo.attributes,
    false,
    emoBases
  )
}

const createParent = (typ: emo_Typ, isTriple: boolean, isInactive: boolean) => {
  const e = document.createElement("div")
  e.className = `emo emo-typ-${typ.type.toLowerCase()} ${isTriple ? "emo-triple" : ""} ${
    isInactive ? "emo-inactive" : ""
  }`
  return e
}

const createBody = (emoji: string, grade: string, attributes: emo_Attributes) => {
  const outer = document.createElement("div")
  outer.className = "emo-body-outer"

  const inner = document.createElement("div")
  inner.className = "emo-body-inner"

  outer.appendChild(inner)

  inner.appendChild(createEmoji(emoji))
  inner.appendChild(createGrade(grade))
  inner.appendChild(createSpecials(attributes.abilities))

  const [attack, health] = createBottom(attributes.attack.toString(), attributes.health.toString())
  inner.appendChild(attack)
  inner.appendChild(health)

  return outer
}

const createEmoji = (emoji: string) => {
  const e = document.createElement("div")
  e.className = "emo-body-inner-emoji"
  e.textContent = emoji
  return e
}

const createGrade = (grade: string) => {
  const e = document.createElement("div")
  e.className = "emo-body-inner-grade"
  e.textContent = getGradeText(grade)
  return e
}

const createSpecials = (abilities: emo_ability_Ability[]) => {
  const e = document.createElement("div")
  e.className = "emo-body-inner-specials"

  const shieldElement = document.createElement("span")
  shieldElement.className = "emo-body-inner-specials-shield"
  shieldElement.textContent = shieldText
  shieldElement.style.display = "none"
  e.appendChild(shieldElement)

  const attractiveElement = document.createElement("span")
  attractiveElement.className = "emo-body-inner-specials-attractive"
  attractiveElement.textContent = attractiveText
  attractiveElement.style.display = "none"
  e.appendChild(attractiveElement)

  for (const ability of abilities) {
    if (!ability.isBattle || !ability.asBattle.isSpecial) {
      continue
    }
    const special = ability.asBattle.asSpecial
    if (special.isShield) {
      shieldElement.style.display = "inline"
    }
    if (special.isAttractive) {
      attractiveElement.style.display = "inline"
    }
  }

  return e
}

const createBottom = (attack: string, health: string) => {
  const attackElement = document.createElement("div")
  attackElement.className = "emo-body-inner-attack"
  attackElement.textContent = attack

  const healthElement = document.createElement("div")
  healthElement.className = "emo-body-inner-health"
  healthElement.textContent = health

  return [attackElement, healthElement] as const
}

const createInfo = (emoji: string, attributes: emo_Attributes, emoBases: EmoBases) => {
  const outer = document.createElement("div")
  outer.className = "emo-info-outer"

  const inner = document.createElement("div")
  inner.className = "emo-info-inner"

  outer.appendChild(inner)

  const firstElement = document.createElement("div")
  const strong = document.createElement("strong")
  strong.textContent = `${getEmoName(emoji)} `
  firstElement.appendChild(strong)
  const span = document.createElement("span")
  span.textContent = " "
  firstElement.appendChild(span)

  inner.appendChild(firstElement)

  const secondElement = document.createElement("div")
  secondElement.appendChild(
    createInfoAbilities(attributes.abilities, attributes.is_triple.isTrue, emoBases)
  )

  inner.appendChild(secondElement)

  return outer
}

const createInfoAbilities = (
  abilities: emo_ability_Ability[],
  isTriple: boolean,
  emoBases: EmoBases
) => {
  const table = document.createElement("table")
  table.className = "emo-table"
  const thead = document.createElement("thead")
  table.appendChild(thead)

  const trHead = document.createElement("tr")
  for (const text of ["Phase", "Trigger", "Action"]) {
    const th = document.createElement("th")
    th.textContent = text
    trHead.appendChild(th)
  }
  thead.appendChild(trHead)

  const tbody = document.createElement("tbody")
  tbody.className = "emo-table-body"
  table.appendChild(tbody)
  for (const ability of abilities) {
    tbody.appendChild(createInfoAbilityTr(ability, isTriple, emoBases))
  }

  return table
}

const createInfoAbilityTr = (
  ability: emo_ability_Ability,
  isTriple: boolean,
  emoBases: EmoBases
) => {
  const tr = document.createElement("tr")
  for (const text of Object.values(buildEmoAbilityText(ability, isTriple, emoBases))) {
    const td = document.createElement("td")
    td.textContent = text
    tr.appendChild(td)
  }
  return tr
}

export const addInfoAbility = (
  element: HTMLDivElement,
  ability: emo_ability_Ability,
  isTriple: boolean,
  emoBases: EmoBases
) => {
  const e = element.getElementsByClassName("emo-table-body")[0]
  e.appendChild(createInfoAbilityTr(ability, isTriple, emoBases))
}

export const removeInfoAbility = (element: HTMLDivElement, abilityIndex: number) =>
  element
    .getElementsByClassName("emo-table-body")[0]
    .getElementsByTagName("tr")
    [abilityIndex].remove()

export const updateEmoAttackElement = (element: HTMLDivElement, attack: string) => {
  element.getElementsByClassName("emo-body-inner-attack")[0].textContent = attack
}

export const updateEmoHealthElement = (element: HTMLDivElement, health: string) => {
  element.getElementsByClassName("emo-body-inner-health")[0].textContent = health
}

export const addSpecialToEmoElement = (element: HTMLDivElement, special: string) => {
  getSpecialElement(element, special).style.display = "inline"
}

export const removeSpecialToEmoElement = (element: HTMLDivElement, special: string) => {
  getSpecialElement(element, special).style.display = "none"
}

export const getSpecialElement = (element: HTMLDivElement, special: string) => {
  switch (special) {
    case "Shield":
      return getEmoShieldElement(element)
    case "Attractive":
      return getEmoAttractiveElement(element)
    default:
      throw new Error(`undefined special type: ${special}`)
  }
}

const getEmoShieldElement = (element: HTMLDivElement) =>
  getFirstSpanByClass(element, "emo-body-inner-specials-shield")

const getEmoAttractiveElement = (element: HTMLDivElement) =>
  getFirstSpanByClass(element, "emo-body-inner-specials-attractive")
