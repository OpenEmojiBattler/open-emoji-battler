interface Def {
  name: string
}

interface ModDef extends Def {
  type: "mod"
  params: AnyDef[]
}

interface StructDef extends Def {
  type: "struct"
  params: { [key: string]: string }
}

interface TupleDef extends Def {
  type: "tuple"
  params: string[]
}

interface EnumDef extends Def {
  type: "enum"
  params: Array<{
    name: string
    params?: Omit<StructDef, "name"> | Omit<TupleDef, "name">
  }>
}

export type AnyDef = ModDef | StructDef | TupleDef | EnumDef

export const defs: AnyDef[] = [
  {
    type: "mod",
    name: "mtc",
    params: [
      {
        type: "struct",
        name: "Emo",
        params: { id: "u16", base_id: "u16" },
      },
      {
        type: "struct",
        name: "GradeAndBoard",
        params: { grade: "u8", board: "mtc::Board" },
      },
      { type: "tuple", name: "Board", params: ["Vec<mtc::BoardEmo>"] },
      {
        type: "struct",
        name: "BoardEmo",
        params: {
          mtc_emo_ids: "Vec<u16>",
          base_id: "u16",
          attributes: "emo::Attributes",
        },
      },
      {
        type: "struct",
        name: "Ghost",
        params: { history: "Vec<mtc::GradeAndGhostBoard>" },
      },
      {
        type: "struct",
        name: "GradeAndGhostBoard",
        params: { grade: "u8", board: "mtc::GhostBoard" },
      },
      { type: "tuple", name: "GhostBoard", params: ["Vec<mtc::GhostBoardEmo>"] },
      {
        type: "struct",
        name: "GhostBoardEmo",
        params: {
          base_id: "u16",
          attributes: "emo::Attributes",
        },
      },
      {
        type: "enum",
        name: "GhostState",
        params: [
          { name: "Active", params: { type: "struct", params: { health: "u8" } } },
          { name: "Retired", params: { type: "struct", params: { final_turn: "u8" } } },
        ],
      },
      {
        type: "mod",
        name: "shop",
        params: [
          {
            type: "tuple",
            name: "Catalog",
            params: ["Vec<mtc::shop::CatalogLine>"],
          },
          {
            type: "tuple",
            name: "CatalogLine",
            params: ["Vec<mtc::Emo>"],
          },
          {
            type: "enum",
            name: "PlayerOperation",
            params: [
              {
                name: "Buy",
                params: { type: "struct", params: { mtc_emo_id: "u16", index: "u8" } },
              },
              { name: "Sell", params: { type: "struct", params: { index: "u8" } } },
              { name: "Move", params: { type: "struct", params: { indexes: "Vec<u8>" } } },
              { name: "NextCatalogLine" },
              { name: "Upgrade" },
            ],
          },
          {
            type: "tuple",
            name: "BoardLogs",
            params: ["Vec<mtc::shop::BoardLog>"],
          },
          {
            type: "enum",
            name: "BoardLog",
            params: [
              {
                name: "Add",
                params: { type: "struct", params: { index: "u8", board_emo: "mtc::BoardEmo" } },
              },
              {
                name: "Remove",
                params: { type: "struct", params: { index: "u8" } },
              },
              {
                name: "Move",
                params: { type: "struct", params: { from_index: "u8", to_index: "u8" } },
              },
              {
                name: "IncreaseStats",
                params: {
                  type: "struct",
                  params: {
                    index: "u8",
                    attack: "u16",
                    health: "u16",
                    calculated_attack: "u16",
                    calculated_health: "u16",
                  },
                },
              },
              {
                name: "AddAbility",
                params: {
                  type: "struct",
                  params: {
                    index: "u8",
                    ability: "emo::ability::Ability",
                    is_target_triple: "bool",
                  },
                },
              },
              {
                name: "Triple",
                params: {
                  type: "struct",
                  params: { removed_indexes: "Vec<u8>" },
                },
              },
            ],
          },
        ],
      },
      {
        type: "mod",
        name: "battle",
        params: [
          {
            type: "tuple",
            name: "Logs",
            params: ["Vec<mtc::battle::Log>"],
          },
          {
            type: "enum",
            name: "Log",
            params: [
              {
                name: "Attack",
                params: {
                  type: "struct",
                  params: {
                    attack_player_index: "u8",
                    attack_emo_index: "u8",
                    defense_emo_index: "u8",
                  },
                },
              },
              {
                name: "Damage",
                params: {
                  type: "struct",
                  params: { player_index: "u8", emo_index: "u8", damage: "u16", health: "u16" },
                },
              },
              {
                name: "Remove",
                params: { type: "struct", params: { player_index: "u8", emo_index: "u8" } },
              },
              {
                name: "Add",
                params: {
                  type: "struct",
                  params: {
                    player_index: "u8",
                    emo_index: "u8",
                    base_id: "u16",
                    attributes: "emo::Attributes",
                  },
                },
              },
              {
                name: "IncreaseStats",
                params: {
                  type: "struct",
                  params: {
                    player_index: "u8",
                    emo_index: "u8",
                    attack: "u16",
                    health: "u16",
                    calculated_attack: "u16",
                    calculated_health: "u16",
                  },
                },
              },
              {
                name: "DecreaseStats",
                params: {
                  type: "struct",
                  params: {
                    player_index: "u8",
                    emo_index: "u8",
                    attack: "u16",
                    health: "u16",
                    calculated_attack: "u16",
                    calculated_health: "u16",
                  },
                },
              },
              {
                name: "AddBattleAbility",
                params: {
                  type: "struct",
                  params: {
                    player_index: "u8",
                    emo_index: "u8",
                    ability: "emo::ability::battle::Battle",
                    is_emo_triple: "bool",
                  },
                },
              },
              {
                name: "RemoveBattleAbility",
                params: {
                  type: "struct",
                  params: {
                    player_index: "u8",
                    emo_index: "u8",
                    ability_index: "u8",
                    ability: "emo::ability::battle::Battle",
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "mod",
    name: "emo",
    params: [
      {
        type: "tuple",
        name: "Bases",
        params: ["BTreeMap<u16, emo::Base>"],
      },
      {
        type: "struct",
        name: "Base",
        params: {
          id: "u16",
          typ: "emo::Typ",
          codepoint: "u32",
          grade: "u8",
          attack: "u16",
          health: "u16",
          abilities: "Vec<emo::ability::Ability>",
        },
      },
      {
        type: "enum",
        name: "Typ",
        params: [{ name: "Human" }, { name: "Nature" }, { name: "Food" }, { name: "Object" }],
      },
      {
        type: "struct",
        name: "Attributes",
        params: {
          attack: "u16",
          health: "u16",
          abilities: "Vec<emo::ability::Ability>",
          is_triple: "bool",
        },
      },
      {
        type: "mod",
        name: "ability",
        params: [
          {
            type: "enum",
            name: "Ability",
            params: [
              {
                name: "Shop",
                params: { type: "tuple", params: ["emo::ability::shop::Shop"] },
              },
              {
                name: "Battle",
                params: { type: "tuple", params: ["emo::ability::battle::Battle"] },
              },
            ],
          },
          {
            type: "mod",
            name: "shop",
            params: [
              {
                type: "enum",
                name: "Shop",
                params: [
                  {
                    name: "Pre",
                    params: {
                      type: "tuple",
                      params: ["emo::ability::shop::Pre"],
                    },
                  },
                  {
                    name: "Peri",
                    params: { type: "tuple", params: ["emo::ability::shop::Peri"] },
                  },
                  {
                    name: "Special",
                    params: { type: "tuple", params: ["emo::ability::shop::Special"] },
                  },
                ],
              },
              {
                type: "enum",
                name: "Pre",
                params: [
                  {
                    name: "Normal",
                    params: {
                      type: "tuple",
                      params: ["emo::ability::shop::NormalAction"],
                    },
                  },
                  {
                    name: "Random",
                    params: { type: "tuple", params: ["emo::ability::shop::RandomAction"] },
                  },
                ],
              },
              {
                type: "enum",
                name: "Peri",
                params: [
                  {
                    name: "AsOneself",
                    params: {
                      type: "struct",
                      params: {
                        trigger: "emo::ability::shop::PeriAsOneselfTrigger",
                        action: "emo::ability::shop::NormalAction",
                      },
                    },
                  },
                  {
                    name: "AsAlly",
                    params: {
                      type: "struct",
                      params: {
                        trigger: "emo::ability::shop::PeriAsAllyTrigger",
                        action: "emo::ability::shop::PeriAsAllyAction",
                      },
                    },
                  },
                ],
              },
              {
                type: "enum",
                name: "Special",
                params: [{ name: "Placeholder" }],
              },
              {
                type: "enum",
                name: "PeriAsOneselfTrigger",
                params: [
                  {
                    name: "Set",
                  },
                  {
                    name: "Sell",
                  },
                  {
                    name: "AllySet",
                    params: {
                      type: "struct",
                      params: { typ_and_triple: "emo::ability::TypOptAndIsTripleOpt" },
                    },
                  },
                ],
              },
              {
                type: "enum",
                name: "PeriAsAllyTrigger",
                params: [
                  {
                    name: "AllySet",
                    params: {
                      type: "struct",
                      params: { typ_and_triple: "emo::ability::TypOptAndIsTripleOpt" },
                    },
                  },
                ],
              },
              {
                type: "enum",
                name: "PeriAsAllyAction",
                params: [
                  {
                    name: "OneselfTripleNormal",
                    params: {
                      type: "tuple",
                      params: ["emo::ability::shop::NormalAction"],
                    },
                  },
                  {
                    name: "Custom",
                    params: {
                      type: "tuple",
                      params: ["emo::ability::shop::AsAllyAction"],
                    },
                  },
                ],
              },
              {
                type: "enum",
                name: "NormalAction",
                params: [
                  {
                    name: "SetEmo",
                    params: { type: "struct", params: { base_id: "u16" } },
                  },
                  {
                    name: "IncreaseStats",
                    params: {
                      type: "struct",
                      params: { target: "emo::ability::Target", attack: "u16", health: "u16" },
                    },
                  },
                  {
                    name: "IncreaseStatsByEmoCount",
                    params: {
                      type: "struct",
                      params: {
                        target: "emo::ability::Target",
                        count_condition: "emo::ability::TypOptAndIsTripleOpt",
                        attack: "u16",
                        health: "u16",
                      },
                    },
                  },
                  {
                    name: "IncreaseStatsByGrade",
                    params: {
                      type: "struct",
                      params: { target: "emo::ability::Target", attack: "u16", health: "u16" },
                    },
                  },
                  {
                    name: "IncreaseStatsOfAdjacentMenagerie",
                    params: {
                      type: "struct",
                      params: { attack: "u16", health: "u16" },
                    },
                  },
                  {
                    name: "AddAbility",
                    params: {
                      type: "struct",
                      params: {
                        target: "emo::ability::Target",
                        ability: "Box<emo::ability::Ability>",
                      },
                    },
                  },
                  {
                    name: "GetCoin",
                    params: { type: "struct", params: { coin: "u8" } },
                  },
                  {
                    name: "GetCoinByEmoCountDiv",
                    params: {
                      type: "struct",
                      params: {
                        count_condition: "emo::ability::TypOptAndIsTripleOpt",
                        divisor: "u8",
                      },
                    },
                  },
                ],
              },
              {
                type: "enum",
                name: "RandomAction",
                params: [
                  {
                    name: "IncreaseStatsOfMenagerie",
                    params: {
                      type: "struct",
                      params: { typ_count: "u8", attack: "u16", health: "u16" },
                    },
                  },
                ],
              },
              {
                type: "enum",
                name: "AsAllyAction",
                params: [
                  {
                    name: "TriggerSetActions",
                  },
                ],
              },
            ],
          },
          {
            type: "mod",
            name: "battle",
            params: [
              {
                type: "enum",
                name: "Battle",
                params: [
                  {
                    name: "General",
                    params: { type: "tuple", params: ["emo::ability::battle::General"] },
                  },
                  {
                    name: "Special",
                    params: { type: "tuple", params: ["emo::ability::battle::Special"] },
                  },
                ],
              },
              {
                type: "enum",
                name: "General",
                params: [
                  {
                    name: "AsOneself",
                    params: {
                      type: "struct",
                      params: {
                        trigger: "emo::ability::battle::GeneralAsOneselfTrigger",
                        action: "emo::ability::battle::NormalAction",
                      },
                    },
                  },
                  {
                    name: "AsAlly",
                    params: {
                      type: "struct",
                      params: {
                        trigger: "emo::ability::battle::GeneralAsAllyTrigger",
                        action: "emo::ability::battle::GeneralAsAllyAction",
                      },
                    },
                  },
                ],
              },
              {
                type: "enum",
                name: "Special",
                params: [
                  {
                    name: "Shield",
                  },
                  {
                    name: "Attractive",
                  },
                  {
                    name: "AttackLowestAttack",
                  },
                ],
              },
              {
                type: "enum",
                name: "GeneralAsOneselfTrigger",
                params: [
                  {
                    name: "Pre",
                  },
                  {
                    name: "Retire",
                  },
                  {
                    name: "AllyRetire",
                    params: {
                      type: "struct",
                      params: { typ_and_triple: "emo::ability::TypOptAndIsTripleOpt" },
                    },
                  },
                  {
                    name: "RivalRetire",
                    params: {
                      type: "struct",
                      params: { typ_and_triple: "emo::ability::TypOptAndIsTripleOpt" },
                    },
                  },
                  {
                    name: "AllyBattleAbilityRemoved",
                    params: {
                      type: "struct",
                      params: {
                        typ_and_triple: "emo::ability::TypOptAndIsTripleOpt",
                        excludes_same_base: "bool",
                        ability: "Box<emo::ability::battle::Battle>",
                      },
                    },
                  },
                ],
              },
              {
                type: "enum",
                name: "GeneralAsAllyTrigger",
                params: [
                  {
                    name: "AllySet",
                    params: {
                      type: "struct",
                      params: { typ_and_triple: "emo::ability::TypOptAndIsTripleOpt" },
                    },
                  },
                  {
                    name: "AllyRetire",
                    params: {
                      type: "struct",
                      params: { typ_and_triple: "emo::ability::TypOptAndIsTripleOpt" },
                    },
                  },
                ],
              },
              {
                type: "enum",
                name: "GeneralAsAllyAction",
                params: [
                  {
                    name: "OneselfTripleNormal",
                    params: { type: "tuple", params: ["emo::ability::battle::NormalAction"] },
                  },
                  {
                    name: "Custom",
                    params: { type: "tuple", params: ["emo::ability::battle::AsAllyAction"] },
                  },
                ],
              },
              {
                type: "enum",
                name: "NormalAction",
                params: [
                  {
                    name: "SetEmo",
                    params: {
                      type: "struct",
                      params: { side: "emo::ability::Side", base_id: "u16" },
                    },
                  },
                  {
                    name: "SetEmosByAttackDiv",
                    params: {
                      type: "struct",
                      params: { side: "emo::ability::Side", base_id: "u16", divisor: "u8" },
                    },
                  },
                  {
                    name: "IncreaseStats",
                    params: {
                      type: "struct",
                      params: {
                        target_or_random: "emo::ability::TargetOrRandom",
                        attack: "u16",
                        health: "u16",
                      },
                    },
                  },
                  {
                    name: "DecreaseStats",
                    params: {
                      type: "struct",
                      params: {
                        target_or_random: "emo::ability::TargetOrRandom",
                        attack: "u16",
                        health: "u16",
                      },
                    },
                  },
                  {
                    name: "IncreaseStatsByEmoCount",
                    params: {
                      type: "struct",
                      params: {
                        side: "emo::ability::Side",
                        target_or_random: "emo::ability::TargetOrRandom",
                        count_condition: "emo::ability::TypOptAndIsTripleOpt",
                        attack: "u16",
                        health: "u16",
                      },
                    },
                  },
                  {
                    name: "AddBattleAbility",
                    params: {
                      type: "struct",
                      params: {
                        target_or_random: "emo::ability::TargetOrRandom",
                        ability: "Box<emo::ability::battle::Battle>",
                      },
                    },
                  },
                  {
                    name: "DamageAll",
                    params: {
                      type: "struct",
                      params: {
                        side: "emo::ability::Side",
                        damage: "u16",
                      },
                    },
                  },
                ],
              },
              {
                type: "enum",
                name: "AsAllyAction",
                params: [
                  {
                    name: "TriggerRetireActions",
                  },
                ],
              },
            ],
          },
          {
            type: "enum",
            name: "TargetOrRandom",
            params: [
              { name: "Target", params: { type: "tuple", params: ["emo::ability::Target"] } },
              {
                name: "Random",
                params: {
                  type: "struct",
                  params: { typ_and_triple: "emo::ability::TypOptAndIsTripleOpt", count: "u8" },
                },
              },
            ],
          },
          {
            type: "enum",
            name: "Target",
            params: [
              { name: "Oneself" },
              {
                name: "Others",
                params: {
                  type: "struct",
                  params: {
                    destination: "emo::ability::Destination",
                    typ_and_triple: "emo::ability::TypOptAndIsTripleOpt",
                  },
                },
              },
            ],
          },
          {
            type: "enum",
            name: "Destination",
            params: [{ name: "Left" }, { name: "Right" }, { name: "All" }],
          },
          {
            type: "struct",
            name: "TypOptAndIsTripleOpt",
            params: { typ_opt: "Option<emo::Typ>", is_triple_opt: "Option<bool>" },
          },
          {
            type: "enum",
            name: "Side",
            params: [{ name: "Ally" }, { name: "Rival" }],
          },
        ],
      },
    ],
  },
]
