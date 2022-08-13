// Auto-generated via `yarn generate-codec-types`
use parity_scale_codec::{Decode, Encode};
use sp_std::{collections::btree_map::BTreeMap, prelude::*};

#[cfg(feature = "contract")]
use codec_types_derive::SpreadLayoutOneStorageCell;
#[cfg(feature = "contract")]
use ink_storage::traits::PackedLayout;

#[cfg(feature = "contract-std")]
use ink_storage::traits::StorageLayout;
#[cfg(feature = "contract-std")]
use scale_info::TypeInfo;

pub mod mtc {
    use super::*;

    #[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
    #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
    #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
    pub struct Emo {
        pub id: u16,
        pub base_id: u16,
    }

    #[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
    #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
    #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
    pub struct GradeAndBoard {
        pub grade: u8,
        pub board: mtc::Board,
    }

    #[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
    #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
    #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
    pub struct Board(pub Vec<mtc::BoardEmo>);

    #[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
    #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
    #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
    pub struct BoardEmo {
        pub mtc_emo_ids: Vec<u16>,
        pub base_id: u16,
        pub attributes: emo::Attributes,
    }

    #[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
    #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
    #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
    pub struct Ghost {
        pub history: Vec<mtc::GradeAndGhostBoard>,
    }

    #[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
    #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
    #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
    pub struct GradeAndGhostBoard {
        pub grade: u8,
        pub board: mtc::GhostBoard,
    }

    #[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
    #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
    #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
    pub struct GhostBoard(pub Vec<mtc::GhostBoardEmo>);

    #[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
    #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
    #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
    pub struct GhostBoardEmo {
        pub base_id: u16,
        pub attributes: emo::Attributes,
    }

    #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
    #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
    #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
    pub enum GhostState {
        Active { health: u8 },
        Retired { final_turn: u8 },
    }
    impl Default for GhostState {
        fn default() -> Self {
            Self::Active {
                health: Default::default(),
            }
        }
    }

    pub mod shop {
        use super::*;

        #[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
        #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
        #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
        pub struct Catalog(pub Vec<mtc::shop::CatalogLine>);

        #[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
        #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
        #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
        pub struct CatalogLine(pub Vec<mtc::Emo>);

        #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
        #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
        #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
        pub enum PlayerOperation {
            Buy { mtc_emo_id: u16, index: u8 },
            Sell { index: u8 },
            Move { indexes: Vec<u8> },
            NextCatalogLine,
            Upgrade,
        }
        impl Default for PlayerOperation {
            fn default() -> Self {
                Self::Buy {
                    mtc_emo_id: Default::default(),
                    index: Default::default(),
                }
            }
        }

        #[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
        #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
        #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
        pub struct BoardLogs(pub Vec<mtc::shop::BoardLog>);

        #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
        #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
        #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
        pub enum BoardLog {
            Add {
                index: u8,
                board_emo: mtc::BoardEmo,
            },
            Remove {
                index: u8,
            },
            Move {
                from_index: u8,
                to_index: u8,
            },
            IncreaseStats {
                index: u8,
                attack: u16,
                health: u16,
                calculated_attack: u16,
                calculated_health: u16,
            },
            AddAbility {
                index: u8,
                ability: emo::ability::Ability,
                is_target_triple: bool,
            },
            Triple {
                removed_indexes: Vec<u8>,
            },
        }
        impl Default for BoardLog {
            fn default() -> Self {
                Self::Add {
                    index: Default::default(),
                    board_emo: Default::default(),
                }
            }
        }
    }

    pub mod battle {
        use super::*;

        #[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
        #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
        #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
        pub struct Logs(pub Vec<mtc::battle::Log>);

        #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
        #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
        #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
        pub enum Log {
            Attack {
                attack_player_index: u8,
                attack_emo_index: u8,
                defense_emo_index: u8,
            },
            Damage {
                player_index: u8,
                emo_index: u8,
                damage: u16,
                health: u16,
            },
            Remove {
                player_index: u8,
                emo_index: u8,
            },
            Add {
                player_index: u8,
                emo_index: u8,
                base_id: u16,
                attributes: emo::Attributes,
            },
            IncreaseStats {
                player_index: u8,
                emo_index: u8,
                attack: u16,
                health: u16,
                calculated_attack: u16,
                calculated_health: u16,
            },
            DecreaseStats {
                player_index: u8,
                emo_index: u8,
                attack: u16,
                health: u16,
                calculated_attack: u16,
                calculated_health: u16,
            },
            AddBattleAbility {
                player_index: u8,
                emo_index: u8,
                ability: emo::ability::battle::Battle,
                is_emo_triple: bool,
            },
            RemoveBattleAbility {
                player_index: u8,
                emo_index: u8,
                ability_index: u8,
                ability: emo::ability::battle::Battle,
            },
        }
        impl Default for Log {
            fn default() -> Self {
                Self::Attack {
                    attack_player_index: Default::default(),
                    attack_emo_index: Default::default(),
                    defense_emo_index: Default::default(),
                }
            }
        }
    }

    pub mod storage {
        use super::*;

        #[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
        #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
        #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
        pub struct PlayerMutable {
            pub health: u8,
            pub grade_and_board_history: Vec<mtc::GradeAndBoard>,
            pub upgrade_coin: Option<u8>,
            pub ghost_states: Vec<mtc::GhostState>,
            pub battle_ghost_index: u8,
        }
    }
}

pub mod emo {
    use super::*;

    #[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
    #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
    #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
    pub struct Bases(pub BTreeMap<u16, emo::Base>);

    #[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
    #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
    #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
    pub struct Base {
        pub id: u16,
        pub typ: emo::Typ,
        pub codepoint: u32,
        pub grade: u8,
        pub attack: u16,
        pub health: u16,
        pub abilities: Vec<emo::ability::Ability>,
    }

    #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
    #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
    #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
    pub enum Typ {
        Human,
        Nature,
        Food,
        Object,
    }
    impl Default for Typ {
        fn default() -> Self {
            Self::Human
        }
    }

    #[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
    #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
    #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
    pub struct Attributes {
        pub attack: u16,
        pub health: u16,
        pub abilities: Vec<emo::ability::Ability>,
        pub is_triple: bool,
    }

    pub mod ability {
        use super::*;

        #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
        #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
        #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
        pub enum Ability {
            Shop(emo::ability::shop::Shop),
            Battle(emo::ability::battle::Battle),
        }
        impl Default for Ability {
            fn default() -> Self {
                Self::Shop(Default::default())
            }
        }

        pub mod shop {
            use super::*;

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum Shop {
                Pre(emo::ability::shop::Pre),
                Peri(emo::ability::shop::Peri),
                Special(emo::ability::shop::Special),
            }
            impl Default for Shop {
                fn default() -> Self {
                    Self::Pre(Default::default())
                }
            }

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum Pre {
                Normal(emo::ability::shop::NormalAction),
                Random(emo::ability::shop::RandomAction),
            }
            impl Default for Pre {
                fn default() -> Self {
                    Self::Normal(Default::default())
                }
            }

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum Peri {
                AsOneself {
                    trigger: emo::ability::shop::PeriAsOneselfTrigger,
                    action: emo::ability::shop::NormalAction,
                },
                AsAlly {
                    trigger: emo::ability::shop::PeriAsAllyTrigger,
                    action: emo::ability::shop::PeriAsAllyAction,
                },
            }
            impl Default for Peri {
                fn default() -> Self {
                    Self::AsOneself {
                        trigger: Default::default(),
                        action: Default::default(),
                    }
                }
            }

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum Special {
                Placeholder,
            }
            impl Default for Special {
                fn default() -> Self {
                    Self::Placeholder
                }
            }

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum PeriAsOneselfTrigger {
                Set,
                Sell,
                AllySet {
                    typ_and_triple: emo::ability::TypOptAndIsTripleOpt,
                },
            }
            impl Default for PeriAsOneselfTrigger {
                fn default() -> Self {
                    Self::Set
                }
            }

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum PeriAsAllyTrigger {
                AllySet {
                    typ_and_triple: emo::ability::TypOptAndIsTripleOpt,
                },
            }
            impl Default for PeriAsAllyTrigger {
                fn default() -> Self {
                    Self::AllySet {
                        typ_and_triple: Default::default(),
                    }
                }
            }

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum PeriAsAllyAction {
                OneselfTripleNormal(emo::ability::shop::NormalAction),
                Custom(emo::ability::shop::AsAllyAction),
            }
            impl Default for PeriAsAllyAction {
                fn default() -> Self {
                    Self::OneselfTripleNormal(Default::default())
                }
            }

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum NormalAction {
                SetEmo {
                    base_id: u16,
                },
                IncreaseStats {
                    target: emo::ability::Target,
                    attack: u16,
                    health: u16,
                },
                IncreaseStatsByEmoCount {
                    target: emo::ability::Target,
                    count_condition: emo::ability::TypOptAndIsTripleOpt,
                    attack: u16,
                    health: u16,
                },
                IncreaseStatsByGrade {
                    target: emo::ability::Target,
                    attack: u16,
                    health: u16,
                },
                IncreaseStatsOfAdjacentMenagerie {
                    attack: u16,
                    health: u16,
                },
                AddAbility {
                    target: emo::ability::Target,
                    ability: Box<emo::ability::Ability>,
                },
                GetCoin {
                    coin: u8,
                },
                GetCoinByEmoCountDiv {
                    count_condition: emo::ability::TypOptAndIsTripleOpt,
                    divisor: u8,
                },
            }
            impl Default for NormalAction {
                fn default() -> Self {
                    Self::SetEmo {
                        base_id: Default::default(),
                    }
                }
            }

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum RandomAction {
                IncreaseStatsOfMenagerie {
                    typ_count: u8,
                    attack: u16,
                    health: u16,
                },
            }
            impl Default for RandomAction {
                fn default() -> Self {
                    Self::IncreaseStatsOfMenagerie {
                        typ_count: Default::default(),
                        attack: Default::default(),
                        health: Default::default(),
                    }
                }
            }

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum AsAllyAction {
                TriggerSetActions,
            }
            impl Default for AsAllyAction {
                fn default() -> Self {
                    Self::TriggerSetActions
                }
            }
        }

        pub mod battle {
            use super::*;

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum Battle {
                General(emo::ability::battle::General),
                Special(emo::ability::battle::Special),
            }
            impl Default for Battle {
                fn default() -> Self {
                    Self::General(Default::default())
                }
            }

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum General {
                AsOneself {
                    trigger: emo::ability::battle::GeneralAsOneselfTrigger,
                    action: emo::ability::battle::NormalAction,
                },
                AsAlly {
                    trigger: emo::ability::battle::GeneralAsAllyTrigger,
                    action: emo::ability::battle::GeneralAsAllyAction,
                },
            }
            impl Default for General {
                fn default() -> Self {
                    Self::AsOneself {
                        trigger: Default::default(),
                        action: Default::default(),
                    }
                }
            }

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum Special {
                Shield,
                Attractive,
                AttackLowestAttack,
            }
            impl Default for Special {
                fn default() -> Self {
                    Self::Shield
                }
            }

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum GeneralAsOneselfTrigger {
                Pre,
                Retire,
                AllyRetire {
                    typ_and_triple: emo::ability::TypOptAndIsTripleOpt,
                },
                RivalRetire {
                    typ_and_triple: emo::ability::TypOptAndIsTripleOpt,
                },
                AllyBattleAbilityRemoved {
                    typ_and_triple: emo::ability::TypOptAndIsTripleOpt,
                    excludes_same_base: bool,
                    ability: Box<emo::ability::battle::Battle>,
                },
            }
            impl Default for GeneralAsOneselfTrigger {
                fn default() -> Self {
                    Self::Pre
                }
            }

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum GeneralAsAllyTrigger {
                AllySet {
                    typ_and_triple: emo::ability::TypOptAndIsTripleOpt,
                },
                AllyRetire {
                    typ_and_triple: emo::ability::TypOptAndIsTripleOpt,
                },
            }
            impl Default for GeneralAsAllyTrigger {
                fn default() -> Self {
                    Self::AllySet {
                        typ_and_triple: Default::default(),
                    }
                }
            }

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum GeneralAsAllyAction {
                OneselfTripleNormal(emo::ability::battle::NormalAction),
                Custom(emo::ability::battle::AsAllyAction),
            }
            impl Default for GeneralAsAllyAction {
                fn default() -> Self {
                    Self::OneselfTripleNormal(Default::default())
                }
            }

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum NormalAction {
                SetEmo {
                    side: emo::ability::Side,
                    base_id: u16,
                },
                SetEmosByAttackDiv {
                    side: emo::ability::Side,
                    base_id: u16,
                    divisor: u8,
                },
                IncreaseStats {
                    target_or_random: emo::ability::TargetOrRandom,
                    attack: u16,
                    health: u16,
                },
                DecreaseStats {
                    target_or_random: emo::ability::TargetOrRandom,
                    attack: u16,
                    health: u16,
                },
                IncreaseStatsByEmoCount {
                    side: emo::ability::Side,
                    target_or_random: emo::ability::TargetOrRandom,
                    count_condition: emo::ability::TypOptAndIsTripleOpt,
                    attack: u16,
                    health: u16,
                },
                AddBattleAbility {
                    target_or_random: emo::ability::TargetOrRandom,
                    ability: Box<emo::ability::battle::Battle>,
                },
                DamageAll {
                    side: emo::ability::Side,
                    damage: u16,
                },
            }
            impl Default for NormalAction {
                fn default() -> Self {
                    Self::SetEmo {
                        side: Default::default(),
                        base_id: Default::default(),
                    }
                }
            }

            #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
            #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
            #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
            pub enum AsAllyAction {
                TriggerRetireActions,
            }
            impl Default for AsAllyAction {
                fn default() -> Self {
                    Self::TriggerRetireActions
                }
            }
        }

        #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
        #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
        #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
        pub enum TargetOrRandom {
            Target(emo::ability::Target),
            Random {
                typ_and_triple: emo::ability::TypOptAndIsTripleOpt,
                count: u8,
            },
        }
        impl Default for TargetOrRandom {
            fn default() -> Self {
                Self::Target(Default::default())
            }
        }

        #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
        #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
        #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
        pub enum Target {
            Oneself,
            Others {
                destination: emo::ability::Destination,
                typ_and_triple: emo::ability::TypOptAndIsTripleOpt,
            },
        }
        impl Default for Target {
            fn default() -> Self {
                Self::Oneself
            }
        }

        #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
        #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
        #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
        pub enum Destination {
            Left,
            Right,
            All,
        }
        impl Default for Destination {
            fn default() -> Self {
                Self::Left
            }
        }

        #[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
        #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
        #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
        pub struct TypOptAndIsTripleOpt {
            pub typ_opt: Option<emo::Typ>,
            pub is_triple_opt: Option<bool>,
        }

        #[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]
        #[cfg_attr(feature = "contract", derive(PackedLayout, SpreadLayoutOneStorageCell))]
        #[cfg_attr(feature = "contract-std", derive(TypeInfo, StorageLayout))]
        pub enum Side {
            Ally,
            Rival,
        }
        impl Default for Side {
            fn default() -> Self {
                Self::Ally
            }
        }
    }
}
