use crate::{
    codec_types::*,
    mtc::{
        battle::common::{
            is_matched_typ_and_triple_for_emo, switch_player_index, BattleBoards, BattleEmo,
        },
        utils::{double_attack_and_health_if, is_matched_typ_and_triple, BOARD_EMO_MAX_COUNT},
    },
};
use anyhow::{anyhow, bail, ensure, Result};
use rand::{seq::{IteratorRandom, SliceRandom}, Rng};
use rand_pcg::Pcg64Mcg;
use sp_std::{cmp, prelude::*};

pub fn attack(
    boards: &mut BattleBoards,
    attack_player_index: u8,
    logs: &mut mtc::battle::Logs,
    rng: &mut Pcg64Mcg,
    emo_bases: &emo::Bases,
) -> Result<()> {
    let (attack_emo_index, defense_emo_index) =
        get_attack_and_defense_emo_indexes(boards, attack_player_index, rng)?;

    logs.add(&|| mtc::battle::Log::Attack {
        attack_player_index,
        attack_emo_index,
        defense_emo_index,
    });

    attack_damage(
        boards,
        attack_player_index,
        attack_emo_index,
        defense_emo_index,
        emo_bases,
        logs,
        rng,
    )?;

    Ok(())
}

pub fn call_pre_abilities(
    boards: &mut BattleBoards,
    first_attack_player_index: u8,
    rng: &mut Pcg64Mcg,
    logs: &mut mtc::battle::Logs,
    emo_bases: &emo::Bases,
) -> Result<()> {
    let first_defense_player_index = switch_player_index(first_attack_player_index);

    for &player_index in [first_attack_player_index, first_defense_player_index].iter() {
        for (emo_index, ability) in boards.get_board_abilities(player_index)?.into_iter() {
            if let emo::ability::battle::Battle::General(
                emo::ability::battle::General::AsOneself {
                    trigger: emo::ability::battle::GeneralAsOneselfTrigger::Pre,
                    action,
                },
            ) = ability
            {
                call_ability_normal_action_as_oneself(
                    player_index,
                    emo_bases,
                    action,
                    emo_index,
                    None,
                    boards,
                    logs,
                    rng,
                )?;
            }
        }
    }

    Ok(())
}

fn remove_shield_if_exist(
    boards: &mut BattleBoards,
    player_index: u8,
    emo_index: u8,
    logs: &mut mtc::battle::Logs,
    emo_bases: &emo::Bases,
    rng: &mut Pcg64Mcg,
) -> Result<bool> {
    for (ability_index, ability) in boards
        .get_emo(player_index, emo_index)?
        .get_abilities()
        .into_iter()
    {
        if let emo::ability::battle::Battle::Special(emo::ability::battle::Special::Shield) =
            ability
        {
            remove_shield(
                boards,
                player_index,
                emo_index,
                ability_index,
                logs,
                emo_bases,
                rng,
            )?;
            return Ok(true);
        }
    }

    Ok(false)
}

fn remove_shield(
    boards: &mut BattleBoards,
    player_index: u8,
    emo_index: u8,
    shield_ability_index: u8,
    logs: &mut mtc::battle::Logs,
    emo_bases: &emo::Bases,
    rng: &mut Pcg64Mcg,
) -> Result<()> {
    let ability = boards
        .get_emo_mut(player_index, emo_index)?
        .attributes
        .abilities
        .remove(shield_ability_index as usize);

    let battle_ability = if let emo::ability::Ability::Battle(b) = ability {
        b
    } else {
        bail!("should be battle ability");
    };

    logs.add(&|| mtc::battle::Log::RemoveBattleAbility {
        player_index,
        emo_index,
        ability_index: shield_ability_index,
        ability: battle_ability.clone(),
    });

    call_shield_removed_ability(boards, player_index, emo_index, logs, emo_bases, rng)?;

    Ok(())
}

fn call_shield_removed_ability(
    boards: &mut BattleBoards,
    player_index: u8,
    shield_removed_emo_index: u8,
    logs: &mut mtc::battle::Logs,
    emo_bases: &emo::Bases,
    rng: &mut Pcg64Mcg,
) -> Result<()> {
    let shield_removed_emo = boards.get_emo(player_index, shield_removed_emo_index)?;
    let shield_removed_emo_typ = shield_removed_emo.typ.clone();
    let is_shield_removed_emo_triple = shield_removed_emo.attributes.is_triple;
    let shield_removed_emo_base_id = shield_removed_emo.base_id;

    let shield = Box::new(emo::ability::battle::Battle::Special(
        emo::ability::battle::Special::Shield,
    ));

    for (emo_index, battle_ability) in boards.get_board_abilities(player_index)?.into_iter() {
        if let emo::ability::battle::Battle::General(emo::ability::battle::General::AsOneself {
            trigger:
                emo::ability::battle::GeneralAsOneselfTrigger::AllyBattleAbilityRemoved {
                    typ_and_triple,
                    excludes_same_base,
                    ability,
                },
            action,
        }) = battle_ability
        {
            if ability != shield {
                continue;
            }
            if !is_matched_typ_and_triple(
                &typ_and_triple,
                &shield_removed_emo_typ,
                is_shield_removed_emo_triple,
            ) {
                continue;
            }
            if excludes_same_base
                && shield_removed_emo_base_id == boards.get_emo(player_index, emo_index)?.base_id
            {
                continue;
            }

            call_ability_normal_action_as_oneself(
                player_index,
                emo_bases,
                action,
                emo_index,
                None,
                boards,
                logs,
                rng,
            )?;
        }
    }

    Ok(())
}

fn attack_damage(
    boards: &mut BattleBoards,
    attack_player_index: u8,
    attack_emo_index: u8,
    defense_emo_index: u8,
    emo_bases: &emo::Bases,
    logs: &mut mtc::battle::Logs,
    rng: &mut Pcg64Mcg,
) -> Result<()> {
    let defense_player_index = switch_player_index(attack_player_index);

    let attack_emo_attack = boards
        .get_emo(attack_player_index, attack_emo_index)?
        .attributes
        .attack;
    let defense_emo_attack = boards
        .get_emo(defense_player_index, defense_emo_index)?
        .attributes
        .attack;

    damage_emo(
        attack_emo_attack,
        defense_player_index,
        defense_emo_index,
        boards,
        emo_bases,
        rng,
        logs,
    )?;

    if !boards.has_emo_at_index(attack_player_index, attack_emo_index)? {
        return Ok(());
    }

    if damage_emo(
        defense_emo_attack,
        attack_player_index,
        attack_emo_index,
        boards,
        emo_bases,
        rng,
        logs,
    )? {
        boards
            .get_emo_mut(attack_player_index, attack_emo_index)?
            .attack_and_survived_count += 1;
    }

    Ok(())
}

fn get_attack_and_defense_emo_indexes(
    boards: &mut BattleBoards,
    attack_player_index: u8,
    rng: &mut Pcg64Mcg,
) -> Result<(u8, u8)> {
    let defense_player_index = switch_player_index(attack_player_index);

    let attack_emo_index = get_attack_emo_index(boards.get_board(attack_player_index)?);

    let mut is_lowest_attack = false;
    for (_, ability) in boards
        .get_emo(attack_player_index, attack_emo_index)?
        .get_abilities()
        .into_iter()
    {
        if let emo::ability::battle::Battle::Special(
            emo::ability::battle::Special::AttackLowestAttack,
        ) = ability
        {
            is_lowest_attack = true;
            break;
        }
    }

    let defense_emo_index = get_defense_emo_index(
        boards.get_board(defense_player_index)?,
        is_lowest_attack,
        rng,
    )?;

    Ok((attack_emo_index, defense_emo_index))
}

fn get_attack_emo_index(emos: &[BattleEmo]) -> u8 {
    let mut index: u8 = 0;
    let mut min_attack_and_survived_count = emos[index as usize].attack_and_survived_count;

    for (_, i) in emos.iter().zip(0u8..).skip(1) {
        let attack_and_survived_count = emos[i as usize].attack_and_survived_count;
        if min_attack_and_survived_count > attack_and_survived_count {
            min_attack_and_survived_count = attack_and_survived_count;
            index = i;
        }
    }

    index
}

fn get_defense_emo_index(
    emos: &[BattleEmo],
    is_lowest_attack: bool,
    rng: &mut Pcg64Mcg,
) -> Result<u8> {
    if is_lowest_attack {
        return get_lowest_attack_emo_index(emos, rng);
    }

    Ok(
        if let Some(attractive_emo_index) = get_attractive_emo_index(emos, rng) {
            attractive_emo_index
        } else {
            // be carefull, `rng.gen_range(0usize, 3usize)` produces different results on
            // targets, like wasm (32) and mac (64)
            rng.gen_range(0u8, emos.len() as u8)
        },
    )
}

fn get_lowest_attack_emo_index(emos: &[BattleEmo], rng: &mut Pcg64Mcg) -> Result<u8> {
    let mut lowest_attack_emo_indexes = vec![0u8];
    let mut lowest_attack = emos
        .get(0)
        .ok_or_else(|| anyhow!("emos[0] not found"))?
        .attributes
        .attack;

    for (emo, i) in emos.iter().zip(0u8..).skip(1) {
        let attack = emo.attributes.attack;
        if lowest_attack > attack {
            lowest_attack_emo_indexes = vec![i];
            lowest_attack = attack;
        }
        if lowest_attack == attack {
            lowest_attack_emo_indexes.push(i);
        }
    }

    let index = lowest_attack_emo_indexes
        .choose(rng)
        .ok_or_else(|| anyhow!("choose none for lowest"))?;

    Ok(*index)
}

fn get_attractive_emo_index(emos: &[BattleEmo], rng: &mut Pcg64Mcg) -> Option<u8> {
    let attractive_emo_indexes = emos
        .iter()
        .zip(0u8..)
        .filter(|(e, _)| {
            let mut is_attractive = false;
            for ability in e.attributes.abilities.iter() {
                if let emo::ability::Ability::Battle(emo::ability::battle::Battle::Special(
                    emo::ability::battle::Special::Attractive,
                )) = ability
                {
                    is_attractive = true;
                    break;
                }
            }
            is_attractive
        })
        .map(|(_, i)| i)
        .collect::<Vec<u8>>();

    attractive_emo_indexes.choose(rng).copied()
}

// return if survived
fn damage_emo(
    damage: u16,
    player_index: u8,
    emo_index: u8,
    boards: &mut BattleBoards,
    emo_bases: &emo::Bases,
    rng: &mut Pcg64Mcg,
    logs: &mut mtc::battle::Logs,
) -> Result<bool> {
    let emo_shielded =
        remove_shield_if_exist(boards, player_index, emo_index, logs, emo_bases, rng)?;

    if emo_shielded || damage == 0 {
        return Ok(true);
    }

    let emo = boards.get_emo_mut(player_index, emo_index)?;

    let health = emo.attributes.health.saturating_sub(damage);

    logs.add(&|| mtc::battle::Log::Damage {
        player_index,
        emo_index,
        damage,
        health,
    });

    Ok(if health == 0 {
        retire_emo(player_index, emo_index, boards, emo_bases, rng, logs)?;
        false
    } else {
        emo.attributes.health = health;
        true
    })
}

fn call_ability_general_as_ally_action(
    player_index: u8,
    emo_bases: &emo::Bases,
    action: emo::ability::battle::GeneralAsAllyAction,
    ally_emo_index: u8,
    retired_ally_emo_opt: Option<&BattleEmo>,
    oneself_emo_index: u8,
    boards: &mut BattleBoards,
    logs: &mut mtc::battle::Logs,
    rng: &mut Pcg64Mcg,
) -> Result<()> {
    match action {
        emo::ability::battle::GeneralAsAllyAction::OneselfTripleNormal(normal_action) => {
            call_ability_normal_action(
                player_index,
                emo_bases,
                normal_action,
                ally_emo_index,
                retired_ally_emo_opt,
                boards
                    .get_emo(player_index, oneself_emo_index)?
                    .attributes
                    .is_triple,
                boards,
                logs,
                rng,
            )?;
        }
        emo::ability::battle::GeneralAsAllyAction::Custom(as_ally_action) => {
            call_ability_as_ally_action(
                player_index,
                emo_bases,
                as_ally_action,
                ally_emo_index,
                retired_ally_emo_opt,
                oneself_emo_index,
                boards,
                logs,
                rng,
            )?;
        }
    }

    Ok(())
}

fn call_ability_as_ally_action(
    player_index: u8,
    emo_bases: &emo::Bases,
    as_ally_action: emo::ability::battle::AsAllyAction,
    ally_emo_index: u8,
    retired_ally_emo_opt: Option<&BattleEmo>,
    oneself_emo_index: u8,
    boards: &mut BattleBoards,
    logs: &mut mtc::battle::Logs,
    rng: &mut Pcg64Mcg,
) -> Result<()> {
    match as_ally_action {
        emo::ability::battle::AsAllyAction::TriggerRetireActions => {
            let ally_emo = if let Some(retired_action_emo) = retired_ally_emo_opt {
                retired_action_emo
            } else {
                boards.get_emo(player_index, ally_emo_index)?
            };

            let is_oneself_emo_triple = boards
                .get_emo(player_index, oneself_emo_index)?
                .attributes
                .is_triple;

            for (_, ability) in ally_emo.get_abilities().into_iter() {
                if let emo::ability::battle::Battle::General(
                    emo::ability::battle::General::AsOneself {
                        trigger: emo::ability::battle::GeneralAsOneselfTrigger::Retire,
                        action,
                    },
                ) = ability
                {
                    let mut f = |a| {
                        call_ability_normal_action_as_oneself(
                            player_index,
                            emo_bases,
                            a,
                            ally_emo_index,
                            retired_ally_emo_opt,
                            boards,
                            logs,
                            rng,
                        )
                    };

                    if is_oneself_emo_triple {
                        f(action.clone())?;
                    }
                    f(action)?;
                }
            }
        }
    }

    Ok(())
}

fn call_ability_normal_action_as_oneself(
    player_index: u8,
    emo_bases: &emo::Bases,
    action: emo::ability::battle::NormalAction,
    action_emo_index: u8,
    retired_action_emo_opt: Option<&BattleEmo>,
    boards: &mut BattleBoards,
    logs: &mut mtc::battle::Logs,
    rng: &mut Pcg64Mcg,
) -> Result<()> {
    let is_triple_action = if let Some(retired_action_emo) = retired_action_emo_opt {
        retired_action_emo.attributes.is_triple
    } else {
        boards
            .get_emo(player_index, action_emo_index)?
            .attributes
            .is_triple
    };

    call_ability_normal_action(
        player_index,
        emo_bases,
        action,
        action_emo_index,
        retired_action_emo_opt,
        is_triple_action,
        boards,
        logs,
        rng,
    )
}

fn call_ability_normal_action(
    player_index: u8,
    emo_bases: &emo::Bases,
    action: emo::ability::battle::NormalAction,
    action_emo_index: u8,
    retired_action_emo_opt: Option<&BattleEmo>,
    is_triple_action: bool,
    boards: &mut BattleBoards,
    logs: &mut mtc::battle::Logs,
    rng: &mut Pcg64Mcg,
) -> Result<()> {
    let (is_action_emo_retired, action_emo, new_emo_index) =
        if let Some(retired_action_emo) = retired_action_emo_opt {
            (true, retired_action_emo, action_emo_index)
        } else {
            (
                false,
                boards.get_emo(player_index, action_emo_index)?,
                action_emo_index + 1,
            )
        };

    match action {
        emo::ability::battle::NormalAction::SetEmo { side, base_id } => {
            set_emo(
                player_index,
                new_emo_index,
                base_id,
                is_triple_action,
                action_emo.attack_and_survived_count,
                boards,
                logs,
                emo_bases,
                rng,
                side,
            )?;
        }
        emo::ability::battle::NormalAction::SetEmosByAttackDiv {
            side,
            base_id,
            divisor,
        } => {
            set_emos_by_attack_div(
                player_index,
                action_emo.attack_and_survived_count,
                action_emo.attributes.attack,
                is_triple_action,
                new_emo_index,
                base_id,
                divisor,
                boards,
                logs,
                emo_bases,
                rng,
                side,
            )?;
        }
        emo::ability::battle::NormalAction::IncreaseStats {
            target_or_random,
            attack,
            health,
        } => {
            increase_stats(
                player_index,
                action_emo_index,
                is_action_emo_retired,
                is_triple_action,
                boards,
                logs,
                rng,
                target_or_random,
                attack,
                health,
            )?;
        }
        emo::ability::battle::NormalAction::DecreaseStats {
            target_or_random,
            attack,
            health,
        } => {
            decrease_stats(
                player_index,
                action_emo_index,
                is_action_emo_retired,
                is_triple_action,
                boards,
                logs,
                rng,
                target_or_random,
                attack,
                health,
            )?;
        }
        emo::ability::battle::NormalAction::IncreaseStatsByEmoCount {
            side,
            target_or_random,
            count_condition,
            attack,
            health,
        } => {
            increase_stats_by_emo_count(
                player_index,
                action_emo_index,
                is_action_emo_retired,
                is_triple_action,
                boards,
                logs,
                rng,
                target_or_random,
                side,
                count_condition,
                attack,
                health,
            )?;
        }
        emo::ability::battle::NormalAction::AddBattleAbility {
            target_or_random,
            ability,
        } => {
            add_battle_ability(
                player_index,
                action_emo_index,
                is_action_emo_retired,
                is_triple_action,
                boards,
                logs,
                rng,
                target_or_random,
                *ability,
            )?;
        }
        emo::ability::battle::NormalAction::DamageAll { side, damage } => {
            damage_all(
                boards,
                player_index,
                is_triple_action,
                side,
                damage,
                emo_bases,
                logs,
                rng,
            )?;
        }
    }

    Ok(())
}

fn get_matched_emo_indexs_from_board_by_target_or_random(
    board: &[BattleEmo],
    emo_index: u8,
    target_or_random: emo::ability::TargetOrRandom,
    is_action_emo_retired: bool,
    rng: &mut Pcg64Mcg,
) -> Result<Vec<u8>> {
    let indexes = match target_or_random {
        emo::ability::TargetOrRandom::Target(t) => {
            get_matched_emo_indexs_from_board(board, emo_index, t, is_action_emo_retired)?
        }
        emo::ability::TargetOrRandom::Random {
            typ_and_triple,
            count,
        } => board
            .iter()
            .zip(0u8..)
            .filter(|(_, i)| {
                if is_action_emo_retired {
                    true
                } else {
                    *i != emo_index
                }
            })
            .filter(|(e, _)| is_matched_typ_and_triple_for_emo(&typ_and_triple, &e))
            .map(|(_, i)| i)
            .choose_multiple(rng, count.into())
    };
    Ok(indexes)
}

fn get_matched_emo_indexs_from_board(
    board: &[BattleEmo],
    emo_index: u8,
    target: emo::ability::Target,
    is_action_emo_retired: bool,
) -> Result<Vec<u8>> {
    let indexes = match target {
        emo::ability::Target::Oneself => {
            if is_action_emo_retired {
                vec![]
            } else {
                vec![emo_index]
            }
        }
        emo::ability::Target::Others {
            destination,
            typ_and_triple,
        } => {
            let emos_with_index = match destination {
                emo::ability::Destination::Right => {
                    let index = if is_action_emo_retired {
                        emo_index
                    } else if let Some(i) = emo_index.checked_add(1) {
                        i
                    } else {
                        bail!("failed checked_add");
                    };

                    if let Some(e) = board.get::<usize>(index.into()) {
                        vec![(e, index)]
                    } else {
                        vec![]
                    }
                }
                emo::ability::Destination::Left => {
                    if let Some(index) = emo_index.checked_sub(1) {
                        vec![(
                            board
                                .get::<usize>(index.into())
                                .ok_or_else(|| anyhow!("left emo not found, invalid state"))?,
                            index,
                        )]
                    } else {
                        vec![]
                    }
                }
                emo::ability::Destination::All => board
                    .iter()
                    .zip(0u8..)
                    .filter(|(_, i)| {
                        if is_action_emo_retired {
                            true
                        } else {
                            *i != emo_index
                        }
                    })
                    .collect(),
            };
            emos_with_index
                .into_iter()
                .filter(|(e, _)| is_matched_typ_and_triple_for_emo(&typ_and_triple, &e))
                .map(|(_, i)| i)
                .collect()
        }
    };

    Ok(indexes)
}

fn increase_emo_stats(
    boards: &mut BattleBoards,
    player_index: u8,
    emo_index: u8,
    attack: u16,
    health: u16,
    logs: &mut mtc::battle::Logs,
) -> Result<()> {
    if attack == 0 && health == 0 {
        return Ok(());
    }

    let emo = boards.get_emo_mut(player_index, emo_index)?;

    emo.attributes.attack = emo.attributes.attack.saturating_add(attack);
    emo.attributes.health = emo.attributes.health.saturating_add(health);

    logs.add(&|| mtc::battle::Log::IncreaseStats {
        player_index,
        emo_index,
        attack,
        health,
        calculated_attack: emo.attributes.attack,
        calculated_health: emo.attributes.health,
    });

    Ok(())
}

fn decrease_emo_stats(
    boards: &mut BattleBoards,
    player_index: u8,
    emo_index: u8,
    attack: u16,
    health: u16,
    logs: &mut mtc::battle::Logs,
) -> Result<()> {
    if attack == 0 && health == 0 {
        return Ok(());
    }

    let emo = boards.get_emo_mut(player_index, emo_index)?;

    emo.attributes.attack = cmp::max(emo.attributes.attack.saturating_sub(attack), 1);
    emo.attributes.health = cmp::max(emo.attributes.health.saturating_sub(health), 1);

    logs.add(&|| mtc::battle::Log::DecreaseStats {
        player_index,
        emo_index,
        attack,
        health,
        calculated_attack: emo.attributes.attack,
        calculated_health: emo.attributes.health,
    });

    Ok(())
}

fn add_ability_to_emo(
    emo: &mut BattleEmo,
    battle_ability: emo::ability::battle::Battle,
    player_index: u8,
    emo_index: u8,
    logs: &mut mtc::battle::Logs,
) {
    if emo.attributes.abilities.len() >= u8::MAX.into() {
        return;
    }

    let ability = emo::ability::Ability::Battle(battle_ability.clone());

    if let emo::ability::battle::Battle::Special(_) = &battle_ability {
        if emo.attributes.abilities.contains(&ability) {
            return;
        }
    }

    emo.attributes.abilities.push(ability);

    logs.add(&|| mtc::battle::Log::AddBattleAbility {
        player_index,
        emo_index,
        ability: battle_ability.clone(),
        is_emo_triple: emo.attributes.is_triple,
    });
}

fn retire_emo(
    player_index: u8,
    emo_index: u8,
    boards: &mut BattleBoards,
    emo_bases: &emo::Bases,
    rng: &mut Pcg64Mcg,
    logs: &mut mtc::battle::Logs,
) -> Result<()> {
    let removed_emo = boards
        .get_board_mut(player_index)?
        .remove(emo_index as usize);

    logs.add(&|| mtc::battle::Log::Remove {
        player_index,
        emo_index,
    });

    call_emo_retire_player_abilities(
        player_index,
        emo_index,
        &removed_emo,
        boards,
        emo_bases,
        rng,
        logs,
    )?;

    call_emo_retire_rival_abilities(player_index, &removed_emo, boards, emo_bases, rng, logs)?;

    Ok(())
}

fn call_emo_retire_player_abilities(
    player_index: u8,
    retired_emo_index: u8,
    retired_emo: &BattleEmo,
    boards: &mut BattleBoards,
    emo_bases: &emo::Bases,
    rng: &mut Pcg64Mcg,
    logs: &mut mtc::battle::Logs,
) -> Result<()> {
    for (_, ability) in retired_emo.get_abilities().into_iter() {
        if let emo::ability::battle::Battle::General(emo::ability::battle::General::AsOneself {
            trigger: emo::ability::battle::GeneralAsOneselfTrigger::Retire,
            action,
        }) = ability
        {
            call_ability_normal_action_as_oneself(
                player_index,
                emo_bases,
                action,
                retired_emo_index,
                Some(&retired_emo),
                boards,
                logs,
                rng,
            )?;
        }
    }

    let board_abilities = boards.get_board_abilities(player_index)?;

    for (ability_emo_index, ability) in board_abilities.iter() {
        if let emo::ability::battle::Battle::General(emo::ability::battle::General::AsAlly {
            trigger: emo::ability::battle::GeneralAsAllyTrigger::AllyRetire { typ_and_triple },
            action,
        }) = ability
        {
            if is_matched_typ_and_triple_for_emo(typ_and_triple, &retired_emo) {
                call_ability_general_as_ally_action(
                    player_index,
                    emo_bases,
                    action.clone(),
                    retired_emo_index,
                    Some(&retired_emo),
                    *ability_emo_index,
                    boards,
                    logs,
                    rng,
                )?;
            }
        }
    }

    for (ability_emo_index, ability) in board_abilities.iter() {
        if let emo::ability::battle::Battle::General(emo::ability::battle::General::AsOneself {
            trigger: emo::ability::battle::GeneralAsOneselfTrigger::AllyRetire { typ_and_triple },
            action,
        }) = ability
        {
            if is_matched_typ_and_triple_for_emo(typ_and_triple, &retired_emo) {
                call_ability_normal_action_as_oneself(
                    player_index,
                    emo_bases,
                    action.clone(),
                    *ability_emo_index,
                    None,
                    boards,
                    logs,
                    rng,
                )?;
            }
        }
    }

    Ok(())
}

fn call_emo_retire_rival_abilities(
    player_index: u8,
    retired_emo: &BattleEmo,
    boards: &mut BattleBoards,
    emo_bases: &emo::Bases,
    rng: &mut Pcg64Mcg,
    logs: &mut mtc::battle::Logs,
) -> Result<()> {
    let rival_index = switch_player_index(player_index);
    for (ability_emo_index, ability) in boards.get_board_abilities(rival_index)?.into_iter() {
        if let emo::ability::battle::Battle::General(emo::ability::battle::General::AsOneself {
            trigger: emo::ability::battle::GeneralAsOneselfTrigger::RivalRetire { typ_and_triple },
            action,
        }) = ability
        {
            if is_matched_typ_and_triple_for_emo(&typ_and_triple, &retired_emo) {
                call_ability_normal_action_as_oneself(
                    rival_index,
                    emo_bases,
                    action,
                    ability_emo_index,
                    None,
                    boards,
                    logs,
                    rng,
                )?;
            }
        }
    }

    Ok(())
}

fn set_emo(
    player_index: u8,
    emo_index: u8,
    base_id: u16,
    is_triple: bool,
    attack_and_survived_count: u8,
    boards: &mut BattleBoards,
    logs: &mut mtc::battle::Logs,
    emo_bases: &emo::Bases,
    rng: &mut Pcg64Mcg,
    side: emo::ability::Side,
) -> Result<()> {
    let emo_base = emo_bases.find(base_id)?;
    let battle_emo = BattleEmo::new_with_base(emo_base, is_triple);

    match side {
        emo::ability::Side::Ally => {
            set_emo_ally(
                player_index,
                emo_index,
                battle_emo,
                attack_and_survived_count,
                boards,
                logs,
                emo_bases,
                rng,
            )?;
        }
        emo::ability::Side::Rival => {
            set_emo_rival(player_index, battle_emo, boards, logs, emo_bases, rng)?;
        }
    }
    Ok(())
}

fn set_emos_by_attack_div(
    player_index: u8,
    action_emo_attack_and_survived_count: u8,
    action_emo_attack: u16,
    is_triple_action: bool,
    new_emo_index: u8,
    base_id: u16,
    divisor: u8,
    boards: &mut BattleBoards,
    logs: &mut mtc::battle::Logs,
    emo_bases: &emo::Bases,
    rng: &mut Pcg64Mcg,
    side: emo::ability::Side,
) -> Result<()> {
    let c = action_emo_attack_and_survived_count;
    for _ in 0..cmp::min(
        action_emo_attack / divisor as u16,
        BOARD_EMO_MAX_COUNT as u16,
    ) {
        set_emo(
            player_index,
            new_emo_index,
            base_id,
            is_triple_action,
            c,
            boards,
            logs,
            emo_bases,
            rng,
            side.clone(),
        )?;
    }
    Ok(())
}

fn increase_stats(
    player_index: u8,
    action_emo_index: u8,
    is_action_emo_retired: bool,
    is_triple_action: bool,
    boards: &mut BattleBoards,
    logs: &mut mtc::battle::Logs,
    rng: &mut Pcg64Mcg,
    target_or_random: emo::ability::TargetOrRandom,
    attack: u16,
    health: u16,
) -> Result<()> {
    let (attack, health) = double_attack_and_health_if(is_triple_action, attack, health);
    for emo_index in get_matched_emo_indexs_from_board_by_target_or_random(
        boards.get_board(player_index)?,
        action_emo_index,
        target_or_random,
        is_action_emo_retired,
        rng,
    )?
    .into_iter()
    {
        increase_emo_stats(boards, player_index, emo_index, attack, health, logs)?;
    }
    Ok(())
}

fn decrease_stats(
    player_index: u8,
    action_emo_index: u8,
    is_action_emo_retired: bool,
    is_triple_action: bool,
    boards: &mut BattleBoards,
    logs: &mut mtc::battle::Logs,
    rng: &mut Pcg64Mcg,
    target_or_random: emo::ability::TargetOrRandom,
    attack: u16,
    health: u16,
) -> Result<()> {
    let (attack, health) = double_attack_and_health_if(is_triple_action, attack, health);
    for emo_index in get_matched_emo_indexs_from_board_by_target_or_random(
        boards.get_board(player_index)?,
        action_emo_index,
        target_or_random,
        is_action_emo_retired,
        rng,
    )?
    .into_iter()
    {
        decrease_emo_stats(boards, player_index, emo_index, attack, health, logs)?;
    }
    Ok(())
}

fn increase_stats_by_emo_count(
    player_index: u8,
    action_emo_index: u8,
    is_action_emo_retired: bool,
    is_triple_action: bool,
    boards: &mut BattleBoards,
    logs: &mut mtc::battle::Logs,
    rng: &mut Pcg64Mcg,
    target_or_random: emo::ability::TargetOrRandom,
    side: emo::ability::Side,
    count_condition: emo::ability::TypOptAndIsTripleOpt,
    attack: u16,
    health: u16,
) -> Result<()> {
    let count = match side {
        emo::ability::Side::Ally => boards
            .get_board(player_index)?
            .iter()
            .zip(0u8..)
            .filter(|&(emo, emo_index)| {
                emo_index != action_emo_index
                    && is_matched_typ_and_triple_for_emo(&count_condition, &emo)
            })
            .count(),
        emo::ability::Side::Rival => boards
            .get_board(switch_player_index(player_index))?
            .iter()
            .filter(|emo| is_matched_typ_and_triple_for_emo(&count_condition, &emo))
            .count(),
    };

    let muled_attack = attack.saturating_mul(count as u16);
    let muled_health = health.saturating_mul(count as u16);

    increase_stats(
        player_index,
        action_emo_index,
        is_action_emo_retired,
        is_triple_action,
        boards,
        logs,
        rng,
        target_or_random,
        muled_attack,
        muled_health,
    )
}

fn add_battle_ability(
    player_index: u8,
    action_emo_index: u8,
    is_action_emo_retired: bool,
    is_triple_action: bool,
    boards: &mut BattleBoards,
    logs: &mut mtc::battle::Logs,
    rng: &mut Pcg64Mcg,
    target_or_random: emo::ability::TargetOrRandom,
    ability: emo::ability::battle::Battle,
) -> Result<()> {
    match target_or_random {
        emo::ability::TargetOrRandom::Target(target) => {
            for emo_index in get_matched_emo_indexs_from_board(
                boards.get_board_mut(player_index)?,
                action_emo_index,
                target,
                is_action_emo_retired,
            )?
            .into_iter()
            {
                let emo = boards.get_emo_mut(player_index, emo_index)?;
                add_ability_to_emo(emo, ability.clone(), player_index, emo_index, logs);
            }
        }
        emo::ability::TargetOrRandom::Random {
            typ_and_triple,
            count,
        } => {
            add_battle_ability_random(
                player_index,
                action_emo_index,
                is_action_emo_retired,
                is_triple_action,
                boards,
                logs,
                rng,
                &ability,
                &typ_and_triple,
                count,
            )?;
        }
    }
    Ok(())
}

fn add_battle_ability_random(
    player_index: u8,
    action_emo_index: u8,
    is_action_emo_retired: bool,
    is_triple_action: bool,
    boards: &mut BattleBoards,
    logs: &mut mtc::battle::Logs,
    rng: &mut Pcg64Mcg,
    ability: &emo::ability::battle::Battle,
    typ_and_triple: &emo::ability::TypOptAndIsTripleOpt,
    count: u8,
) -> Result<()> {
    let special_ability = if let emo::ability::battle::Battle::Special(_) = ability {
        Some(emo::ability::Ability::Battle(ability.clone()))
    } else {
        None
    };

    for index in boards
        .get_board(player_index)?
        .iter()
        .zip(0u8..)
        .filter(|(_, i)| {
            if is_action_emo_retired {
                true
            } else {
                *i != action_emo_index
            }
        })
        .filter(|(e, _)| {
            if let Some(a) = &special_ability {
                !e.attributes.abilities.contains(a)
            } else {
                true
            }
        })
        .filter(|(e, _)| is_matched_typ_and_triple_for_emo(typ_and_triple, &e))
        .map(|(_, i)| i)
        .choose_multiple(rng, count as usize * if is_triple_action { 2 } else { 1 })
    {
        add_ability_to_emo(
            boards.get_emo_mut(player_index, index)?,
            ability.clone(),
            player_index,
            index,
            logs,
        );
    }
    Ok(())
}

fn damage_all(
    boards: &mut BattleBoards,
    player_index: u8,
    is_triple_action: bool,
    side: emo::ability::Side,
    damage: u16,
    emo_bases: &emo::Bases,
    logs: &mut mtc::battle::Logs,
    rng: &mut Pcg64Mcg,
) -> Result<()> {
    let damage = if is_triple_action {
        damage.saturating_mul(2)
    } else {
        damage
    };
    match side {
        emo::ability::Side::Ally => {
            damage_all_emos(boards, player_index, damage, emo_bases, logs, rng)
        }
        emo::ability::Side::Rival => {
            let rival_player_index = switch_player_index(player_index);
            damage_all_emos(boards, rival_player_index, damage, emo_bases, logs, rng)
        }
    }
}

fn damage_all_emos(
    boards: &mut BattleBoards,
    player_index: u8,
    damage: u16,
    emo_bases: &emo::Bases,
    logs: &mut mtc::battle::Logs,
    rng: &mut Pcg64Mcg,
) -> Result<()> {
    for emo_id in boards
        .get_board(player_index)?
        .iter()
        .map(|e| e.id)
        .collect::<Vec<_>>()
        .into_iter()
    {
        let emo_index = if let Some(index) = boards.find_emo_index_by_id(player_index, emo_id)? {
            index
        } else {
            continue;
        };
        damage_emo(
            damage,
            player_index,
            emo_index,
            boards,
            emo_bases,
            rng,
            logs,
        )?;
    }
    Ok(())
}

fn set_emo_ally(
    player_index: u8,
    emo_index: u8,
    mut battle_emo: BattleEmo,
    attack_and_survived_count: u8,
    boards: &mut BattleBoards,
    logs: &mut mtc::battle::Logs,
    emo_bases: &emo::Bases,
    rng: &mut Pcg64Mcg,
) -> Result<()> {
    battle_emo.attack_and_survived_count = attack_and_survived_count;

    add_emo(
        player_index,
        emo_index,
        boards,
        battle_emo,
        emo_bases,
        rng,
        logs,
    )?;
    Ok(())
}

fn set_emo_rival(
    player_index: u8,
    mut battle_emo: BattleEmo,
    boards: &mut BattleBoards,
    logs: &mut mtc::battle::Logs,
    emo_bases: &emo::Bases,
    rng: &mut Pcg64Mcg,
) -> Result<()> {
    let rival_player_index = switch_player_index(player_index);
    let rival_player_board = boards.get_board(rival_player_index)?;
    battle_emo.attack_and_survived_count = if let Some(l) = rival_player_board.last() {
        l.attack_and_survived_count
    } else {
        0
    };

    add_emo(
        rival_player_index,
        rival_player_board.len() as u8,
        boards,
        battle_emo,
        emo_bases,
        rng,
        logs,
    )?;
    Ok(())
}

fn add_emo(
    player_index: u8,
    emo_index: u8,
    boards: &mut BattleBoards,
    emo: BattleEmo,
    emo_bases: &emo::Bases,
    rng: &mut Pcg64Mcg,
    logs: &mut mtc::battle::Logs,
) -> Result<()> {
    let len = boards.count_board_emos(player_index)?;

    if len < BOARD_EMO_MAX_COUNT {
        ensure!(len >= emo_index, "invalid emo_index");

        logs.add(&|| mtc::battle::Log::Add {
            player_index,
            emo_index,
            base_id: emo.base_id,
            attributes: emo.attributes.clone(),
        });

        boards
            .get_board_mut(player_index)?
            .insert(emo_index as usize, emo);

        let added_emo = boards.get_emo(player_index, emo_index)?;
        let added_emo_typ = added_emo.typ.clone();
        let is_added_emo_triple = added_emo.attributes.is_triple;

        for (ability_emo_index, ability) in boards.get_board_abilities(player_index)?.into_iter() {
            if ability_emo_index == emo_index {
                continue;
            }
            if let emo::ability::battle::Battle::General(emo::ability::battle::General::AsAlly {
                trigger: emo::ability::battle::GeneralAsAllyTrigger::AllySet { typ_and_triple },
                action,
            }) = ability
            {
                if is_matched_typ_and_triple(&typ_and_triple, &added_emo_typ, is_added_emo_triple) {
                    call_ability_general_as_ally_action(
                        player_index,
                        emo_bases,
                        action,
                        emo_index,
                        None,
                        ability_emo_index,
                        boards,
                        logs,
                        rng,
                    )?;
                }
            }
        }
    }

    Ok(())
}
