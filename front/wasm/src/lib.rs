use anyhow::Result;
use common::*;
use parity_scale_codec::Encode;
use std::panic;
use wasm_bindgen::prelude::*;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub fn init_hook() {
    panic::set_hook(Box::new(console_error_panic_hook::hook));
}

#[wasm_bindgen]
pub fn get_catalog(pool: &[u8], board: &[u8], seed: &str) -> Vec<u8> {
    mtc::shop::catalog::get_catalog(
        &mtc::decoders::decode_mtc_emos(pool),
        &mtc::decoders::decode_board(board),
        seed.parse().unwrap(),
    )
    .unwrap()
    .encode()
}

#[wasm_bindgen]
pub fn build_pool(
    selected_built_base_ids: &[u16],
    emo_bases: &[u8],
    fixed_base_ids: &[u16],
    built_base_ids: &[u16],
) -> Vec<u8> {
    mtc::setup::build_pool(
        selected_built_base_ids,
        &mtc::decoders::decode_emo_bases(emo_bases),
        fixed_base_ids,
        built_base_ids,
    )
    .unwrap()
    .encode()
}

#[wasm_bindgen]
pub fn start_shop(board: &[u8], seed: &str, emo_bases: &[u8]) -> Vec<u8> {
    decode_and_encode_for_shop(board, |board, logs| {
        mtc::shop::board::start_shop(
            board,
            logs,
            seed.parse().unwrap(),
            &mtc::decoders::decode_emo_bases(emo_bases),
        )
    })
}

#[wasm_bindgen]
pub fn add_emo(
    board: &[u8],
    mtc_emo_ids: &[u16],
    base_id: u16,
    is_triple: bool,
    emo_index: u8,
    emo_bases: &[u8],
) -> Vec<u8> {
    decode_and_encode_for_shop(board, |board, logs| {
        mtc::shop::board::add_emo(
            board,
            logs,
            mtc_emo_ids,
            base_id,
            is_triple,
            emo_index,
            &mtc::decoders::decode_emo_bases(emo_bases),
        )
    })
}

#[wasm_bindgen]
pub fn sell_emo(board: &[u8], emo_index: u8, emo_bases: &[u8]) -> Vec<u8> {
    decode_and_encode_for_shop(board, |board, logs| {
        mtc::shop::board::sell_emo(
            board,
            logs,
            emo_index,
            &mtc::decoders::decode_emo_bases(emo_bases),
        )
    })
}

#[wasm_bindgen]
pub fn move_emo(board: &[u8], emo_index: u8, is_right: bool) -> Vec<u8> {
    decode_and_encode_for_shop(board, |board, logs| {
        mtc::shop::board::move_emo(board, logs, emo_index, is_right)
    })
}

#[wasm_bindgen]
pub fn get_initial_coin_by_turn(turn: u8) -> u8 {
    mtc::shop::coin::get_initial_coin_by_turn(turn)
}

#[wasm_bindgen]
pub fn get_upgrade_coin(grade: u8) -> Option<u8> {
    mtc::shop::coin::get_upgrade_coin(grade)
}

#[wasm_bindgen]
pub fn select_battle_ghost_index(states: &[u8], previous_index: u8, seed: &str) -> u8 {
    mtc::battle::organizer::select_battle_ghost_index(
        &mtc::decoders::decode_ghost_states(states),
        previous_index,
        seed.parse().unwrap(),
    )
    .unwrap()
}

#[wasm_bindgen]
pub fn march_pvg(board: &[u8], ghost_board: &[u8], seed: &str, emo_bases: &[u8]) -> Vec<u8> {
    mtc::battle::organizer::march_pvg(
        &mtc::decoders::decode_board(board),
        &mtc::decoders::decode_ghost_board(ghost_board),
        seed.parse().unwrap(),
        &mtc::decoders::decode_emo_bases(emo_bases),
    )
    .map_err(|e| {
        console_log!(
            "march_pvg: {}, {}, {}, {}",
            hex::encode(board),
            hex::encode(ghost_board),
            seed,
            hex::encode(emo_bases)
        );
        e
    })
    .unwrap()
    .encode()
}

#[wasm_bindgen]
pub fn battle_all(
    board: &[u8],
    grade: u8,
    health: u8,
    ghosts: &[u8],
    ghost_states: &[u8],
    battle_ghost_index: u8,
    turn: u8,
    seed: &str,
    emo_bases: &[u8],
) -> Vec<u8> {
    let mut health = health;
    let mut ghost_states = mtc::decoders::decode_ghost_states(ghost_states);

    let final_place = mtc::battle::organizer::battle_all(
        &mtc::decoders::decode_board(board),
        &mut health,
        &mut ghost_states,
        grade,
        &mtc::decoders::decode_ghosts(ghosts),
        battle_ghost_index,
        turn,
        seed.parse().unwrap(),
        &mtc::decoders::decode_emo_bases(emo_bases),
    )
    .unwrap();

    (health, ghost_states, final_place).encode()
}

#[wasm_bindgen]
pub fn get_grade_and_ghost_board(
    grade_and_ghost_boards: &[u8],
    ghost_state: &[u8],
    turn: u8,
) -> Vec<u8> {
    mtc::battle::organizer::get_grade_and_ghost_board(
        &mtc::decoders::decode_grade_and_ghost_boards(grade_and_ghost_boards),
        &mtc::decoders::decode_ghost_state(ghost_state),
        turn,
    )
    .encode()
}

#[wasm_bindgen]
pub fn get_pool_emo_count_by_grade(grade: u8) -> u8 {
    mtc::utils::get_pool_emo_count_by_grade(grade).unwrap()
}

fn decode_and_encode_for_shop<F>(board: &[u8], f: F) -> Vec<u8>
where
    F: Fn(&mut codec_types::mtc::Board, &mut codec_types::mtc::shop::BoardLogs) -> Result<u8>,
{
    let mut board = mtc::decoders::decode_board(board);
    let mut logs = codec_types::mtc::shop::BoardLogs::new();
    let coin = f(&mut board, &mut logs).unwrap();
    (board, logs, coin).encode()
}
