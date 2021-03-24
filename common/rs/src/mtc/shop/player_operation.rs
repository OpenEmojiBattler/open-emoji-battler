use crate::{
    codec_types::*,
    mtc::shop::{
        board::{add_emo, sell_emo, start_shop},
        catalog::get_catalog,
        coin::{get_initial_coin_by_turn, get_upgrade_coin},
    },
};
use anyhow::{anyhow, bail, ensure, Result};
use sp_std::prelude::*;

const NEXT_CATALOG_LINE_COIN: u8 = 1;
const EMO_BUY_COIN: u8 = 3;
const LAST_GRADE: u8 = 6;
const MULLIGAN_COUNT: u8 = 2;

pub fn verify_player_operations_and_update(
    board: &mut mtc::Board,
    grade: &mut u8,
    upgrade_coin: &mut Option<u8>,
    ops: &[mtc::shop::PlayerOperation],
    pool: &[mtc::Emo],
    seed: u64,
    turn: u8,
    emo_bases: &emo::Bases,
) -> Result<()> {
    ensure!(ops.len() < 150, "too big ops");

    let mut coin = get_initial_coin_by_turn(turn);
    let mut catalog_line_index = 0u8;
    let mut next_catalog_line_counter = 0u8;
    let mut sold_mtc_emo_ids = Vec::<u16>::new();
    let logs = &mut mtc::shop::BoardLogs::new();
    let catalog = get_catalog(&pool, board, seed)?;

    coin = coin.saturating_add(start_shop(board, logs, seed, emo_bases)?);

    for op in ops.iter() {
        match op {
            mtc::shop::PlayerOperation::Buy { mtc_emo_id, index } => {
                buy(
                    board,
                    &mut coin,
                    logs,
                    *grade,
                    &catalog,
                    catalog_line_index,
                    &sold_mtc_emo_ids,
                    emo_bases,
                    *mtc_emo_id,
                    *index,
                )?;
            }
            mtc::shop::PlayerOperation::Sell { index } => {
                sell(
                    board,
                    &mut coin,
                    &mut sold_mtc_emo_ids,
                    logs,
                    emo_bases,
                    *index,
                )?;
            }
            mtc::shop::PlayerOperation::Move { indexes } => {
                mov(board, indexes)?;
            }
            mtc::shop::PlayerOperation::NextCatalogLine => {
                next_catalog_line(
                    &mut catalog_line_index,
                    &mut next_catalog_line_counter,
                    &mut coin,
                    turn,
                )?;
            }
            mtc::shop::PlayerOperation::Upgrade => {
                upgrade(grade, upgrade_coin, &mut coin)?;
            }
        }
    }

    Ok(())
}

fn buy(
    board: &mut mtc::Board,
    coin: &mut u8,
    logs: &mut mtc::shop::BoardLogs,
    grade: u8,
    catalog: &mtc::shop::Catalog,
    catalog_line_index: u8,
    sold_mtc_emo_ids: &[u16],
    emo_bases: &emo::Bases,
    bought_mtc_emo_id: u16,
    bought_emo_index: u8,
) -> Result<()> {
    ensure!(!sold_mtc_emo_ids.contains(&bought_mtc_emo_id), "sold emo");
    for board_emo in board.emos().into_iter() {
        ensure!(
            !board_emo.mtc_emo_ids.contains(&bought_mtc_emo_id),
            "already on board"
        );
    }

    *coin = coin
        .checked_sub(EMO_BUY_COIN)
        .ok_or_else(|| anyhow!("Not enough coin to buy"))?;

    let current_catalog_line = catalog
        .0
        .get(catalog_line_index as usize)
        .ok_or_else(|| anyhow!("non catalog_line"))?;
    let mtc_emo = current_catalog_line
        .0
        .iter()
        .find(|ec| ec.id == bought_mtc_emo_id)
        .ok_or_else(|| anyhow!("target emo to buy not found"))?;
    let base = emo_bases.find(mtc_emo.base_id)?;

    ensure!(base.grade <= grade, "higher grade");

    let gotten_coin = add_emo(
        board,
        logs,
        &[bought_mtc_emo_id],
        base.id,
        false,
        bought_emo_index,
        emo_bases,
    )?;
    *coin = coin.saturating_add(gotten_coin);

    Ok(())
}

fn sell(
    board: &mut mtc::Board,
    coin: &mut u8,
    sold_mtc_emo_ids: &mut Vec<u16>,
    logs: &mut mtc::shop::BoardLogs,
    emo_bases: &emo::Bases,
    sold_emo_index: u8,
) -> Result<()> {
    sold_mtc_emo_ids.extend(board.get_emo(sold_emo_index)?.mtc_emo_ids.clone());
    let c = sell_emo(board, logs, sold_emo_index, emo_bases)?;
    *coin = coin.saturating_add(c);
    Ok(())
}

fn mov(board: &mut mtc::Board, result_indexes: &[u8]) -> Result<()> {
    let mut current_indexes = board.emo_indexes();
    let result_indexes_len = result_indexes.len();

    ensure!(
        current_indexes.len() == result_indexes_len,
        "invalid indexes len"
    );

    for (&result_index, idx) in result_indexes.iter().zip(0u8..) {
        let actual_index = current_indexes
            .iter()
            .zip(0u8..)
            .find(|&(&current_index, _)| current_index == result_index)
            .map(|(_, i)| i)
            .ok_or_else(|| anyhow!("invalid index"))?;

        current_indexes.swap(idx.into(), actual_index.into());
        board.swap_emos(idx, actual_index);
    }

    Ok(())
}

fn next_catalog_line(
    catalog_line_index: &mut u8,
    next_catalog_line_counter: &mut u8,
    coin: &mut u8,
    turn: u8,
) -> Result<()> {
    if turn > 1 || *next_catalog_line_counter >= MULLIGAN_COUNT {
        *coin = coin
            .checked_sub(NEXT_CATALOG_LINE_COIN)
            .ok_or_else(|| anyhow!("Not enough coin for next catalog_line"))?;
    }
    *next_catalog_line_counter = next_catalog_line_counter
        .checked_add(1)
        .ok_or_else(|| anyhow!("invalid counter"))?;
    *catalog_line_index = catalog_line_index
        .checked_add(1)
        .ok_or_else(|| anyhow!("invalid index"))?;
    Ok(())
}

fn upgrade(grade: &mut u8, upgrade_coin: &mut Option<u8>, coin: &mut u8) -> Result<()> {
    match *upgrade_coin {
        Some(c) => {
            *coin = coin
                .checked_sub(c)
                .ok_or_else(|| anyhow!("Not enough coin for upgrade"))?;
            ensure!(*grade < LAST_GRADE, "already last grade");
            *grade += 1;
            *upgrade_coin = get_upgrade_coin(*grade);
        }
        None => {
            bail!("no upgrade");
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mov() {
        let mut board_emo0: mtc::BoardEmo = Default::default();
        board_emo0.mtc_emo_ids = vec![0];
        let mut board_emo1: mtc::BoardEmo = Default::default();
        board_emo1.mtc_emo_ids = vec![1];
        let mut board_emo2: mtc::BoardEmo = Default::default();
        board_emo2.mtc_emo_ids = vec![2];
        let mut board_emo3: mtc::BoardEmo = Default::default();
        board_emo3.mtc_emo_ids = vec![3];
        let mut board_emo4: mtc::BoardEmo = Default::default();
        board_emo4.mtc_emo_ids = vec![4];

        let mut board = mtc::Board(vec![
            board_emo0, board_emo1, board_emo2, board_emo3, board_emo4,
        ]);
        let result_indexes = vec![0, 3, 4, 1, 2];

        mov(&mut board, &result_indexes).unwrap();

        assert_eq!(
            board
                .0
                .into_iter()
                .flat_map(|e| e.mtc_emo_ids)
                .collect::<Vec<_>>(),
            result_indexes
                .into_iter()
                .map(|i| i as u16)
                .collect::<Vec<_>>(),
        );
    }
}
