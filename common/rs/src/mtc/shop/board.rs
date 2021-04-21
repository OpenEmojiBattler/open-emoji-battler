use crate::{
    codec_types::*,
    mtc::utils::{
        double_attack_and_health_if, is_matched_triple, is_matched_typ_and_triple,
        BOARD_EMO_MAX_COUNT,
    },
};
use anyhow::{bail, ensure, Result};
use rand::seq::SliceRandom;
use rand::SeedableRng;
use rand_pcg::Pcg64Mcg;
use sp_std::prelude::*;

const EMO_TRIPLE_REWARD_COIN: u8 = 5;
const EMO_SELL_COIN: u8 = 1;

// return coin
pub fn start_shop(
    board: &mut mtc::Board,
    logs: &mut mtc::shop::BoardLogs,
    seed: u64,
    emo_bases: &emo::Bases,
) -> Result<u8> {
    let mut rng = Pcg64Mcg::seed_from_u64(seed.reverse_bits());

    let mut gotten_coin = 0;

    for (action_emo_index, ability) in board.get_board_pre_abilities().into_iter() {
        call_pre_ability(
            board,
            &mut gotten_coin,
            &mut rng,
            logs,
            ability,
            action_emo_index,
            emo_bases,
        )?;
    }

    Ok(gotten_coin)
}

// return coin
pub fn sell_emo(
    board: &mut mtc::Board,
    logs: &mut mtc::shop::BoardLogs,
    emo_index: u8,
    emo_bases: &emo::Bases,
) -> Result<u8> {
    ensure!(emo_index < board.count_emos(), "invalid index for sell");

    logs.add(&|| mtc::shop::BoardLog::Remove { index: emo_index });

    let sold = board.remove_emo(emo_index);

    let mut gotten_coin = EMO_SELL_COIN;

    for ability in sold.get_peri_abilities().into_iter() {
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
                emo_index,
                Some(&sold),
                emo_bases,
            )?;
        }
    }

    Ok(gotten_coin)
}

// return coin
pub fn move_emo(
    board: &mut mtc::Board,
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
    board: &mut mtc::Board,
    logs: &mut mtc::shop::BoardLogs,
    mtc_emo_ids: &[u16],
    base_id: u16,
    is_triple: bool,
    emo_index: u8,
    emo_bases: &emo::Bases,
) -> Result<u8> {
    let board_emo =
        mtc::BoardEmo::new_with_base(mtc_emo_ids.to_vec(), emo_bases.find(base_id)?, is_triple);
    add_emo_with_board_emo(board, logs, board_emo, emo_index, emo_bases)
}

fn add_emo_with_board_emo(
    board: &mut mtc::Board,
    logs: &mut mtc::shop::BoardLogs,
    new_board_emo: mtc::BoardEmo,
    emo_index: u8,
    emo_bases: &emo::Bases,
) -> Result<u8> {
    let len = board.count_emos();

    ensure!(len < BOARD_EMO_MAX_COUNT, "board max capacity");
    ensure!(len >= emo_index, "Invalid emo_index");

    let mut gotten_coin = 0;

    let is_new_emo_triple = new_board_emo.attributes.is_triple;

    logs.add(&|| mtc::shop::BoardLog::Add {
        index: emo_index,
        board_emo: new_board_emo.clone(),
    });
    board.insert_emo(emo_index, new_board_emo);

    call_emo_addition_abilities(board, &mut gotten_coin, logs, emo_index, emo_bases)?;

    if !is_new_emo_triple {
        process_triple(board, &mut gotten_coin, logs, emo_index, emo_bases)?;
    }

    Ok(gotten_coin)
}

fn call_emo_addition_abilities(
    board: &mut mtc::Board,
    gotten_coin: &mut u8,
    logs: &mut mtc::shop::BoardLogs,
    new_emo_index: u8,
    emo_bases: &emo::Bases,
) -> Result<()> {
    let new_emo = board.get_emo(new_emo_index)?;
    let is_new_emo_triple = new_emo.attributes.is_triple;
    let new_emo_typ = &emo_bases.find(new_emo.base_id)?.typ;

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
                new_emo_index,
                None,
                emo_bases,
            )?;
        }
    }

    for (ability_emo_index, ability) in board.get_board_peri_abilities().into_iter() {
        if ability_emo_index == new_emo_index {
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
                        ability_emo_index,
                        new_emo_index,
                        None,
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
                        ability_emo_index as u8,
                        None,
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
    board: &mut mtc::Board,
    gotten_coin: &mut u8,
    logs: &mut mtc::shop::BoardLogs,
    action: emo::ability::shop::PeriAsAllyAction,
    oneself_emo_index: u8,
    ally_emo_index: u8,
    removed_ally_emo: Option<&mtc::BoardEmo>,
    emo_bases: &emo::Bases,
) -> Result<()> {
    let is_oneself_emo_triple = board.get_emo(oneself_emo_index)?.attributes.is_triple;

    match action {
        emo::ability::shop::PeriAsAllyAction::OneselfTripleNormal(normal_action) => {
            call_ability_action(
                board,
                gotten_coin,
                logs,
                normal_action,
                ally_emo_index,
                removed_ally_emo,
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
                    ally_emo_index,
                    removed_ally_emo,
                    is_oneself_emo_triple,
                    emo_bases,
                )?;
            }
        },
    }
    Ok(())
}

fn trigger_set_actions(
    board: &mut mtc::Board,
    gotten_coin: &mut u8,
    logs: &mut mtc::shop::BoardLogs,
    ally_emo_index: u8,
    removed_ally_emo: Option<&mtc::BoardEmo>,
    is_oneself_emo_triple: bool,
    emo_bases: &emo::Bases,
) -> Result<()> {
    let ally_emo = if let Some(e) = removed_ally_emo {
        e
    } else {
        board.get_emo(ally_emo_index)?
    };

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
                    ally_emo_index,
                    removed_ally_emo,
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
    board: &mut mtc::Board,
    gotten_coin: &mut u8,
    logs: &mut mtc::shop::BoardLogs,
    action: emo::ability::shop::NormalAction,
    action_emo_index: u8,
    removed_action_emo: Option<&mtc::BoardEmo>,
    emo_bases: &emo::Bases,
) -> Result<()> {
    let is_triple_action = if let Some(e) = removed_action_emo {
        e.attributes.is_triple
    } else {
        board.get_emo(action_emo_index)?.attributes.is_triple
    };

    call_ability_action(
        board,
        gotten_coin,
        logs,
        action,
        action_emo_index,
        removed_action_emo,
        is_triple_action,
        emo_bases,
    )
}

fn call_ability_action(
    board: &mut mtc::Board,
    gotten_coin: &mut u8,
    logs: &mut mtc::shop::BoardLogs,
    action: emo::ability::shop::NormalAction,
    action_emo_index: u8,
    removed_action_emo: Option<&mtc::BoardEmo>,
    is_triple_action: bool,
    emo_bases: &emo::Bases,
) -> Result<()> {
    let (is_action_emo_removed, action_emo) = if let Some(e) = removed_action_emo {
        (true, e)
    } else {
        (false, board.get_emo(action_emo_index)?)
    };

    match action {
        emo::ability::shop::NormalAction::SetEmo { base_id } => {
            set_emo(
                board,
                gotten_coin,
                logs,
                action_emo_index,
                is_triple_action,
                is_action_emo_removed,
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
                action_emo_index,
                is_triple_action,
                is_action_emo_removed,
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
                action_emo_index,
                is_triple_action,
                is_action_emo_removed,
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
            let base_id = action_emo.base_id;
            increase_stats_by_grade(
                board,
                logs,
                action_emo_index,
                is_triple_action,
                is_action_emo_removed,
                emo_bases,
                base_id,
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
                action_emo_index,
                is_triple_action,
                is_action_emo_removed,
                emo_bases,
                target,
                count_condition,
                attack,
                health,
            )?;
        }
        emo::ability::shop::NormalAction::AddAbility { target, ability } => {
            add_ability(
                board,
                logs,
                action_emo_index,
                is_action_emo_removed,
                emo_bases,
                target,
                *ability,
            )?;
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
                action_emo_index,
                is_action_emo_removed,
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
    board: &mut mtc::Board,
    gotten_coin: &mut u8,
    logs: &mut mtc::shop::BoardLogs,
    action_emo_index: u8,
    is_triple_action: bool,
    is_action_emo_removed: bool,
    emo_bases: &emo::Bases,
    base_id: u16,
) -> Result<()> {
    if board.count_emos() < BOARD_EMO_MAX_COUNT {
        let index = if is_action_emo_removed {
            action_emo_index
        } else {
            action_emo_index + 1
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
    board: &mut mtc::Board,
    logs: &mut mtc::shop::BoardLogs,
    action_emo_index: u8,
    is_triple_action: bool,
    is_action_emo_removed: bool,
    emo_bases: &emo::Bases,
    target: emo::ability::Target,
    attack: u16,
    health: u16,
) -> Result<()> {
    let (attack, health) = double_attack_and_health_if(is_triple_action, attack, health);
    add_attack_and_health_to_emos(
        board,
        logs,
        action_emo_index,
        is_action_emo_removed,
        target,
        attack,
        health,
        emo_bases,
    )
}

fn increase_stats_of_adjacent_menagerie(
    board: &mut mtc::Board,
    logs: &mut mtc::shop::BoardLogs,
    action_emo_index: u8,
    is_triple_action: bool,
    is_action_emo_removed: bool,
    emo_bases: &emo::Bases,
    attack: u16,
    health: u16,
) -> Result<()> {
    let (attack, health) = double_attack_and_health_if(is_triple_action, attack, health);

    let left_typ_opt = if let Some((e, i)) = get_left_emo(board, action_emo_index)? {
        add_attack_and_health_to_emo(e, logs, i, attack, health);
        Some(&emo_bases.find(e.base_id)?.typ)
    } else {
        None
    };

    if let Some((e, i)) = get_right_emo(board, action_emo_index, is_action_emo_removed) {
        if let Some(left_typ) = left_typ_opt {
            let right_typ = &emo_bases.find(e.base_id)?.typ;
            if left_typ != right_typ {
                add_attack_and_health_to_emo(e, logs, i, attack, health);
            }
        } else {
            add_attack_and_health_to_emo(e, logs, i, attack, health);
        }
    }

    Ok(())
}

fn increase_stats_by_grade(
    board: &mut mtc::Board,
    logs: &mut mtc::shop::BoardLogs,
    action_emo_index: u8,
    is_triple_action: bool,
    is_action_emo_removed: bool,
    emo_bases: &emo::Bases,
    base_id: u16,
    target: emo::ability::Target,
    attack: u16,
    health: u16,
) -> Result<()> {
    let (mut attack, mut health) = double_attack_and_health_if(is_triple_action, attack, health);
    let grade: u16 = emo_bases.find(base_id)?.grade.into();
    attack = attack.saturating_mul(grade);
    health = health.saturating_mul(grade);

    add_attack_and_health_to_emos(
        board,
        logs,
        action_emo_index,
        is_action_emo_removed,
        target,
        attack,
        health,
        emo_bases,
    )
}

fn increase_stats_by_emo_count(
    board: &mut mtc::Board,
    logs: &mut mtc::shop::BoardLogs,
    action_emo_index: u8,
    is_triple_action: bool,
    is_action_emo_removed: bool,
    emo_bases: &emo::Bases,
    target: emo::ability::Target,
    count_condition: emo::ability::TypOptAndIsTripleOpt,
    attack: u16,
    health: u16,
) -> Result<()> {
    let (mut attack, mut health) = double_attack_and_health_if(is_triple_action, attack, health);
    let count: u16 = count_emos_by_typ_and_triple(
        &board,
        action_emo_index,
        is_action_emo_removed,
        &count_condition,
        emo_bases,
    )?
    .into();
    attack = attack.saturating_mul(count);
    health = health.saturating_mul(count);

    add_attack_and_health_to_emos(
        board,
        logs,
        action_emo_index,
        is_action_emo_removed,
        target,
        attack,
        health,
        emo_bases,
    )
}

fn add_ability(
    board: &mut mtc::Board,
    logs: &mut mtc::shop::BoardLogs,
    emo_index: u8,
    is_emo_removed: bool,
    emo_bases: &emo::Bases,
    target: emo::ability::Target,
    ability: emo::ability::Ability,
) -> Result<()> {
    let is_special = matches!(
        ability,
        emo::ability::Ability::Battle(emo::ability::battle::Battle::Special(_))
    );

    for (board_emo, index) in
        get_emos_by_target(board, emo_index, is_emo_removed, target, emo_bases)?.into_iter()
    {
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
    board: &mut mtc::Board,
    action_emo_index: u8,
    is_action_emo_removed: bool,
    emo_bases: &emo::Bases,
    gotten_coin: &mut u8,
    is_triple_action: bool,
    count_condition: emo::ability::TypOptAndIsTripleOpt,
    divisor: u8,
) -> Result<()> {
    let count = count_emos_by_typ_and_triple(
        &board,
        action_emo_index,
        is_action_emo_removed,
        &count_condition,
        emo_bases,
    )?;
    let base = count / divisor;
    *gotten_coin = gotten_coin.saturating_add(if is_triple_action {
        base.saturating_mul(2)
    } else {
        base
    });

    Ok(())
}

fn call_pre_ability(
    board: &mut mtc::Board,
    gotten_coin: &mut u8,
    rng: &mut Pcg64Mcg,
    logs: &mut mtc::shop::BoardLogs,
    action: emo::ability::shop::Pre,
    action_emo_index: u8,
    emo_bases: &emo::Bases,
) -> Result<()> {
    match action {
        emo::ability::shop::Pre::Normal(normal_action) => {
            call_ability_action_as_oneself(
                board,
                gotten_coin,
                logs,
                normal_action,
                action_emo_index,
                None,
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
                    action_emo_index,
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
    board: &mut mtc::Board,
    rng: &mut Pcg64Mcg,
    logs: &mut mtc::shop::BoardLogs,
    action_emo_index: u8,
    emo_bases: &emo::Bases,
    typ_count: u8,
    attack: u16,
    health: u16,
) -> Result<()> {
    let mut emo_indexes = board.emo_indexes();
    emo_indexes.shuffle(rng);

    let (attack, health) = double_attack_and_health_if(
        board.get_emo(action_emo_index)?.attributes.is_triple,
        attack,
        health,
    );

    let mut typs = vec![];
    for candidate_emo_index in emo_indexes.into_iter() {
        if candidate_emo_index == action_emo_index {
            continue;
        }

        let emo = board.get_emo_mut(candidate_emo_index)?;

        let typ = emo_bases.find(emo.base_id)?.typ.clone();
        if typs.contains(&typ) {
            continue;
        }
        typs.push(typ);

        add_attack_and_health_to_emo(emo, logs, candidate_emo_index, attack, health);

        if typs.len() >= typ_count.into() {
            break;
        }
    }

    Ok(())
}

fn is_matched_typ_and_triple_board_emo(
    typ_and_triple: &emo::ability::TypOptAndIsTripleOpt,
    board_emo: &mtc::BoardEmo,
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
    board: &mtc::Board,
    emo_index: u8,
    is_emo_removed: bool,
    typ_and_triple: &emo::ability::TypOptAndIsTripleOpt,
    emo_bases: &emo::Bases,
) -> Result<u8> {
    let mut count = 0u8;
    for (e, i) in board.emos_with_indexes().into_iter() {
        if !is_emo_removed && i == emo_index {
            continue;
        }
        if !is_matched_typ_and_triple_board_emo(typ_and_triple, e, emo_bases)? {
            continue;
        }
        count += 1;
    }
    Ok(count)
}

fn get_emos_by_target<'a>(
    board: &'a mut mtc::Board,
    emo_index: u8,
    is_emo_removed: bool,
    target: emo::ability::Target,
    emo_bases: &emo::Bases,
) -> Result<Vec<(&'a mut mtc::BoardEmo, u8)>> {
    Ok(match target {
        emo::ability::Target::Oneself => {
            if is_emo_removed {
                vec![]
            } else {
                vec![(board.get_emo_mut(emo_index)?, emo_index)]
            }
        }
        emo::ability::Target::Others {
            destination,
            typ_and_triple,
        } => get_emos_by_target_others(
            board,
            emo_index,
            is_emo_removed,
            destination,
            typ_and_triple,
            emo_bases,
        )?,
    })
}

fn get_emos_by_target_others<'a>(
    board: &'a mut mtc::Board,
    emo_index: u8,
    is_emo_removed: bool,
    destination: emo::ability::Destination,
    typ_and_triple: emo::ability::TypOptAndIsTripleOpt,
    emo_bases: &emo::Bases,
) -> Result<Vec<(&'a mut mtc::BoardEmo, u8)>> {
    let emos_with_index = match destination {
        emo::ability::Destination::Right => {
            if let Some(t) = get_right_emo(board, emo_index, is_emo_removed) {
                vec![t]
            } else {
                vec![]
            }
        }
        emo::ability::Destination::Left => {
            if let Some(t) = get_left_emo(board, emo_index)? {
                vec![t]
            } else {
                vec![]
            }
        }
        emo::ability::Destination::All => board
            .0
            .iter_mut()
            .zip(0u8..)
            .filter(|(_, i)| is_emo_removed || *i != emo_index)
            .collect(),
    };

    let mut typ_filtered_emos_with_index = vec![];
    for (e, i) in emos_with_index.into_iter() {
        if is_matched_typ_and_triple_board_emo(&typ_and_triple, e, emo_bases)? {
            typ_filtered_emos_with_index.push((e, i));
        }
    }

    Ok(typ_filtered_emos_with_index)
}

fn get_right_emo(
    board: &mut mtc::Board,
    origin_index: u8,
    is_removed: bool,
) -> Option<(&mut mtc::BoardEmo, u8)> {
    let target_index = if is_removed {
        origin_index
    } else {
        origin_index + 1
    } as usize;
    if let Some(e) = board.0.get_mut(target_index) {
        Some((e, target_index as u8))
    } else {
        None
    }
}

fn get_left_emo(
    board: &mut mtc::Board,
    origin_index: u8,
) -> Result<Option<(&mut mtc::BoardEmo, u8)>> {
    Ok(if let Some(target_index) = origin_index.checked_sub(1) {
        let board_emo = board.get_emo_mut(target_index)?;
        Some((board_emo, target_index))
    } else {
        None
    })
}

fn add_attack_and_health_to_emos(
    board: &mut mtc::Board,
    logs: &mut mtc::shop::BoardLogs,
    emo_index: u8,
    is_emo_removed: bool,
    target: emo::ability::Target,
    attack: u16,
    health: u16,
    emo_bases: &emo::Bases,
) -> Result<()> {
    for (board_emo, index) in
        get_emos_by_target(board, emo_index, is_emo_removed, target, emo_bases)?.into_iter()
    {
        add_attack_and_health_to_emo(board_emo, logs, index, attack, health);
    }

    Ok(())
}

fn add_attack_and_health_to_emo(
    board_emo: &mut mtc::BoardEmo,
    logs: &mut mtc::shop::BoardLogs,
    board_emo_index: u8,
    attack: u16,
    health: u16,
) {
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
}

fn process_triple(
    board: &mut mtc::Board,
    gotten_coin: &mut u8,
    logs: &mut mtc::shop::BoardLogs,
    new_emo_index: u8,
    emo_bases: &emo::Bases,
) -> Result<()> {
    let target_base_id = board.get_emo(new_emo_index)?.base_id; // here!
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

fn remove_triple_emos(board: &mut mtc::Board, triple_source_indexes: &[u8]) -> Vec<mtc::BoardEmo> {
    let mut removed = Vec::<mtc::BoardEmo>::new();

    let mut indexes = triple_source_indexes.to_vec();
    indexes.sort_unstable();
    indexes.reverse();

    for &i in indexes.iter() {
        removed.push(board.remove_emo(i));
    }

    removed.reverse();

    removed
}

fn build_triple_emo(
    source_board_emos: Vec<mtc::BoardEmo>,
    target_base_id: u16,
    emo_bases: &emo::Bases,
) -> Result<mtc::BoardEmo> {
    let base = emo_bases.find(target_base_id)?;

    let (attack, health) = build_triple_emo_nums(&base, &source_board_emos);
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

    Ok(mtc::BoardEmo::new_with_attributes(
        mtc_emo_ids,
        base.id,
        attributes,
    ))
}

fn build_triple_emo_nums(base: &emo::Base, source_board_emos: &[mtc::BoardEmo]) -> (u16, u16) {
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
    source_board_emos: &[mtc::BoardEmo],
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

    fn setup_emo_bases() -> emo::Bases {
        let mut emo_base1: emo::Base = Default::default();
        emo_base1.id = 1;

        let mut emo_base2: emo::Base = Default::default();
        emo_base2.id = 2;
        emo_base2.abilities = vec![emo::ability::Ability::Shop(emo::ability::shop::Shop::Peri(
            emo::ability::shop::Peri::AsOneself {
                trigger: emo::ability::shop::PeriAsOneselfTrigger::Set,
                action: emo::ability::shop::NormalAction::SetEmo {
                    base_id: emo_base1.id,
                },
            },
        ))];
        let mut emo_bases = emo::Bases::new();
        emo_bases.add(emo_base1);
        emo_bases.add(emo_base2);

        emo_bases
    }

    #[test]
    fn test_add_emo() {
        let mut board: mtc::Board = Default::default();
        let mut logs = mtc::shop::BoardLogs::new();
        let emo_bases = setup_emo_bases();

        add_emo(&mut board, &mut logs, &[], 2, false, 0, &emo_bases).unwrap();
        add_emo(&mut board, &mut logs, &[], 2, false, 2, &emo_bases).unwrap();
        let c = add_emo(&mut board, &mut logs, &[], 2, false, 4, &emo_bases).unwrap();

        assert_eq!(c, 5);
    }
}
