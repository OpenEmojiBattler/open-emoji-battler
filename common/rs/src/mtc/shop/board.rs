use crate::{
    codec_types::*,
    error::{bail, ensure, Result},
    mtc::{
        shop::common::{ShopBoard, ShopBoardEmo},
        utils::{
            double_attack_and_health_if, is_matched_triple, is_matched_typ_and_triple,
            BOARD_EMO_MAX_COUNT,
        },
    },
};
use rand::seq::SliceRandom;
use rand::SeedableRng;
use rand_pcg::Pcg64Mcg;
use sp_std::prelude::*;

const EMO_TRIPLE_REWARD_COIN: u8 = 5;
const EMO_SELL_COIN: u8 = 1;

#[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Debug)]
enum EmoPointer {
    OnBoard {
        emo_id: u16,
    },
    Removed {
        emo: ShopBoardEmo,
        prev_emo_index: u8,
    },
}

impl EmoPointer {
    fn get_emo<'a>(&'a self, board: &'a ShopBoard) -> Result<&ShopBoardEmo> {
        match self {
            Self::OnBoard { emo_id } => board.get_emo_by_id(*emo_id),
            Self::Removed { emo, .. } => Ok(emo),
        }
    }

    fn get_emo_id(&self) -> u16 {
        match self {
            Self::OnBoard { emo_id } => *emo_id,
            Self::Removed { emo, .. } => emo.id,
        }
    }

    fn get_emo_index(&self, board: &ShopBoard) -> Result<u8> {
        match self {
            Self::OnBoard { emo_id } => board.get_emo_index_by_id(*emo_id),
            Self::Removed { prev_emo_index, .. } => Ok(*prev_emo_index),
        }
    }
}

// return coin
pub fn start_shop(
    board: &mut ShopBoard,
    logs: &mut mtc::shop::BoardLogs,
    seed: u64,
    emo_bases: &emo::Bases,
) -> Result<u8> {
    let mut rng = Pcg64Mcg::seed_from_u64(seed.reverse_bits());

    let mut gotten_coin = 0;

    for (action_emo_id, ability) in board.get_board_pre_abilities().into_iter() {
        call_pre_ability(
            board,
            &mut gotten_coin,
            &mut rng,
            logs,
            ability,
            action_emo_id,
            emo_bases,
        )?;
    }

    Ok(gotten_coin)
}

// return coin
pub fn sell_emo(
    board: &mut ShopBoard,
    logs: &mut mtc::shop::BoardLogs,
    emo_index: u8,
    emo_bases: &emo::Bases,
) -> Result<u8> {
    ensure!(emo_index < board.count_emos(), "invalid index for sell");

    logs.add(&|| mtc::shop::BoardLog::Remove { index: emo_index });

    let sold = board.remove_emo(emo_index);
    let abilities = sold.get_peri_abilities();
    let emo_pointer = EmoPointer::Removed {
        emo: sold,
        prev_emo_index: emo_index,
    };

    let mut gotten_coin = EMO_SELL_COIN;

    for ability in abilities.into_iter() {
        if let emo::ability::shop::Peri::AsOneself {
            trigger: emo::ability::shop::PeriAsOneselfTrigger::Sell,
            action,
        } = ability
        {
            call_ability_action_as_oneself(
                board,
                &mut gotten_coin,
                logs,
                action,
                &emo_pointer,
                emo_bases,
            )?;
        }
    }

    Ok(gotten_coin)
}

// return coin
pub fn move_emo(
    board: &mut ShopBoard,
    logs: &mut mtc::shop::BoardLogs,
    emo_index: u8,
    is_right: bool,
) -> Result<u8> {
    let len = board.count_emos();

    ensure!(emo_index < len, "invalid index for move");
    if emo_index == 0 && !is_right {
        bail!("move_emo: cannot move left");
    }
    if emo_index + 1 == len && is_right {
        bail!("move_emo: cannot move right");
    }

    let from_index = emo_index;
    let to_index = if is_right {
        from_index + 1
    } else {
        from_index - 1
    };

    logs.add(&|| mtc::shop::BoardLog::Move {
        from_index,
        to_index,
    });

    board.swap_emos(from_index, to_index);

    Ok(0)
}

// return coin
pub fn add_emo(
    board: &mut ShopBoard,
    logs: &mut mtc::shop::BoardLogs,
    mtc_emo_ids: &[u16],
    base_id: u16,
    is_triple: bool,
    emo_index: u8,
    emo_bases: &emo::Bases,
) -> Result<u8> {
    let board_emo =
        ShopBoardEmo::new_with_base(mtc_emo_ids.to_vec(), emo_bases.find(base_id)?, is_triple);
    add_emo_with_board_emo(board, logs, board_emo, emo_index, emo_bases)
}

fn add_emo_with_board_emo(
    board: &mut ShopBoard,
    logs: &mut mtc::shop::BoardLogs,
    new_board_emo: ShopBoardEmo,
    emo_index: u8,
    emo_bases: &emo::Bases,
) -> Result<u8> {
    let len = board.count_emos();

    ensure!(len < BOARD_EMO_MAX_COUNT, "board max capacity");
    ensure!(len >= emo_index, "Invalid emo_index");

    let mut gotten_coin = 0;

    let is_new_emo_triple = new_board_emo.attributes.is_triple;
    let new_emo_id = new_board_emo.id;

    logs.add(&|| mtc::shop::BoardLog::Add {
        index: emo_index,
        board_emo: new_board_emo.clone_as_board_emo(),
    });
    board.insert_emo(emo_index, new_board_emo);

    call_emo_addition_abilities(board, &mut gotten_coin, logs, new_emo_id, emo_bases)?;

    if !is_new_emo_triple {
        process_triple(board, &mut gotten_coin, logs, new_emo_id, emo_bases)?;
    }

    Ok(gotten_coin)
}

fn call_emo_addition_abilities(
    board: &mut ShopBoard,
    gotten_coin: &mut u8,
    logs: &mut mtc::shop::BoardLogs,
    new_emo_id: u16,
    emo_bases: &emo::Bases,
) -> Result<()> {
    let new_emo = board.get_emo_by_id(new_emo_id)?;
    let is_new_emo_triple = new_emo.attributes.is_triple;
    let new_emo_typ = &emo_bases.find(new_emo.base_id)?.typ;
    let new_emo_pointer = EmoPointer::OnBoard { emo_id: new_emo_id };

    for ability in new_emo.get_peri_abilities().into_iter() {
        if let emo::ability::shop::Peri::AsOneself {
            trigger: emo::ability::shop::PeriAsOneselfTrigger::Set,
            action,
        } = ability
        {
            call_ability_action_as_oneself(
                board,
                gotten_coin,
                logs,
                action,
                &new_emo_pointer,
                emo_bases,
            )?;
        }
    }

    for (ability_emo_id, ability) in board.get_board_peri_abilities().into_iter() {
        if ability_emo_id == new_emo_id {
            continue;
        }
        match ability {
            emo::ability::shop::Peri::AsAlly {
                trigger: emo::ability::shop::PeriAsAllyTrigger::AllySet { typ_and_triple },
                action,
            } => {
                if is_matched_typ_and_triple(&typ_and_triple, new_emo_typ, is_new_emo_triple) {
                    call_ability_action_as_ally(
                        board,
                        gotten_coin,
                        logs,
                        action,
                        ability_emo_id,
                        &new_emo_pointer,
                        emo_bases,
                    )?;
                }
            }
            emo::ability::shop::Peri::AsOneself {
                trigger: emo::ability::shop::PeriAsOneselfTrigger::AllySet { typ_and_triple },
                action,
            } => {
                if is_matched_typ_and_triple(&typ_and_triple, new_emo_typ, is_new_emo_triple) {
                    call_ability_action_as_oneself(
                        board,
                        gotten_coin,
                        logs,
                        action,
                        &EmoPointer::OnBoard {
                            emo_id: ability_emo_id,
                        },
                        emo_bases,
                    )?;
                }
            }
            _ => {}
        }
    }

    Ok(())
}

fn call_ability_action_as_ally(
    board: &mut ShopBoard,
    gotten_coin: &mut u8,
    logs: &mut mtc::shop::BoardLogs,
    action: emo::ability::shop::PeriAsAllyAction,
    oneself_emo_id: u16,
    ally_emo_pointer: &EmoPointer,
    emo_bases: &emo::Bases,
) -> Result<()> {
    let is_oneself_emo_triple = board.get_emo_by_id(oneself_emo_id)?.attributes.is_triple;

    match action {
        emo::ability::shop::PeriAsAllyAction::OneselfTripleNormal(normal_action) => {
            call_ability_action(
                board,
                gotten_coin,
                logs,
                normal_action,
                ally_emo_pointer,
                is_oneself_emo_triple,
                emo_bases,
            )?;
        }
        emo::ability::shop::PeriAsAllyAction::Custom(as_ally_action) => match as_ally_action {
            emo::ability::shop::AsAllyAction::TriggerSetActions => {
                trigger_set_actions(
                    board,
                    gotten_coin,
                    logs,
                    ally_emo_pointer,
                    is_oneself_emo_triple,
                    emo_bases,
                )?;
            }
        },
    }
    Ok(())
}

fn trigger_set_actions(
    board: &mut ShopBoard,
    gotten_coin: &mut u8,
    logs: &mut mtc::shop::BoardLogs,
    ally_emo_pointer: &EmoPointer,
    is_oneself_emo_triple: bool,
    emo_bases: &emo::Bases,
) -> Result<()> {
    let ally_emo = ally_emo_pointer.get_emo(board)?;

    let is_ally_emo_triple = ally_emo.attributes.is_triple;

    for ability in ally_emo.get_peri_abilities().into_iter() {
        if let emo::ability::shop::Peri::AsOneself {
            trigger: emo::ability::shop::PeriAsOneselfTrigger::Set,
            action,
        } = ability
        {
            let mut f = |a| {
                call_ability_action(
                    board,
                    gotten_coin,
                    logs,
                    a,
                    ally_emo_pointer,
                    is_ally_emo_triple,
                    emo_bases,
                )
            };
            if is_oneself_emo_triple {
                f(action.clone())?;
            }
            f(action)?;
        }
    }

    Ok(())
}

fn call_ability_action_as_oneself(
    board: &mut ShopBoard,
    gotten_coin: &mut u8,
    logs: &mut mtc::shop::BoardLogs,
    action: emo::ability::shop::NormalAction,
    action_emo_pointer: &EmoPointer,
    emo_bases: &emo::Bases,
) -> Result<()> {
    let is_triple_action = action_emo_pointer.get_emo(board)?.attributes.is_triple;

    call_ability_action(
        board,
        gotten_coin,
        logs,
        action,
        action_emo_pointer,
        is_triple_action,
        emo_bases,
    )
}

fn call_ability_action(
    board: &mut ShopBoard,
    gotten_coin: &mut u8,
    logs: &mut mtc::shop::BoardLogs,
    action: emo::ability::shop::NormalAction,
    action_emo_pointer: &EmoPointer,
    is_triple_action: bool,
    emo_bases: &emo::Bases,
) -> Result<()> {
    match action {
        emo::ability::shop::NormalAction::SetEmo { base_id } => {
            set_emo(
                board,
                gotten_coin,
                logs,
                action_emo_pointer,
                is_triple_action,
                emo_bases,
                base_id,
            )?;
        }
        emo::ability::shop::NormalAction::IncreaseStats {
            target,
            attack,
            health,
        } => {
            increase_stats(
                board,
                logs,
                action_emo_pointer,
                is_triple_action,
                emo_bases,
                target,
                attack,
                health,
            )?;
        }
        emo::ability::shop::NormalAction::IncreaseStatsOfAdjacentMenagerie { attack, health } => {
            increase_stats_of_adjacent_menagerie(
                board,
                logs,
                action_emo_pointer,
                is_triple_action,
                emo_bases,
                attack,
                health,
            )?;
        }
        emo::ability::shop::NormalAction::IncreaseStatsByGrade {
            target,
            attack,
            health,
        } => {
            increase_stats_by_grade(
                board,
                logs,
                action_emo_pointer,
                is_triple_action,
                emo_bases,
                target,
                attack,
                health,
            )?;
        }
        emo::ability::shop::NormalAction::IncreaseStatsByEmoCount {
            target,
            count_condition,
            attack,
            health,
        } => {
            increase_stats_by_emo_count(
                board,
                logs,
                action_emo_pointer,
                is_triple_action,
                emo_bases,
                target,
                count_condition,
                attack,
                health,
            )?;
        }
        emo::ability::shop::NormalAction::AddAbility { target, ability } => {
            add_ability(board, logs, action_emo_pointer, emo_bases, target, *ability)?;
        }
        emo::ability::shop::NormalAction::GetCoin { coin } => {
            get_coin(gotten_coin, is_triple_action, coin);
        }
        emo::ability::shop::NormalAction::GetCoinByEmoCountDiv {
            count_condition,
            divisor,
        } => {
            get_coin_by_emo_count_div(
                board,
                action_emo_pointer,
                emo_bases,
                gotten_coin,
                is_triple_action,
                count_condition,
                divisor,
            )?;
        }
    }

    Ok(())
}

fn set_emo(
    board: &mut ShopBoard,
    gotten_coin: &mut u8,
    logs: &mut mtc::shop::BoardLogs,
    action_emo_pointer: &EmoPointer,
    is_triple_action: bool,
    emo_bases: &emo::Bases,
    base_id: u16,
) -> Result<()> {
    if board.count_emos() < BOARD_EMO_MAX_COUNT {
        let index = match action_emo_pointer {
            EmoPointer::OnBoard { emo_id } => board.get_emo_index_by_id(*emo_id)? + 1,
            EmoPointer::Removed { prev_emo_index, .. } => *prev_emo_index,
        };
        *gotten_coin = gotten_coin.saturating_add(add_emo(
            board,
            logs,
            &[],
            base_id,
            is_triple_action,
            index,
            emo_bases,
        )?);
    }

    Ok(())
}

fn increase_stats(
    board: &mut ShopBoard,
    logs: &mut mtc::shop::BoardLogs,
    action_emo_pointer: &EmoPointer,
    is_triple_action: bool,
    emo_bases: &emo::Bases,
    target: emo::ability::Target,
    attack: u16,
    health: u16,
) -> Result<()> {
    let (attack, health) = double_attack_and_health_if(is_triple_action, attack, health);
    add_attack_and_health_to_emos(
        board,
        logs,
        action_emo_pointer,
        target,
        attack,
        health,
        emo_bases,
    )
}

fn increase_stats_of_adjacent_menagerie(
    board: &mut ShopBoard,
    logs: &mut mtc::shop::BoardLogs,
    action_emo_pointer: &EmoPointer,
    is_triple_action: bool,
    emo_bases: &emo::Bases,
    attack: u16,
    health: u16,
) -> Result<()> {
    let (attack, health) = double_attack_and_health_if(is_triple_action, attack, health);

    let left_typ_opt = if let Some(i) = get_left_emo_index(action_emo_pointer.get_emo_index(board)?)
    {
        let e = board.get_emo(i)?;
        let e_base_id = e.base_id;
        add_attack_and_health_to_emo(board, e.id, logs, attack, health)?;
        Some(&emo_bases.find(e_base_id)?.typ)
    } else {
        None
    };

    if let Some(i) = get_right_emo_index(board, action_emo_pointer)? {
        let e = board.get_emo(i)?;
        if let Some(left_typ) = left_typ_opt {
            let right_typ = &emo_bases.find(e.base_id)?.typ;
            if left_typ != right_typ {
                add_attack_and_health_to_emo(board, e.id, logs, attack, health)?;
            }
        } else {
            add_attack_and_health_to_emo(board, e.id, logs, attack, health)?;
        }
    }

    Ok(())
}

fn increase_stats_by_grade(
    board: &mut ShopBoard,
    logs: &mut mtc::shop::BoardLogs,
    action_emo_pointer: &EmoPointer,
    is_triple_action: bool,
    emo_bases: &emo::Bases,
    target: emo::ability::Target,
    attack: u16,
    health: u16,
) -> Result<()> {
    let (mut attack, mut health) = double_attack_and_health_if(is_triple_action, attack, health);
    let grade: u16 = emo_bases
        .find(action_emo_pointer.get_emo(board)?.base_id)?
        .grade
        .into();
    attack = attack.saturating_mul(grade);
    health = health.saturating_mul(grade);

    add_attack_and_health_to_emos(
        board,
        logs,
        action_emo_pointer,
        target,
        attack,
        health,
        emo_bases,
    )
}

fn increase_stats_by_emo_count(
    board: &mut ShopBoard,
    logs: &mut mtc::shop::BoardLogs,
    action_emo_pointer: &EmoPointer,
    is_triple_action: bool,
    emo_bases: &emo::Bases,
    target: emo::ability::Target,
    count_condition: emo::ability::TypOptAndIsTripleOpt,
    attack: u16,
    health: u16,
) -> Result<()> {
    let (mut attack, mut health) = double_attack_and_health_if(is_triple_action, attack, health);
    let count: u16 =
        count_emos_by_typ_and_triple(board, action_emo_pointer, &count_condition, emo_bases)?
            .into();
    attack = attack.saturating_mul(count);
    health = health.saturating_mul(count);

    add_attack_and_health_to_emos(
        board,
        logs,
        action_emo_pointer,
        target,
        attack,
        health,
        emo_bases,
    )
}

fn add_ability(
    board: &mut ShopBoard,
    logs: &mut mtc::shop::BoardLogs,
    emo_pointer: &EmoPointer,
    emo_bases: &emo::Bases,
    target: emo::ability::Target,
    ability: emo::ability::Ability,
) -> Result<()> {
    let is_special = matches!(
        ability,
        emo::ability::Ability::Battle(emo::ability::battle::Battle::Special(_))
    );

    for index in get_emo_indexes_by_target(board, emo_pointer, target, emo_bases)?.into_iter() {
        let board_emo = board.get_emo_mut(index)?;
        if is_special && board_emo.attributes.abilities.contains(&ability) {
            continue;
        }

        logs.add(&|| mtc::shop::BoardLog::AddAbility {
            index,
            ability: ability.clone(),
            is_target_triple: board_emo.attributes.is_triple,
        });

        board_emo.attributes.abilities.push(ability.clone());
    }

    Ok(())
}

fn get_coin(gotten_coin: &mut u8, is_triple_action: bool, coin: u8) {
    *gotten_coin = gotten_coin.saturating_add(if is_triple_action {
        coin.saturating_mul(2)
    } else {
        coin
    });
}

fn get_coin_by_emo_count_div(
    board: &mut ShopBoard,
    action_emo_pointer: &EmoPointer,
    emo_bases: &emo::Bases,
    gotten_coin: &mut u8,
    is_triple_action: bool,
    count_condition: emo::ability::TypOptAndIsTripleOpt,
    divisor: u8,
) -> Result<()> {
    let count =
        count_emos_by_typ_and_triple(board, action_emo_pointer, &count_condition, emo_bases)?;
    let base = count / divisor;
    *gotten_coin = gotten_coin.saturating_add(if is_triple_action {
        base.saturating_mul(2)
    } else {
        base
    });

    Ok(())
}

fn call_pre_ability(
    board: &mut ShopBoard,
    gotten_coin: &mut u8,
    rng: &mut Pcg64Mcg,
    logs: &mut mtc::shop::BoardLogs,
    action: emo::ability::shop::Pre,
    action_emo_id: u16,
    emo_bases: &emo::Bases,
) -> Result<()> {
    match action {
        emo::ability::shop::Pre::Normal(normal_action) => {
            call_ability_action_as_oneself(
                board,
                gotten_coin,
                logs,
                normal_action,
                &EmoPointer::OnBoard {
                    emo_id: action_emo_id,
                },
                emo_bases,
            )?;
        }
        emo::ability::shop::Pre::Random(random_action) => match random_action {
            emo::ability::shop::RandomAction::IncreaseStatsOfMenagerie {
                typ_count,
                attack,
                health,
            } => {
                increase_stats_of_menagerie(
                    board,
                    rng,
                    logs,
                    action_emo_id,
                    emo_bases,
                    typ_count,
                    attack,
                    health,
                )?;
            }
        },
    }

    Ok(())
}

fn increase_stats_of_menagerie(
    board: &mut ShopBoard,
    rng: &mut Pcg64Mcg,
    logs: &mut mtc::shop::BoardLogs,
    action_emo_id: u16,
    emo_bases: &emo::Bases,
    typ_count: u8,
    attack: u16,
    health: u16,
) -> Result<()> {
    let mut emo_ids = board.emo_ids();
    emo_ids.shuffle(rng);

    let (attack, health) = double_attack_and_health_if(
        board.get_emo_by_id(action_emo_id)?.attributes.is_triple,
        attack,
        health,
    );

    let mut typs = vec![];
    for candidate_emo_id in emo_ids.into_iter() {
        if candidate_emo_id == action_emo_id {
            continue;
        }

        let emo = board.get_emo_mut_by_id(candidate_emo_id)?;

        let typ = &emo_bases.find(emo.base_id)?.typ;
        if typs.contains(&typ) {
            continue;
        }
        typs.push(typ);

        add_attack_and_health_to_emo(board, candidate_emo_id, logs, attack, health)?;

        if typs.len() >= typ_count.into() {
            break;
        }
    }

    Ok(())
}

fn is_matched_typ_and_triple_board_emo(
    typ_and_triple: &emo::ability::TypOptAndIsTripleOpt,
    board_emo: &ShopBoardEmo,
    emo_bases: &emo::Bases,
) -> Result<bool> {
    Ok(if typ_and_triple.typ_opt.is_none() {
        is_matched_triple(typ_and_triple.is_triple_opt, board_emo.attributes.is_triple)
    } else {
        is_matched_typ_and_triple(
            typ_and_triple,
            &emo_bases.find(board_emo.base_id)?.typ,
            board_emo.attributes.is_triple,
        )
    })
}

fn count_emos_by_typ_and_triple(
    board: &ShopBoard,
    emo_pointer: &EmoPointer,
    typ_and_triple: &emo::ability::TypOptAndIsTripleOpt,
    emo_bases: &emo::Bases,
) -> Result<u8> {
    let mut count = 0u8;
    for e in board.emos().into_iter() {
        if e.id == emo_pointer.get_emo_id() {
            continue;
        }
        if !is_matched_typ_and_triple_board_emo(typ_and_triple, e, emo_bases)? {
            continue;
        }
        count += 1;
    }
    Ok(count)
}

fn get_emo_indexes_by_target(
    board: &ShopBoard,
    emo_pointer: &EmoPointer,
    target: emo::ability::Target,
    emo_bases: &emo::Bases,
) -> Result<Vec<u8>> {
    Ok(match target {
        emo::ability::Target::Oneself => {
            if let EmoPointer::OnBoard { emo_id } = emo_pointer {
                vec![board.get_emo_index_by_id(*emo_id)?]
            } else {
                vec![]
            }
        }
        emo::ability::Target::Others {
            destination,
            typ_and_triple,
        } => get_emo_indexes_by_target_others(
            board,
            emo_pointer,
            destination,
            typ_and_triple,
            emo_bases,
        )?,
    })
}

fn get_emo_indexes_by_target_others(
    board: &ShopBoard,
    emo_pointer: &EmoPointer,
    destination: emo::ability::Destination,
    typ_and_triple: emo::ability::TypOptAndIsTripleOpt,
    emo_bases: &emo::Bases,
) -> Result<Vec<u8>> {
    let emos_with_index = match destination {
        emo::ability::Destination::Right => {
            if let Some(t) = get_right_emo_index(board, emo_pointer)? {
                vec![t]
            } else {
                vec![]
            }
        }
        emo::ability::Destination::Left => {
            if let Some(t) = get_left_emo_index(emo_pointer.get_emo_index(board)?) {
                vec![t]
            } else {
                vec![]
            }
        }
        emo::ability::Destination::All => {
            let idx_opt = if let EmoPointer::OnBoard { emo_id } = emo_pointer {
                Some(board.get_emo_index_by_id(*emo_id)?)
            } else {
                None
            };
            board
                .emo_indexes()
                .into_iter()
                .filter(|i| {
                    if let Some(idx) = idx_opt {
                        *i != idx
                    } else {
                        true
                    }
                })
                .collect()
        }
    };

    let mut typ_filtered_emos_with_index = vec![];
    for i in emos_with_index.into_iter() {
        let e = board.get_emo(i)?;
        if is_matched_typ_and_triple_board_emo(&typ_and_triple, e, emo_bases)? {
            typ_filtered_emos_with_index.push(i);
        }
    }

    Ok(typ_filtered_emos_with_index)
}

fn get_right_emo_index(board: &ShopBoard, origin_emo_pointer: &EmoPointer) -> Result<Option<u8>> {
    let target_index = match origin_emo_pointer {
        EmoPointer::OnBoard { emo_id } => board.get_emo_index_by_id(*emo_id)? + 1,
        EmoPointer::Removed { prev_emo_index, .. } => *prev_emo_index,
    };
    Ok(if board.has_emo_by_index(target_index) {
        Some(target_index)
    } else {
        None
    })
}

fn get_left_emo_index(origin_index: u8) -> Option<u8> {
    origin_index.checked_sub(1)
}

fn add_attack_and_health_to_emos(
    board: &mut ShopBoard,
    logs: &mut mtc::shop::BoardLogs,
    emo_pointer: &EmoPointer,
    target: emo::ability::Target,
    attack: u16,
    health: u16,
    emo_bases: &emo::Bases,
) -> Result<()> {
    for board_emo_index in
        get_emo_indexes_by_target(board, emo_pointer, target, emo_bases)?.into_iter()
    {
        add_attack_and_health_to_emo(
            board,
            board.get_emo(board_emo_index)?.id,
            logs,
            attack,
            health,
        )?;
    }

    Ok(())
}

fn add_attack_and_health_to_emo(
    board: &mut ShopBoard,
    board_emo_id: u16,
    logs: &mut mtc::shop::BoardLogs,
    attack: u16,
    health: u16,
) -> Result<()> {
    let (board_emo, board_emo_index) = board.get_emo_mut_and_index_by_id(board_emo_id)?;
    let calculated_attack = board_emo.attributes.attack.saturating_add(attack);
    let calculated_health = board_emo.attributes.health.saturating_add(health);

    logs.add(&|| mtc::shop::BoardLog::IncreaseStats {
        index: board_emo_index,
        attack,
        health,
        calculated_attack,
        calculated_health,
    });

    board_emo.attributes.attack = calculated_attack;
    board_emo.attributes.health = calculated_health;

    Ok(())
}

fn process_triple(
    board: &mut ShopBoard,
    gotten_coin: &mut u8,
    logs: &mut mtc::shop::BoardLogs,
    new_emo_id: u16,
    emo_bases: &emo::Bases,
) -> Result<()> {
    let (target, new_emo_index) = board.get_emo_and_index_by_id(new_emo_id)?;
    let target_base_id = target.base_id;
    let same_base_not_triple_indexes = board
        .emos_with_indexes()
        .into_iter()
        .filter(|(e, _)| target_base_id == e.base_id && !e.attributes.is_triple)
        .map(|(_, i)| i)
        .collect::<Vec<_>>();

    if same_base_not_triple_indexes.len() >= 3 {
        let removed = remove_triple_emos(board, &same_base_not_triple_indexes);
        let triple_emo = build_triple_emo(removed, target_base_id, emo_bases)?;

        logs.add(&|| mtc::shop::BoardLog::Triple {
            removed_indexes: same_base_not_triple_indexes.clone(),
        });

        let triple_index = new_emo_index
            - same_base_not_triple_indexes
                .iter()
                .filter(|&&i| i < new_emo_index)
                .count() as u8;

        *gotten_coin = gotten_coin
            .saturating_add(add_emo_with_board_emo(
                board,
                logs,
                triple_emo,
                triple_index,
                emo_bases,
            )?)
            .saturating_add(EMO_TRIPLE_REWARD_COIN);
    }

    Ok(())
}

fn remove_triple_emos(
    board: &mut ShopBoard,
    sorted_triple_source_indexes: &[u8],
) -> Vec<ShopBoardEmo> {
    let mut removed = Vec::new();

    // temporary reverse it so `board` emo indexes don't change
    for &i in sorted_triple_source_indexes.iter().rev() {
        removed.push(board.remove_emo(i));
    }
    removed.reverse();

    removed
}

fn build_triple_emo(
    source_board_emos: Vec<ShopBoardEmo>,
    target_base_id: u16,
    emo_bases: &emo::Bases,
) -> Result<ShopBoardEmo> {
    let base = emo_bases.find(target_base_id)?;

    let (attack, health) = build_triple_emo_nums(base, &source_board_emos);
    let abilities = build_triple_abilities(&base.abilities, &source_board_emos);
    let mtc_emo_ids = source_board_emos
        .into_iter()
        .flat_map(|board_emo| board_emo.mtc_emo_ids)
        .collect::<Vec<u16>>();
    let attributes = emo::Attributes {
        attack,
        health,
        abilities,
        is_triple: true,
    };

    Ok(ShopBoardEmo::from_attributes(
        mtc_emo_ids,
        base.id,
        attributes,
    ))
}

fn build_triple_emo_nums(base: &emo::Base, source_board_emos: &[ShopBoardEmo]) -> (u16, u16) {
    let attack_diff = source_board_emos
        .iter()
        .map(|eb| eb.attributes.attack.saturating_sub(base.attack))
        .sum::<u16>();
    let health_diff = source_board_emos
        .iter()
        .map(|eb| eb.attributes.health.saturating_sub(base.health))
        .sum::<u16>();

    let attack = base.attack.saturating_mul(2).saturating_add(attack_diff);
    let health = base.health.saturating_mul(2).saturating_add(health_diff);

    (attack, health)
}

fn build_triple_abilities(
    base_abilities: &[emo::ability::Ability],
    source_board_emos: &[ShopBoardEmo],
) -> Vec<emo::ability::Ability> {
    let mut abilities = base_abilities.to_vec();

    let mut additional_abilities = source_board_emos
        .iter()
        .flat_map(|board_emo| {
            board_emo
                .attributes
                .abilities
                .iter()
                .filter(|a| !abilities.contains(a))
                .cloned()
                .collect::<Vec<_>>()
        })
        .collect::<Vec<_>>();

    abilities.append(&mut additional_abilities);

    abilities
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_sample_emo_bases() -> emo::Bases {
        let emo_base1 = emo::Base {
            id: 1,
            ..Default::default()
        };

        let emo_base2 = emo::Base {
            id: 2,
            abilities: vec![emo::ability::Ability::Shop(emo::ability::shop::Shop::Peri(
                emo::ability::shop::Peri::AsOneself {
                    trigger: emo::ability::shop::PeriAsOneselfTrigger::Set,
                    action: emo::ability::shop::NormalAction::SetEmo {
                        base_id: emo_base1.id,
                    },
                },
            ))],
            ..Default::default()
        };

        let emo_base3 = emo::Base {
            id: 3,
            abilities: vec![emo::ability::Ability::Shop(emo::ability::shop::Shop::Peri(
                emo::ability::shop::Peri::AsAlly {
                    trigger: emo::ability::shop::PeriAsAllyTrigger::AllySet {
                        typ_and_triple: Default::default(),
                    },
                    action: emo::ability::shop::PeriAsAllyAction::Custom(
                        emo::ability::shop::AsAllyAction::TriggerSetActions,
                    ),
                },
            ))],
            ..Default::default()
        };

        let emo_base4 = emo::Base {
            id: 4,
            abilities: vec![emo::ability::Ability::Shop(emo::ability::shop::Shop::Peri(
                emo::ability::shop::Peri::AsOneself {
                    trigger: emo::ability::shop::PeriAsOneselfTrigger::Sell,
                    action: emo::ability::shop::NormalAction::SetEmo {
                        base_id: emo_base1.id,
                    },
                },
            ))],
            ..Default::default()
        };

        let mut emo_bases = emo::Bases::new();
        emo_bases.add(emo_base1);
        emo_bases.add(emo_base2);
        emo_bases.add(emo_base3);
        emo_bases.add(emo_base4);

        emo_bases
    }

    #[test]
    fn test_add_emo() {
        let mut board: ShopBoard = Default::default();
        let mut logs = mtc::shop::BoardLogs::new();
        let emo_bases = setup_sample_emo_bases();

        add_emo(&mut board, &mut logs, &[], 2, false, 0, &emo_bases).unwrap();
        add_emo(&mut board, &mut logs, &[], 2, false, 2, &emo_bases).unwrap();
        let c = add_emo(&mut board, &mut logs, &[], 2, false, 4, &emo_bases).unwrap();

        assert_eq!(c, 10);
    }

    #[test]
    fn test_add_emo2() {
        let mut board: ShopBoard = Default::default();
        let mut logs = mtc::shop::BoardLogs::new();
        let emo_bases = setup_sample_emo_bases();

        add_emo(&mut board, &mut logs, &[], 3, false, 0, &emo_bases).unwrap();
        add_emo(&mut board, &mut logs, &[], 2, false, 1, &emo_bases).unwrap();
        let c = add_emo(&mut board, &mut logs, &[], 2, false, 4, &emo_bases).unwrap();

        assert_eq!(c, 5);
    }

    #[test]
    fn test_add_and_sell_emo() {
        let mut board: ShopBoard = Default::default();
        let mut logs = mtc::shop::BoardLogs::new();
        let emo_bases = setup_sample_emo_bases();

        add_emo(&mut board, &mut logs, &[], 1, false, 0, &emo_bases).unwrap();
        let c = sell_emo(&mut board, &mut logs, 0, &emo_bases).unwrap();

        assert_eq!(board, Default::default());
        assert_eq!(c, 1);
    }

    #[test]
    fn test_add_and_sell_emo2() {
        let mut board: ShopBoard = Default::default();
        let mut logs = mtc::shop::BoardLogs::new();
        let emo_bases = setup_sample_emo_bases();

        add_emo(&mut board, &mut logs, &[], 4, false, 0, &emo_bases).unwrap();
        let c = sell_emo(&mut board, &mut logs, 0, &emo_bases).unwrap();

        assert_eq!(board.count_emos(), 1);
        assert_eq!(c, 1);
    }

    #[test]
    fn test_remove_triple_emos() {
        fn build_shop_board_emo(id: u16) -> ShopBoardEmo {
            ShopBoardEmo {
                id,
                mtc_emo_ids: vec![],
                base_id: 0,
                attributes: Default::default(),
            }
        }

        let shop_board_emo_1 = build_shop_board_emo(1);
        let shop_board_emo_2 = build_shop_board_emo(2);
        let shop_board_emo_3 = build_shop_board_emo(3);
        let shop_board_emo_4 = build_shop_board_emo(4);

        let mut shop_board = ShopBoard(vec![
            shop_board_emo_1.clone(),
            shop_board_emo_2.clone(),
            shop_board_emo_3.clone(),
            shop_board_emo_4.clone(),
        ]);

        let removed = remove_triple_emos(&mut shop_board, &[0, 2, 3]);

        assert_eq!(shop_board, ShopBoard(vec![shop_board_emo_2]));
        assert_eq!(
            removed,
            vec![shop_board_emo_1, shop_board_emo_3, shop_board_emo_4]
        );
    }
}
