use crate::error::{anyhow, ensure, Result};
use crate::{
    codec_types::*,
    mtc::battle::{common::BattleEmo, march::march},
};
use rand::{seq::SliceRandom, SeedableRng};
use rand_pcg::Pcg64Mcg;
use sp_std::{cmp, prelude::*};

// return final_place
pub fn battle_all(
    board: &mtc::Board,
    health: &mut u8,
    ghost_states: &mut [mtc::GhostState],
    grade: u8,
    ghosts: &[mtc::Ghost],
    battle_ghost_index: u8,
    turn: u8,
    seed: u64,
    emo_bases: &emo::Bases,
) -> Result<Option<u8>> {
    let pre_health = *health;
    let pre_ghost_states = ghost_states.to_vec();

    if ghost_states
        .iter()
        .filter(|s| matches!(s, mtc::GhostState::Active { health: _ }))
        .count()
        > 1
    {
        battle_pvg_and_gvg(
            board,
            grade,
            health,
            ghosts,
            ghost_states,
            battle_ghost_index,
            turn,
            seed,
            emo_bases,
        )?;
    } else {
        let (ghost_index, ghost_state) = ghost_states
            .iter_mut()
            .enumerate()
            .find(|(_, s)| matches!(s, mtc::GhostState::Active { health: _ }))
            .ok_or_else(|| anyhow!("battle_all: invalid"))?;

        battle_pvg(
            grade,
            health,
            board,
            ghost_state,
            &ghosts[ghost_index].history,
            turn,
            seed,
            emo_bases,
        )?;
    };

    let final_place = calc_final_place(*health, pre_health, ghost_states, &pre_ghost_states);

    Ok(final_place)
}

pub fn march_pvg(
    board: &mtc::Board,
    ghost_board: &mtc::GhostBoard,
    seed: u64,
    emo_bases: &emo::Bases,
) -> Result<(u8, u8, mtc::battle::Logs)> {
    march(
        build_battle_emos_from_board(board, emo_bases)?,
        build_battle_emos_from_ghost_board(ghost_board, emo_bases)?,
        seed,
        emo_bases,
    )
}

pub fn march_gvg(
    ghost_board0: &mtc::GhostBoard,
    ghost_board1: &mtc::GhostBoard,
    seed: u64,
    emo_bases: &emo::Bases,
) -> Result<(u8, u8, mtc::battle::Logs)> {
    march(
        build_battle_emos_from_ghost_board(ghost_board0, emo_bases)?,
        build_battle_emos_from_ghost_board(ghost_board1, emo_bases)?,
        seed,
        emo_bases,
    )
}

static EMPTY_GRADE_AND_GHOST_BOARD: mtc::GradeAndGhostBoard = mtc::GradeAndGhostBoard {
    grade: 1,
    board: mtc::GhostBoard(vec![]),
};
pub fn get_grade_and_ghost_board<'a>(
    grade_and_ghost_boards: &'a [mtc::GradeAndGhostBoard],
    state: &mtc::GhostState,
    turn: u8,
) -> &'a mtc::GradeAndGhostBoard {
    let hist_len = grade_and_ghost_boards.len() as u8;
    if hist_len == 0 {
        &EMPTY_GRADE_AND_GHOST_BOARD
    } else {
        let effective_turn = if let mtc::GhostState::Retired { final_turn } = state {
            cmp::min(turn, *final_turn)
        } else {
            turn
        };
        if hist_len >= effective_turn {
            &grade_and_ghost_boards[effective_turn as usize - 1]
        } else {
            &grade_and_ghost_boards[hist_len as usize - 1]
        }
    }
}

// select one of four
pub fn select_battle_ghost_index(
    states: &[mtc::GhostState],
    previous_index: u8,
    seed: u64,
) -> Result<u8> {
    let live_indexes = states
        .iter()
        .zip(0u8..)
        .filter(|(s, _)| matches!(s, mtc::GhostState::Active { health: _ }))
        .map(|(_, i)| i)
        .collect::<Vec<_>>();

    let len = live_indexes.len();
    ensure!(len != 0, "select_battle_ghost_index: live zero");
    if len == 1 {
        return Ok(live_indexes[0]);
    }

    let mut rng = Pcg64Mcg::seed_from_u64(seed);
    live_indexes
        .into_iter()
        .filter(|&i| i != previous_index)
        .collect::<Vec<_>>()
        .choose(&mut rng)
        .copied()
        .ok_or_else(|| anyhow!("choose failed"))
}

fn build_battle_emos_from_board(
    board: &mtc::Board,
    emo_bases: &emo::Bases,
) -> Result<Vec<BattleEmo>> {
    let mut emos = Vec::with_capacity(board.0.len());
    for emo in board.0.iter() {
        emos.push(BattleEmo::new_with_attributes(
            emo_bases.find(emo.base_id)?,
            emo.attributes.clone(),
        ));
    }
    Ok(emos)
}

fn build_battle_emos_from_ghost_board(
    ghost_board: &mtc::GhostBoard,
    emo_bases: &emo::Bases,
) -> Result<Vec<BattleEmo>> {
    let mut emos = Vec::with_capacity(ghost_board.0.len());
    for emo in ghost_board.0.iter() {
        emos.push(BattleEmo::new_with_attributes(
            emo_bases.find(emo.base_id)?,
            emo.attributes.clone(),
        ));
    }
    Ok(emos)
}

fn calc_final_place(
    health: u8,
    pre_health: u8,
    ghost_states: &[mtc::GhostState],
    pre_ghost_states: &[mtc::GhostState],
) -> Option<u8> {
    let are_all_ghosts_retired = ghost_states
        .iter()
        .all(|s| matches!(s, mtc::GhostState::Retired { final_turn: _ }));

    if health == 0 || are_all_ghosts_retired {
        if are_all_ghosts_retired {
            Some(1)
        } else {
            let mut place = 1;
            for (i, ghost_state) in ghost_states.iter().enumerate() {
                if let mtc::GhostState::Active { health: _ } = ghost_state {
                    place += 1;
                    continue;
                }
                if let mtc::GhostState::Active { health: g_health } = pre_ghost_states[i] {
                    if g_health > pre_health {
                        place += 1;
                        continue;
                    }
                }
            }
            Some(place)
        }
    } else {
        None
    }
}

struct GhostSet<'a> {
    index: u8,
    ghost: mtc::Ghost,
    state: &'a mut mtc::GhostState,
}
fn battle_pvg_and_gvg(
    board: &mtc::Board,
    grade: u8,
    health: &mut u8,
    ghosts: &[mtc::Ghost],
    ghost_states: &mut [mtc::GhostState],
    battle_ghost_index: u8,
    turn: u8,
    seed: u64,
    emo_bases: &emo::Bases,
) -> Result<()> {
    let mut ghost_sets = ghosts
        .iter()
        .zip(ghost_states.iter_mut())
        .enumerate()
        .map(|(i, (g, gs))| GhostSet {
            index: i as u8,
            ghost: g.clone(),
            state: gs,
        })
        .collect::<Vec<GhostSet>>();

    if battle_ghost_index != 0 {
        ghost_sets.swap(0, battle_ghost_index as usize);
    }

    let (ghost_set0, gs) = ghost_sets
        .split_first_mut()
        .ok_or_else(|| anyhow!("failed to split ghost_sets"))?;
    let (ghost_set1, gs) = gs
        .split_first_mut()
        .ok_or_else(|| anyhow!("failed to split ghost_sets"))?;
    let (ghost_set2, _) = gs
        .split_first_mut()
        .ok_or_else(|| anyhow!("failed to split ghost_sets"))?;

    battle_pvg(
        grade,
        health,
        board,
        ghost_set0.state,
        &ghost_set0.ghost.history,
        turn,
        seed,
        emo_bases,
    )?;

    battle_gvg(
        ghost_set1.state,
        &ghost_set1.ghost.history,
        ghost_set2.state,
        &ghost_set2.ghost.history,
        turn,
        seed,
        emo_bases,
    )?;

    ghost_sets.sort_unstable_by_key(|g| g.index);

    Ok(())
}

fn damage_ghost_health(board_grade: u8, grade: u8, ghost_state: &mut mtc::GhostState, turn: u8) {
    if let mtc::GhostState::Active { ref mut health } = ghost_state {
        damage_health(board_grade, grade, health);
        if *health == 0 {
            *ghost_state = mtc::GhostState::Retired { final_turn: turn };
        }
    }
}

fn damage_player_health(board_grade: u8, grade: u8, health: &mut u8) {
    damage_health(board_grade, grade, health)
}

fn damage_health(board_grade: u8, grade: u8, health: &mut u8) {
    if board_grade > 0 {
        *health = health.saturating_sub(board_grade + grade);
    }
}

fn battle_pvg(
    grade: u8,
    health: &mut u8,
    board: &mtc::Board,
    ghost_state: &mut mtc::GhostState,
    ghost_history: &[mtc::GradeAndGhostBoard],
    turn: u8,
    seed: u64,
    emo_bases: &emo::Bases,
) -> Result<()> {
    let ghost_grade_and_ghost_board = get_grade_and_ghost_board(ghost_history, ghost_state, turn);

    let (player_board_grade, ghost_board_grade, _) =
        march_pvg(board, &ghost_grade_and_ghost_board.board, seed, emo_bases)?;

    damage_ghost_health(player_board_grade, grade, ghost_state, turn);
    damage_player_health(ghost_board_grade, ghost_grade_and_ghost_board.grade, health);

    Ok(())
}

fn battle_gvg(
    ghost0_state: &mut mtc::GhostState,
    ghost0_history: &[mtc::GradeAndGhostBoard],
    ghost1_state: &mut mtc::GhostState,
    ghost1_history: &[mtc::GradeAndGhostBoard],
    turn: u8,
    seed: u64,
    emo_bases: &emo::Bases,
) -> Result<()> {
    let ghost0_grade_and_ghost_board =
        get_grade_and_ghost_board(ghost0_history, ghost0_state, turn);
    let ghost1_grade_and_ghost_board =
        get_grade_and_ghost_board(ghost1_history, ghost1_state, turn);

    let (ghost0_board_grade, ghost1_board_grade, _) = march_gvg(
        &ghost0_grade_and_ghost_board.board,
        &ghost1_grade_and_ghost_board.board,
        seed,
        emo_bases,
    )?;

    damage_ghost_health(
        ghost1_board_grade,
        ghost1_grade_and_ghost_board.grade,
        ghost0_state,
        turn,
    );
    damage_ghost_health(
        ghost0_board_grade,
        ghost0_grade_and_ghost_board.grade,
        ghost1_state,
        turn,
    );

    Ok(())
}
