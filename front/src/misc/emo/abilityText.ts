import { u16 } from "@polkadot/types/primitive"

import { shieldText, attractiveText } from "~/misc/constants"
import {
  emo_ability_Ability,
  emo_ability_shop_Shop,
  emo_ability_battle_Battle,
  emo_ability_Target,
  emo_ability_battle_Special,
  emo_ability_shop_Pre,
  emo_ability_shop_NormalAction,
  emo_ability_TypOptAndIsTripleOpt,
  emo_ability_battle_General,
  emo_ability_battle_NormalAction,
  emo_ability_TargetOrRandom,
  emo_ability_shop_Peri_AsOneself,
  emo_ability_shop_Peri_AsAlly,
  emo_ability_battle_General_AsOneself,
  emo_ability_battle_General_AsAlly,
  emo_ability_Side,
} from "common"
import { findEmoBase, getEmoBaseEmoji, getEmoBaseName } from "../mtcUtils"
import type { EmoBases } from "~/misc/types"

export const buildEmoAbilitiesText = (
  abilities: emo_ability_Ability[],
  isTriple: boolean,
  emoBases: EmoBases
) => abilities.map((ability) => buildEmoAbilityText(ability, isTriple, emoBases))

export const buildEmoAbilityText = (
  ability: emo_ability_Ability,
  isTriple: boolean,
  emoBases: EmoBases
) => {
  if (ability.isShop) {
    return {
      phase: "Shop",
      ...shopAbility(ability.asShop, isTriple, emoBases),
    }
  }

  if (ability.isBattle) {
    return {
      phase: "Battle",
      ...battleAbility(ability.asBattle, isTriple, emoBases),
    }
  }

  return { phase: "", trigger: "", action: JSON.stringify(ability.toJSON()) }
}

const shopAbility = (
  ability: emo_ability_shop_Shop,
  isTriple: boolean,
  emoBases: EmoBases
): { trigger: string; action: string } => {
  if (ability.isPre) {
    return {
      trigger: "Start of phase",
      action: shopPreAction(ability.asPre, isTriple, emoBases),
    }
  }

  if (ability.isPeri) {
    if (ability.asPeri.isAsOneself) {
      return shopPeriAsOneself(ability.asPeri.asAsOneself, isTriple, emoBases)
    }

    if (ability.asPeri.isAsAlly) {
      return shopPeriAsAlly(ability.asPeri.asAsAlly, isTriple)
    }
  }

  return {
    trigger: "",
    action: JSON.stringify(ability.toJSON()),
  }
}

const shopPreAction = (
  action: emo_ability_shop_Pre,
  isTriple: boolean,
  emoBases: EmoBases
): string => {
  if (action.isNormal) {
    return shopNormalActionAsOneself(action.asNormal, isTriple, emoBases)
  }

  if (action.isRandom) {
    if (action.asRandom.isIncreaseStatsOfMenagerie) {
      const a = action.asRandom.asIncreaseStatsOfMenagerie
      return `Give ${a.typ_count.toString()} different types of EMOs ${increaseStats(
        a.attack,
        a.health,
        isTriple
      )}`
    }
  }

  return JSON.stringify(action.toJSON())
}

const shopPeriAsOneself = (
  ability: emo_ability_shop_Peri_AsOneself,
  isTriple: boolean,
  emoBases: EmoBases
) => {
  let trigger
  if (ability.trigger.isSet) {
    trigger = "Set"
  }
  if (ability.trigger.isSell) {
    trigger = "Sell"
  }
  if (ability.trigger.isAllySet) {
    const v = ability.trigger.asAllySet
    trigger = `An ally ${typAndTriple(v.typ_and_triple)}EMO sets`
  }
  trigger ||= JSON.stringify(ability.trigger.toJSON())

  return {
    trigger,
    action: shopNormalActionAsOneself(ability.action, isTriple, emoBases),
  }
}

const shopPeriAsAlly = (
  ability: emo_ability_shop_Peri_AsAlly,
  isTriple: boolean
): { trigger: string; action: string } => {
  let trigger
  if (ability.trigger.isAllySet) {
    const v = ability.trigger.asAllySet
    trigger = `An ally ${typAndTriple(v.typ_and_triple)}EMO sets`
  }
  trigger ||= JSON.stringify(ability.trigger.toJSON())

  let action
  if (ability.action.isOneselfTripleNormal) {
    const normalAction = ability.action.asOneselfTripleNormal

    if (normalAction.isIncreaseStats) {
      const a = normalAction.asIncreaseStats
      action = `${targetAsAlly(a.target)} ${increaseStats(a.attack, a.health, isTriple)}`
    }

    if (normalAction.isIncreaseStatsByGrade) {
      const a = normalAction.asIncreaseStatsByGrade
      action = `${targetAsAlly(a.target)} {${increaseStats(
        a.attack,
        a.health,
        isTriple
      )} * its grade}`
    }
  }
  if (ability.action.isCustom) {
    const a = ability.action.asCustom
    if (a.isTriggerSetActions) {
      action = `Its Sets trigger ${isTriple ? "three times" : "twice"}`
    }
  }
  action ||= JSON.stringify(ability.action.toJSON())

  return { trigger, action }
}

const shopNormalActionAsOneself = (
  action: emo_ability_shop_NormalAction,
  isTriple: boolean,
  emoBases: EmoBases
): string => {
  if (action.isSetEmo) {
    const a = action.asSetEmo
    return `Set a ${emoName(a.base_id, isTriple, emoBases)}`
  }

  if (action.isIncreaseStats) {
    const a = action.asIncreaseStats
    return `${targetAsOneself(a.target)} ${increaseStats(a.attack, a.health, isTriple)}`
  }

  if (action.isIncreaseStatsOfAdjacentMenagerie) {
    const a = action.asIncreaseStatsOfAdjacentMenagerie
    return `Give adjacent EMOs of different types ${increaseStats(a.attack, a.health, isTriple)}`
  }

  if (action.isIncreaseStatsByEmoCount) {
    const a = action.asIncreaseStatsByEmoCount
    return `${targetAsOneself(a.target)} ${increaseStats(
      a.attack,
      a.health,
      isTriple
    )} for each ${typAndTriple(a.count_condition)}EMO`
  }

  if (action.isAddAbility) {
    const a = action.asAddAbility
    if (a.ability.isBattle && a.ability.asBattle.isSpecial) {
      return `${targetAsOneself(a.target)} ${a.ability.asBattle.asSpecial.type}`
    }
    const newAbilityText = buildEmoAbilityText(a.ability, false, emoBases)
    return `${targetAsOneself(a.target)} an ability (phase: ${newAbilityText.phase}, trigger: ${
      newAbilityText.trigger
    }, action: ${newAbilityText.action})`
  }

  if (action.isGetCoin) {
    const a = action.asGetCoin
    const coin = a.coin.toNumber() * (isTriple ? 2 : 1)
    return `Get ${coin} coin${coin > 1 ? "s" : ""}`
  }

  if (action.isGetCoinByEmoCountDiv) {
    const a = action.asGetCoinByEmoCountDiv
    const divisor = a.divisor.toNumber()
    return `Get {${typAndTriple(a.count_condition)}EMO count${
      divisor === 1 ? "" : ` / ${divisor}`
    }${isTriple ? " * 2" : ""}} coin(s)`
  }

  return JSON.stringify(action.toJSON())
}

const battleAbility = (
  ability: emo_ability_battle_Battle,
  isTriple: boolean,
  emoBases: EmoBases
): { trigger: string; action: string } => {
  if (ability.isGeneral) {
    return battleGeneral(ability.asGeneral, isTriple, emoBases)
  }

  if (ability.isSpecial) {
    return battleSpecial(ability.asSpecial)
  }

  return { trigger: "", action: JSON.stringify(ability.toJSON()) }
}

const battleGeneral = (
  ability: emo_ability_battle_General,
  isTriple: boolean,
  emoBases: EmoBases
): { trigger: string; action: string } => {
  if (ability.isAsOneself) {
    return battleGeneralAsOneself(ability.asAsOneself, isTriple, emoBases)
  }

  if (ability.isAsAlly) {
    return battleGeneralAsAlly(ability.asAsAlly, isTriple)
  }

  return {
    trigger: "",
    action: JSON.stringify(ability.toJSON()),
  }
}

const battleGeneralAsOneself = (
  ability: emo_ability_battle_General_AsOneself,
  isTriple: boolean,
  emoBases: EmoBases
): { trigger: string; action: string } => {
  let trigger
  if (ability.trigger.isPre) {
    trigger = "Start of phase"
  }
  if (ability.trigger.isRetire) {
    trigger = "Retire"
  }
  if (ability.trigger.isAllyRetire) {
    const s = ability.trigger.asAllyRetire
    trigger = `An ally ${typAndTriple(s.typ_and_triple)}EMO retires`
  }
  if (ability.trigger.isAllyBattleAbilityRemoved) {
    const s = ability.trigger.asAllyBattleAbilityRemoved
    trigger = `An ally ${typAndTriple(s.typ_and_triple)}EMO ${
      s.excludes_same_base.isTrue ? "(excludes same emoji) " : ""
    }loses ${s.ability.isSpecial ? s.ability.asSpecial.type : JSON.stringify(s.ability)}`
  }
  if (ability.trigger.isRivalRetire) {
    const s = ability.trigger.asRivalRetire
    trigger = `An rival ${typAndTriple(s.typ_and_triple)}EMO retires`
  }
  trigger ||= JSON.stringify(ability.trigger.toJSON())

  return {
    trigger,
    action: battleNormalActionAsOneself(ability.action, isTriple, emoBases),
  }
}

const battleGeneralAsAlly = (
  ability: emo_ability_battle_General_AsAlly,
  isTriple: boolean
): { trigger: string; action: string } => {
  let trigger
  if (ability.trigger.isAllyRetire) {
    const s = ability.trigger.asAllyRetire
    trigger = `An ally ${typAndTriple(s.typ_and_triple)}EMO retires`
  }
  if (ability.trigger.isAllySet) {
    const s = ability.trigger.asAllySet
    trigger = `An ally ${typAndTriple(s.typ_and_triple)}EMO sets`
  }
  trigger ||= JSON.stringify(ability.trigger.toJSON())

  let action
  if (ability.action.isOneselfTripleNormal) {
    const ab = ability.action.asOneselfTripleNormal
    if (ab.isIncreaseStats) {
      const ac = ab.asIncreaseStats
      if (ac.target_or_random.isTarget && ac.target_or_random.asTarget.isOneself) {
        action = `Give it ${increaseStats(ac.attack, ac.health, isTriple)}`
      }
    }
  }
  if (ability.action.isCustom) {
    if (ability.action.asCustom.isTriggerRetireActions) {
      action = `Its Retires trigger ${isTriple ? "three times" : "twice"}`
    }
  }
  action ||= JSON.stringify(ability.action.toJSON())

  return { trigger, action }
}

const battleNormalActionAsOneself = (
  action: emo_ability_battle_NormalAction,
  isTriple: boolean,
  emoBases: EmoBases
): string => {
  if (action.isSetEmo) {
    const a = action.asSetEmo
    return `Set a ${emoName(a.base_id, isTriple, emoBases)}${
      a.side.isRival ? " on rival's board" : ""
    }`
  }
  if (action.isSetEmosByAttackDiv) {
    const a = action.asSetEmosByAttackDiv
    return `Set a number of ${emoName(
      a.base_id,
      isTriple,
      emoBases
    )} equal to this EMO's attack divided by ${a.divisor.toNumber()}${
      a.side.isRival ? " on rival's board" : ""
    }`
  }
  if (action.isIncreaseStats) {
    const a = action.asIncreaseStats
    return `${targetOrRandomAsOneself(a.target_or_random)} ${increaseStats(
      a.attack,
      a.health,
      isTriple
    )}`
  }
  if (action.isDecreaseStats) {
    const a = action.asDecreaseStats
    return `${targetOrRandomAsOneself(a.target_or_random)} ${decreaseStats(
      a.attack,
      a.health,
      isTriple
    )}`
  }
  if (action.isIncreaseStatsByEmoCount) {
    const a = action.asIncreaseStatsByEmoCount
    return `${targetOrRandomAsOneself(a.target_or_random)} ${increaseStats(
      a.attack,
      a.health,
      isTriple
    )} for ${side(a.side)} ${typAndTriple(a.count_condition)}EMOs on the board`
  }

  if (action.isAddBattleAbility) {
    const a = action.asAddBattleAbility
    const sp = a.ability.isSpecial ? a.ability.asSpecial.type : JSON.stringify(a.ability.toJSON())
    if (a.target_or_random.isTarget) {
      const target = a.target_or_random.asTarget
      return `${targetAsOneself(target)} ${sp}`
    }
    if (a.target_or_random.isRandom) {
      const r = a.target_or_random.asRandom
      if (r.count.toNumber() === 1) {
        return `Give ${isTriple ? "two" : "a"} random ally ${typAndTriple(r.typ_and_triple)}EMO${
          isTriple ? "s" : ""
        } ${sp}`
      }
    }
  }
  if (action.isDamageAll) {
    const a = action.asDamageAll
    return `Deal ${a.damage.toNumber() * (isTriple ? 2 : 1)} damage to all ${side(a.side)} EMOs`
  }

  return JSON.stringify(action.toJSON())
}

const battleSpecial = (
  ability: emo_ability_battle_Special
): { trigger: string; action: string } => {
  if (ability.isShield) {
    return {
      trigger: "Get damage",
      action: `Shield ${shieldText} (Ignore the damage and remove the Shield)`,
    }
  }

  if (ability.isAttractive) {
    return {
      trigger: "Rival attacks",
      action: `Atractive ${attractiveText} (Force rival EMOs to attack this first)`,
    }
  }

  if (ability.isAttackLowestAttack) {
    return {
      trigger: "Attack",
      action: "Attack the rival EMO with the lowest attack",
    }
  }

  return { trigger: "", action: JSON.stringify(ability.toJSON()) }
}

const typAndTriple = (typAndTriple: emo_ability_TypOptAndIsTripleOpt) => {
  const s: string[] = []

  if (typAndTriple.typ_opt.isSome) {
    s.push(typAndTriple.typ_opt.unwrap().type)
  }
  if (typAndTriple.is_triple_opt.isSome) {
    s.push(typAndTriple.is_triple_opt.unwrap().isTrue ? "Triple" : "non-Triple")
  }

  return s.length > 0 ? `${s.join(" ")} ` : ""
}

const targetOrRandomAsOneself = (targetOrRandom: emo_ability_TargetOrRandom) => {
  if (targetOrRandom.isTarget) {
    return targetAsOneself(targetOrRandom.asTarget)
  }
  if (targetOrRandom.isRandom) {
    const r = targetOrRandom.asRandom
    return `Give ${r.count.toString()} random ${typAndTriple(r.typ_and_triple)} EMO(s)`
  }
  return JSON.stringify(targetOrRandom.toJSON())
}

const targetAsOneself = (target: emo_ability_Target) => {
  if (target.isOneself) {
    return "Gain"
  }
  if (target.isOthers) {
    const o = target.asOthers
    const tt = typAndTriple(o.typ_and_triple)
    if (o.destination.isRight) {
      return `Give the right ${tt}EMO`
    }
    if (o.destination.isLeft) {
      return `Give the left ${tt}EMO`
    }
    if (o.destination.isAll) {
      return `Give other ${tt}EMOs`
    }
  }
  return JSON.stringify(target.toJSON())
}

const targetAsAlly = (target: emo_ability_Target) => {
  if (target.isOneself) {
    return "Give it"
  }
  if (target.isOthers) {
    const o = target.asOthers
    const tt = typAndTriple(o.typ_and_triple)
    if (o.destination.isRight) {
      return `Give its right ${tt}EMO`
    }
    if (o.destination.isLeft) {
      return `Give its left ${tt}EMO`
    }
  }
  return JSON.stringify(target.toJSON())
}

const increaseStats = (attack: u16, health: u16, isTriple: boolean) =>
  `+${attack.toNumber() * (isTriple ? 2 : 1)}/+${health.toNumber() * (isTriple ? 2 : 1)}`

const decreaseStats = (attack: u16, health: u16, isTriple: boolean) =>
  `-${attack.toNumber() * (isTriple ? 2 : 1)}/-${health.toNumber() * (isTriple ? 2 : 1)}`

const emoName = (baseId: u16, isTriple: boolean, emoBases: EmoBases) => {
  const m = findEmoBase(baseId, emoBases)
  return `${isTriple ? "Triple " : ""}${getEmoBaseEmoji(m)} (${getEmoBaseName(m)})`
}

const side = (side: emo_ability_Side) => side.type.toLowerCase()
