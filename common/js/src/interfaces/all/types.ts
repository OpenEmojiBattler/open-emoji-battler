// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import type { BTreeMap, Bytes, Enum, Option, Struct, Vec, bool, u16, u32, u8 } from '@polkadot/types-codec';
import type { ITuple } from '@polkadot/types-codec/types';

/** @name emo_ability_Ability */
export interface emo_ability_Ability extends Enum {
  readonly isShop: boolean;
  readonly asShop: emo_ability_shop_Shop;
  readonly isBattle: boolean;
  readonly asBattle: emo_ability_battle_Battle;
  readonly type: 'Shop' | 'Battle';
}

/** @name emo_ability_battle_AsAllyAction */
export interface emo_ability_battle_AsAllyAction extends Enum {
  readonly isTriggerRetireActions: boolean;
  readonly type: 'TriggerRetireActions';
}

/** @name emo_ability_battle_Battle */
export interface emo_ability_battle_Battle extends Enum {
  readonly isGeneral: boolean;
  readonly asGeneral: emo_ability_battle_General;
  readonly isSpecial: boolean;
  readonly asSpecial: emo_ability_battle_Special;
  readonly type: 'General' | 'Special';
}

/** @name emo_ability_battle_General */
export interface emo_ability_battle_General extends Enum {
  readonly isAsOneself: boolean;
  readonly asAsOneself: emo_ability_battle_General_AsOneself;
  readonly isAsAlly: boolean;
  readonly asAsAlly: emo_ability_battle_General_AsAlly;
  readonly type: 'AsOneself' | 'AsAlly';
}

/** @name emo_ability_battle_General_AsAlly */
export interface emo_ability_battle_General_AsAlly extends Struct {
  readonly trigger: emo_ability_battle_GeneralAsAllyTrigger;
  readonly action: emo_ability_battle_GeneralAsAllyAction;
}

/** @name emo_ability_battle_General_AsOneself */
export interface emo_ability_battle_General_AsOneself extends Struct {
  readonly trigger: emo_ability_battle_GeneralAsOneselfTrigger;
  readonly action: emo_ability_battle_NormalAction;
}

/** @name emo_ability_battle_GeneralAsAllyAction */
export interface emo_ability_battle_GeneralAsAllyAction extends Enum {
  readonly isOneselfTripleNormal: boolean;
  readonly asOneselfTripleNormal: emo_ability_battle_NormalAction;
  readonly isCustom: boolean;
  readonly asCustom: emo_ability_battle_AsAllyAction;
  readonly type: 'OneselfTripleNormal' | 'Custom';
}

/** @name emo_ability_battle_GeneralAsAllyTrigger */
export interface emo_ability_battle_GeneralAsAllyTrigger extends Enum {
  readonly isAllySet: boolean;
  readonly asAllySet: emo_ability_battle_GeneralAsAllyTrigger_AllySet;
  readonly isAllyRetire: boolean;
  readonly asAllyRetire: emo_ability_battle_GeneralAsAllyTrigger_AllyRetire;
  readonly type: 'AllySet' | 'AllyRetire';
}

/** @name emo_ability_battle_GeneralAsAllyTrigger_AllyRetire */
export interface emo_ability_battle_GeneralAsAllyTrigger_AllyRetire extends Struct {
  readonly typ_and_triple: emo_ability_TypOptAndIsTripleOpt;
}

/** @name emo_ability_battle_GeneralAsAllyTrigger_AllySet */
export interface emo_ability_battle_GeneralAsAllyTrigger_AllySet extends Struct {
  readonly typ_and_triple: emo_ability_TypOptAndIsTripleOpt;
}

/** @name emo_ability_battle_GeneralAsOneselfTrigger */
export interface emo_ability_battle_GeneralAsOneselfTrigger extends Enum {
  readonly isPre: boolean;
  readonly isRetire: boolean;
  readonly isAllyRetire: boolean;
  readonly asAllyRetire: emo_ability_battle_GeneralAsOneselfTrigger_AllyRetire;
  readonly isRivalRetire: boolean;
  readonly asRivalRetire: emo_ability_battle_GeneralAsOneselfTrigger_RivalRetire;
  readonly isAllyBattleAbilityRemoved: boolean;
  readonly asAllyBattleAbilityRemoved: emo_ability_battle_GeneralAsOneselfTrigger_AllyBattleAbilityRemoved;
  readonly type: 'Pre' | 'Retire' | 'AllyRetire' | 'RivalRetire' | 'AllyBattleAbilityRemoved';
}

/** @name emo_ability_battle_GeneralAsOneselfTrigger_AllyBattleAbilityRemoved */
export interface emo_ability_battle_GeneralAsOneselfTrigger_AllyBattleAbilityRemoved extends Struct {
  readonly typ_and_triple: emo_ability_TypOptAndIsTripleOpt;
  readonly excludes_same_base: bool;
  readonly ability: emo_ability_battle_Battle;
}

/** @name emo_ability_battle_GeneralAsOneselfTrigger_AllyRetire */
export interface emo_ability_battle_GeneralAsOneselfTrigger_AllyRetire extends Struct {
  readonly typ_and_triple: emo_ability_TypOptAndIsTripleOpt;
}

/** @name emo_ability_battle_GeneralAsOneselfTrigger_RivalRetire */
export interface emo_ability_battle_GeneralAsOneselfTrigger_RivalRetire extends Struct {
  readonly typ_and_triple: emo_ability_TypOptAndIsTripleOpt;
}

/** @name emo_ability_battle_NormalAction */
export interface emo_ability_battle_NormalAction extends Enum {
  readonly isSetEmo: boolean;
  readonly asSetEmo: emo_ability_battle_NormalAction_SetEmo;
  readonly isSetEmosByAttackDiv: boolean;
  readonly asSetEmosByAttackDiv: emo_ability_battle_NormalAction_SetEmosByAttackDiv;
  readonly isIncreaseStats: boolean;
  readonly asIncreaseStats: emo_ability_battle_NormalAction_IncreaseStats;
  readonly isDecreaseStats: boolean;
  readonly asDecreaseStats: emo_ability_battle_NormalAction_DecreaseStats;
  readonly isIncreaseStatsByEmoCount: boolean;
  readonly asIncreaseStatsByEmoCount: emo_ability_battle_NormalAction_IncreaseStatsByEmoCount;
  readonly isAddBattleAbility: boolean;
  readonly asAddBattleAbility: emo_ability_battle_NormalAction_AddBattleAbility;
  readonly isDamageAll: boolean;
  readonly asDamageAll: emo_ability_battle_NormalAction_DamageAll;
  readonly type: 'SetEmo' | 'SetEmosByAttackDiv' | 'IncreaseStats' | 'DecreaseStats' | 'IncreaseStatsByEmoCount' | 'AddBattleAbility' | 'DamageAll';
}

/** @name emo_ability_battle_NormalAction_AddBattleAbility */
export interface emo_ability_battle_NormalAction_AddBattleAbility extends Struct {
  readonly target_or_random: emo_ability_TargetOrRandom;
  readonly ability: emo_ability_battle_Battle;
}

/** @name emo_ability_battle_NormalAction_DamageAll */
export interface emo_ability_battle_NormalAction_DamageAll extends Struct {
  readonly side: emo_ability_Side;
  readonly damage: u16;
}

/** @name emo_ability_battle_NormalAction_DecreaseStats */
export interface emo_ability_battle_NormalAction_DecreaseStats extends Struct {
  readonly target_or_random: emo_ability_TargetOrRandom;
  readonly attack: u16;
  readonly health: u16;
}

/** @name emo_ability_battle_NormalAction_IncreaseStats */
export interface emo_ability_battle_NormalAction_IncreaseStats extends Struct {
  readonly target_or_random: emo_ability_TargetOrRandom;
  readonly attack: u16;
  readonly health: u16;
}

/** @name emo_ability_battle_NormalAction_IncreaseStatsByEmoCount */
export interface emo_ability_battle_NormalAction_IncreaseStatsByEmoCount extends Struct {
  readonly side: emo_ability_Side;
  readonly target_or_random: emo_ability_TargetOrRandom;
  readonly count_condition: emo_ability_TypOptAndIsTripleOpt;
  readonly attack: u16;
  readonly health: u16;
}

/** @name emo_ability_battle_NormalAction_SetEmo */
export interface emo_ability_battle_NormalAction_SetEmo extends Struct {
  readonly side: emo_ability_Side;
  readonly base_id: u16;
}

/** @name emo_ability_battle_NormalAction_SetEmosByAttackDiv */
export interface emo_ability_battle_NormalAction_SetEmosByAttackDiv extends Struct {
  readonly side: emo_ability_Side;
  readonly base_id: u16;
  readonly divisor: u8;
}

/** @name emo_ability_battle_Special */
export interface emo_ability_battle_Special extends Enum {
  readonly isShield: boolean;
  readonly isAttractive: boolean;
  readonly isAttackLowestAttack: boolean;
  readonly type: 'Shield' | 'Attractive' | 'AttackLowestAttack';
}

/** @name emo_ability_Destination */
export interface emo_ability_Destination extends Enum {
  readonly isLeft: boolean;
  readonly isRight: boolean;
  readonly isAll: boolean;
  readonly type: 'Left' | 'Right' | 'All';
}

/** @name emo_ability_shop_AsAllyAction */
export interface emo_ability_shop_AsAllyAction extends Enum {
  readonly isTriggerSetActions: boolean;
  readonly type: 'TriggerSetActions';
}

/** @name emo_ability_shop_NormalAction */
export interface emo_ability_shop_NormalAction extends Enum {
  readonly isSetEmo: boolean;
  readonly asSetEmo: emo_ability_shop_NormalAction_SetEmo;
  readonly isIncreaseStats: boolean;
  readonly asIncreaseStats: emo_ability_shop_NormalAction_IncreaseStats;
  readonly isIncreaseStatsByEmoCount: boolean;
  readonly asIncreaseStatsByEmoCount: emo_ability_shop_NormalAction_IncreaseStatsByEmoCount;
  readonly isIncreaseStatsByGrade: boolean;
  readonly asIncreaseStatsByGrade: emo_ability_shop_NormalAction_IncreaseStatsByGrade;
  readonly isIncreaseStatsOfAdjacentMenagerie: boolean;
  readonly asIncreaseStatsOfAdjacentMenagerie: emo_ability_shop_NormalAction_IncreaseStatsOfAdjacentMenagerie;
  readonly isAddAbility: boolean;
  readonly asAddAbility: emo_ability_shop_NormalAction_AddAbility;
  readonly isGetCoin: boolean;
  readonly asGetCoin: emo_ability_shop_NormalAction_GetCoin;
  readonly isGetCoinByEmoCountDiv: boolean;
  readonly asGetCoinByEmoCountDiv: emo_ability_shop_NormalAction_GetCoinByEmoCountDiv;
  readonly type: 'SetEmo' | 'IncreaseStats' | 'IncreaseStatsByEmoCount' | 'IncreaseStatsByGrade' | 'IncreaseStatsOfAdjacentMenagerie' | 'AddAbility' | 'GetCoin' | 'GetCoinByEmoCountDiv';
}

/** @name emo_ability_shop_NormalAction_AddAbility */
export interface emo_ability_shop_NormalAction_AddAbility extends Struct {
  readonly target: emo_ability_Target;
  readonly ability: emo_ability_Ability;
}

/** @name emo_ability_shop_NormalAction_GetCoin */
export interface emo_ability_shop_NormalAction_GetCoin extends Struct {
  readonly coin: u8;
}

/** @name emo_ability_shop_NormalAction_GetCoinByEmoCountDiv */
export interface emo_ability_shop_NormalAction_GetCoinByEmoCountDiv extends Struct {
  readonly count_condition: emo_ability_TypOptAndIsTripleOpt;
  readonly divisor: u8;
}

/** @name emo_ability_shop_NormalAction_IncreaseStats */
export interface emo_ability_shop_NormalAction_IncreaseStats extends Struct {
  readonly target: emo_ability_Target;
  readonly attack: u16;
  readonly health: u16;
}

/** @name emo_ability_shop_NormalAction_IncreaseStatsByEmoCount */
export interface emo_ability_shop_NormalAction_IncreaseStatsByEmoCount extends Struct {
  readonly target: emo_ability_Target;
  readonly count_condition: emo_ability_TypOptAndIsTripleOpt;
  readonly attack: u16;
  readonly health: u16;
}

/** @name emo_ability_shop_NormalAction_IncreaseStatsByGrade */
export interface emo_ability_shop_NormalAction_IncreaseStatsByGrade extends Struct {
  readonly target: emo_ability_Target;
  readonly attack: u16;
  readonly health: u16;
}

/** @name emo_ability_shop_NormalAction_IncreaseStatsOfAdjacentMenagerie */
export interface emo_ability_shop_NormalAction_IncreaseStatsOfAdjacentMenagerie extends Struct {
  readonly attack: u16;
  readonly health: u16;
}

/** @name emo_ability_shop_NormalAction_SetEmo */
export interface emo_ability_shop_NormalAction_SetEmo extends Struct {
  readonly base_id: u16;
}

/** @name emo_ability_shop_Peri */
export interface emo_ability_shop_Peri extends Enum {
  readonly isAsOneself: boolean;
  readonly asAsOneself: emo_ability_shop_Peri_AsOneself;
  readonly isAsAlly: boolean;
  readonly asAsAlly: emo_ability_shop_Peri_AsAlly;
  readonly type: 'AsOneself' | 'AsAlly';
}

/** @name emo_ability_shop_Peri_AsAlly */
export interface emo_ability_shop_Peri_AsAlly extends Struct {
  readonly trigger: emo_ability_shop_PeriAsAllyTrigger;
  readonly action: emo_ability_shop_PeriAsAllyAction;
}

/** @name emo_ability_shop_Peri_AsOneself */
export interface emo_ability_shop_Peri_AsOneself extends Struct {
  readonly trigger: emo_ability_shop_PeriAsOneselfTrigger;
  readonly action: emo_ability_shop_NormalAction;
}

/** @name emo_ability_shop_PeriAsAllyAction */
export interface emo_ability_shop_PeriAsAllyAction extends Enum {
  readonly isOneselfTripleNormal: boolean;
  readonly asOneselfTripleNormal: emo_ability_shop_NormalAction;
  readonly isCustom: boolean;
  readonly asCustom: emo_ability_shop_AsAllyAction;
  readonly type: 'OneselfTripleNormal' | 'Custom';
}

/** @name emo_ability_shop_PeriAsAllyTrigger */
export interface emo_ability_shop_PeriAsAllyTrigger extends Enum {
  readonly isAllySet: boolean;
  readonly asAllySet: emo_ability_shop_PeriAsAllyTrigger_AllySet;
  readonly type: 'AllySet';
}

/** @name emo_ability_shop_PeriAsAllyTrigger_AllySet */
export interface emo_ability_shop_PeriAsAllyTrigger_AllySet extends Struct {
  readonly typ_and_triple: emo_ability_TypOptAndIsTripleOpt;
}

/** @name emo_ability_shop_PeriAsOneselfTrigger */
export interface emo_ability_shop_PeriAsOneselfTrigger extends Enum {
  readonly isSet: boolean;
  readonly isSell: boolean;
  readonly isAllySet: boolean;
  readonly asAllySet: emo_ability_shop_PeriAsOneselfTrigger_AllySet;
  readonly type: 'Set' | 'Sell' | 'AllySet';
}

/** @name emo_ability_shop_PeriAsOneselfTrigger_AllySet */
export interface emo_ability_shop_PeriAsOneselfTrigger_AllySet extends Struct {
  readonly typ_and_triple: emo_ability_TypOptAndIsTripleOpt;
}

/** @name emo_ability_shop_Pre */
export interface emo_ability_shop_Pre extends Enum {
  readonly isNormal: boolean;
  readonly asNormal: emo_ability_shop_NormalAction;
  readonly isRandom: boolean;
  readonly asRandom: emo_ability_shop_RandomAction;
  readonly type: 'Normal' | 'Random';
}

/** @name emo_ability_shop_RandomAction */
export interface emo_ability_shop_RandomAction extends Enum {
  readonly isIncreaseStatsOfMenagerie: boolean;
  readonly asIncreaseStatsOfMenagerie: emo_ability_shop_RandomAction_IncreaseStatsOfMenagerie;
  readonly type: 'IncreaseStatsOfMenagerie';
}

/** @name emo_ability_shop_RandomAction_IncreaseStatsOfMenagerie */
export interface emo_ability_shop_RandomAction_IncreaseStatsOfMenagerie extends Struct {
  readonly typ_count: u8;
  readonly attack: u16;
  readonly health: u16;
}

/** @name emo_ability_shop_Shop */
export interface emo_ability_shop_Shop extends Enum {
  readonly isPre: boolean;
  readonly asPre: emo_ability_shop_Pre;
  readonly isPeri: boolean;
  readonly asPeri: emo_ability_shop_Peri;
  readonly isSpecial: boolean;
  readonly asSpecial: emo_ability_shop_Special;
  readonly type: 'Pre' | 'Peri' | 'Special';
}

/** @name emo_ability_shop_Special */
export interface emo_ability_shop_Special extends Enum {
  readonly isPlaceholder: boolean;
  readonly type: 'Placeholder';
}

/** @name emo_ability_Side */
export interface emo_ability_Side extends Enum {
  readonly isAlly: boolean;
  readonly isRival: boolean;
  readonly type: 'Ally' | 'Rival';
}

/** @name emo_ability_Target */
export interface emo_ability_Target extends Enum {
  readonly isOneself: boolean;
  readonly isOthers: boolean;
  readonly asOthers: emo_ability_Target_Others;
  readonly type: 'Oneself' | 'Others';
}

/** @name emo_ability_Target_Others */
export interface emo_ability_Target_Others extends Struct {
  readonly destination: emo_ability_Destination;
  readonly typ_and_triple: emo_ability_TypOptAndIsTripleOpt;
}

/** @name emo_ability_TargetOrRandom */
export interface emo_ability_TargetOrRandom extends Enum {
  readonly isTarget: boolean;
  readonly asTarget: emo_ability_Target;
  readonly isRandom: boolean;
  readonly asRandom: emo_ability_TargetOrRandom_Random;
  readonly type: 'Target' | 'Random';
}

/** @name emo_ability_TargetOrRandom_Random */
export interface emo_ability_TargetOrRandom_Random extends Struct {
  readonly typ_and_triple: emo_ability_TypOptAndIsTripleOpt;
  readonly count: u8;
}

/** @name emo_ability_TypOptAndIsTripleOpt */
export interface emo_ability_TypOptAndIsTripleOpt extends Struct {
  readonly typ_opt: Option<emo_Typ>;
  readonly is_triple_opt: Option<bool>;
}

/** @name emo_Attributes */
export interface emo_Attributes extends Struct {
  readonly attack: u16;
  readonly health: u16;
  readonly abilities: Vec<emo_ability_Ability>;
  readonly is_triple: bool;
}

/** @name emo_Base */
export interface emo_Base extends Struct {
  readonly id: u16;
  readonly typ: emo_Typ;
  readonly codepoint: u32;
  readonly grade: u8;
  readonly attack: u16;
  readonly health: u16;
  readonly abilities: Vec<emo_ability_Ability>;
}

/** @name emo_Bases */
export interface emo_Bases extends ITuple<[BTreeMap<u16, emo_Base>]> {}

/** @name emo_Typ */
export interface emo_Typ extends Enum {
  readonly isHuman: boolean;
  readonly isNature: boolean;
  readonly isFood: boolean;
  readonly isObject: boolean;
  readonly type: 'Human' | 'Nature' | 'Food' | 'Object';
}

/** @name mtc_battle_Log */
export interface mtc_battle_Log extends Enum {
  readonly isAttack: boolean;
  readonly asAttack: mtc_battle_Log_Attack;
  readonly isDamage: boolean;
  readonly asDamage: mtc_battle_Log_Damage;
  readonly isRemove: boolean;
  readonly asRemove: mtc_battle_Log_Remove;
  readonly isAdd: boolean;
  readonly asAdd: mtc_battle_Log_Add;
  readonly isIncreaseStats: boolean;
  readonly asIncreaseStats: mtc_battle_Log_IncreaseStats;
  readonly isDecreaseStats: boolean;
  readonly asDecreaseStats: mtc_battle_Log_DecreaseStats;
  readonly isAddBattleAbility: boolean;
  readonly asAddBattleAbility: mtc_battle_Log_AddBattleAbility;
  readonly isRemoveBattleAbility: boolean;
  readonly asRemoveBattleAbility: mtc_battle_Log_RemoveBattleAbility;
  readonly type: 'Attack' | 'Damage' | 'Remove' | 'Add' | 'IncreaseStats' | 'DecreaseStats' | 'AddBattleAbility' | 'RemoveBattleAbility';
}

/** @name mtc_battle_Log_Add */
export interface mtc_battle_Log_Add extends Struct {
  readonly player_index: u8;
  readonly emo_index: u8;
  readonly base_id: u16;
  readonly attributes: emo_Attributes;
}

/** @name mtc_battle_Log_AddBattleAbility */
export interface mtc_battle_Log_AddBattleAbility extends Struct {
  readonly player_index: u8;
  readonly emo_index: u8;
  readonly ability: emo_ability_battle_Battle;
  readonly is_emo_triple: bool;
}

/** @name mtc_battle_Log_Attack */
export interface mtc_battle_Log_Attack extends Struct {
  readonly attack_player_index: u8;
  readonly attack_emo_index: u8;
  readonly defense_emo_index: u8;
}

/** @name mtc_battle_Log_Damage */
export interface mtc_battle_Log_Damage extends Struct {
  readonly player_index: u8;
  readonly emo_index: u8;
  readonly damage: u16;
  readonly health: u16;
}

/** @name mtc_battle_Log_DecreaseStats */
export interface mtc_battle_Log_DecreaseStats extends Struct {
  readonly player_index: u8;
  readonly emo_index: u8;
  readonly attack: u16;
  readonly health: u16;
  readonly calculated_attack: u16;
  readonly calculated_health: u16;
}

/** @name mtc_battle_Log_IncreaseStats */
export interface mtc_battle_Log_IncreaseStats extends Struct {
  readonly player_index: u8;
  readonly emo_index: u8;
  readonly attack: u16;
  readonly health: u16;
  readonly calculated_attack: u16;
  readonly calculated_health: u16;
}

/** @name mtc_battle_Log_Remove */
export interface mtc_battle_Log_Remove extends Struct {
  readonly player_index: u8;
  readonly emo_index: u8;
}

/** @name mtc_battle_Log_RemoveBattleAbility */
export interface mtc_battle_Log_RemoveBattleAbility extends Struct {
  readonly player_index: u8;
  readonly emo_index: u8;
  readonly ability_index: u8;
  readonly ability: emo_ability_battle_Battle;
}

/** @name mtc_battle_Logs */
export interface mtc_battle_Logs extends Vec<mtc_battle_Log> {}

/** @name mtc_Board */
export interface mtc_Board extends Vec<mtc_BoardEmo> {}

/** @name mtc_BoardEmo */
export interface mtc_BoardEmo extends Struct {
  readonly mtc_emo_ids: Vec<u16>;
  readonly base_id: u16;
  readonly attributes: emo_Attributes;
}

/** @name mtc_Emo */
export interface mtc_Emo extends Struct {
  readonly id: u16;
  readonly base_id: u16;
}

/** @name mtc_Ghost */
export interface mtc_Ghost extends Struct {
  readonly history: Vec<mtc_GradeAndGhostBoard>;
}

/** @name mtc_GhostBoard */
export interface mtc_GhostBoard extends Vec<mtc_GhostBoardEmo> {}

/** @name mtc_GhostBoardEmo */
export interface mtc_GhostBoardEmo extends Struct {
  readonly base_id: u16;
  readonly attributes: emo_Attributes;
}

/** @name mtc_GhostState */
export interface mtc_GhostState extends Enum {
  readonly isActive: boolean;
  readonly asActive: mtc_GhostState_Active;
  readonly isRetired: boolean;
  readonly asRetired: mtc_GhostState_Retired;
  readonly type: 'Active' | 'Retired';
}

/** @name mtc_GhostState_Active */
export interface mtc_GhostState_Active extends Struct {
  readonly health: u8;
}

/** @name mtc_GhostState_Retired */
export interface mtc_GhostState_Retired extends Struct {
  readonly final_turn: u8;
}

/** @name mtc_GradeAndBoard */
export interface mtc_GradeAndBoard extends Struct {
  readonly grade: u8;
  readonly board: mtc_Board;
}

/** @name mtc_GradeAndGhostBoard */
export interface mtc_GradeAndGhostBoard extends Struct {
  readonly grade: u8;
  readonly board: mtc_GhostBoard;
}

/** @name mtc_shop_BoardLog */
export interface mtc_shop_BoardLog extends Enum {
  readonly isAdd: boolean;
  readonly asAdd: mtc_shop_BoardLog_Add;
  readonly isRemove: boolean;
  readonly asRemove: mtc_shop_BoardLog_Remove;
  readonly isMove: boolean;
  readonly asMove: mtc_shop_BoardLog_Move;
  readonly isIncreaseStats: boolean;
  readonly asIncreaseStats: mtc_shop_BoardLog_IncreaseStats;
  readonly isAddAbility: boolean;
  readonly asAddAbility: mtc_shop_BoardLog_AddAbility;
  readonly isTriple: boolean;
  readonly asTriple: mtc_shop_BoardLog_Triple;
  readonly type: 'Add' | 'Remove' | 'Move' | 'IncreaseStats' | 'AddAbility' | 'Triple';
}

/** @name mtc_shop_BoardLog_Add */
export interface mtc_shop_BoardLog_Add extends Struct {
  readonly index: u8;
  readonly board_emo: mtc_BoardEmo;
}

/** @name mtc_shop_BoardLog_AddAbility */
export interface mtc_shop_BoardLog_AddAbility extends Struct {
  readonly index: u8;
  readonly ability: emo_ability_Ability;
  readonly is_target_triple: bool;
}

/** @name mtc_shop_BoardLog_IncreaseStats */
export interface mtc_shop_BoardLog_IncreaseStats extends Struct {
  readonly index: u8;
  readonly attack: u16;
  readonly health: u16;
  readonly calculated_attack: u16;
  readonly calculated_health: u16;
}

/** @name mtc_shop_BoardLog_Move */
export interface mtc_shop_BoardLog_Move extends Struct {
  readonly from_index: u8;
  readonly to_index: u8;
}

/** @name mtc_shop_BoardLog_Remove */
export interface mtc_shop_BoardLog_Remove extends Struct {
  readonly index: u8;
}

/** @name mtc_shop_BoardLog_Triple */
export interface mtc_shop_BoardLog_Triple extends Struct {
  readonly removed_indexes: Bytes;
}

/** @name mtc_shop_BoardLogs */
export interface mtc_shop_BoardLogs extends Vec<mtc_shop_BoardLog> {}

/** @name mtc_shop_Catalog */
export interface mtc_shop_Catalog extends Vec<mtc_shop_CatalogLine> {}

/** @name mtc_shop_CatalogLine */
export interface mtc_shop_CatalogLine extends Vec<mtc_Emo> {}

/** @name mtc_shop_PlayerOperation */
export interface mtc_shop_PlayerOperation extends Enum {
  readonly isBuy: boolean;
  readonly asBuy: mtc_shop_PlayerOperation_Buy;
  readonly isSell: boolean;
  readonly asSell: mtc_shop_PlayerOperation_Sell;
  readonly isMove: boolean;
  readonly asMove: mtc_shop_PlayerOperation_Move;
  readonly isNextCatalogLine: boolean;
  readonly isUpgrade: boolean;
  readonly type: 'Buy' | 'Sell' | 'Move' | 'NextCatalogLine' | 'Upgrade';
}

/** @name mtc_shop_PlayerOperation_Buy */
export interface mtc_shop_PlayerOperation_Buy extends Struct {
  readonly mtc_emo_id: u16;
  readonly index: u8;
}

/** @name mtc_shop_PlayerOperation_Move */
export interface mtc_shop_PlayerOperation_Move extends Struct {
  readonly indexes: Bytes;
}

/** @name mtc_shop_PlayerOperation_Sell */
export interface mtc_shop_PlayerOperation_Sell extends Struct {
  readonly index: u8;
}

export type PHANTOM_ALL = 'all';
