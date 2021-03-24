use crate::{
    codec_types::*,
    mtc::battle::{
        board::{attack, call_pre_abilities},
        common::{switch_player_index, BattleBoards, BattleEmo},
    },
};
use anyhow::{Error, Result};
use rand::{Rng, SeedableRng};
use rand_pcg::Pcg64Mcg;
use sp_std::{cmp, prelude::*};

struct Tick {
    num: u8,
    first_attack_player_index: u8, // 0 or 1
}

impl Tick {
    fn new(first_attack_player_index: u8) -> Self {
        Self {
            num: 1,
            first_attack_player_index,
        }
    }

    fn attack_player_index(&self) -> u8 {
        if self.num % 2 == 1 {
            self.first_attack_player_index
        } else {
            switch_player_index(self.first_attack_player_index)
        }
    }

    fn next(&mut self) -> Result<()> {
        self.num = self
            .num
            .checked_add(1)
            .ok_or_else(|| Error::msg("reached maximum tick"))?;
        Ok(())
    }
}

// return remaining board grades and logs
// logs is empty if not "view-logs"
pub fn march(
    battle_emos0: Vec<BattleEmo>,
    battle_emos1: Vec<BattleEmo>,
    seed: u64,
    emo_bases: &emo::Bases,
) -> Result<(u8, u8, mtc::battle::Logs)> {
    let mut boards = BattleBoards([battle_emos0, battle_emos1]);
    let mut logs = mtc::battle::Logs::new();

    let mut rng = Pcg64Mcg::seed_from_u64(seed);
    let first_attack_player_index = get_first_attack_player_index(&boards, &mut rng)?;
    let mut tick = Tick::new(first_attack_player_index);

    call_pre_abilities(
        &mut boards,
        first_attack_player_index,
        &mut rng,
        &mut logs,
        emo_bases,
    )?;

    if let Some((g0, g1)) = get_remaining_grades_if_finished(&boards, emo_bases)? {
        return Ok((g0, g1, logs));
    }

    loop {
        attack(
            &mut boards,
            tick.attack_player_index(),
            &mut logs,
            &mut rng,
            emo_bases,
        )?;

        if let Some((g0, g1)) = get_remaining_grades_if_finished(&boards, emo_bases)? {
            return Ok((g0, g1, logs));
        }

        tick.next()?;
    }
}

fn get_remaining_grades_if_finished(
    boards: &BattleBoards,
    emo_bases: &emo::Bases,
) -> Result<Option<(u8, u8)>> {
    Ok(if boards.is_empty_board(0)? || boards.is_empty_board(1)? {
        Some((
            sum_grades(&boards.get_board(0)?, emo_bases)?,
            sum_grades(&boards.get_board(1)?, emo_bases)?,
        ))
    } else {
        None
    })
}

fn get_first_attack_player_index(boards: &BattleBoards, rng: &mut Pcg64Mcg) -> Result<u8> {
    let len0 = boards.count_board_emos(0)?;
    let len1 = boards.count_board_emos(1)?;

    Ok(match len0.cmp(&len1) {
        cmp::Ordering::Greater => 0,
        cmp::Ordering::Less => 1,
        cmp::Ordering::Equal => {
            let b: bool = rng.gen();
            if b {
                0
            } else {
                1
            }
        }
    })
}

fn sum_grades(emos: &[BattleEmo], emo_bases: &emo::Bases) -> Result<u8> {
    let mut sum = 0u8;
    for emo in emos.iter() {
        sum = sum.saturating_add(emo_bases.find(emo.base_id)?.grade);
    }
    Ok(sum)
}
