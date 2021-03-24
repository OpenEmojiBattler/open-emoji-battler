use crate::codec_types::*;
use parity_scale_codec::Decode;
use sp_std::prelude::*;

pub fn decode_vec_u8(v: &[u8]) -> Vec<u8> {
    let mut v: &[u8] = v;
    Vec::decode(&mut v).unwrap()
}

pub fn decode_vec_u16(v: &[u8]) -> Vec<u16> {
    let mut v: &[u8] = v;
    Vec::decode(&mut v).unwrap()
}

pub fn decode_board(board: &[u8]) -> mtc::Board {
    let mut board: &[u8] = board;
    mtc::Board::decode(&mut board).unwrap()
}

pub fn decode_ghosts(ghosts: &[u8]) -> Vec<mtc::Ghost> {
    let mut ghosts: &[u8] = ghosts;
    Vec::decode(&mut ghosts).unwrap()
}

pub fn decode_emo_bases(emo_bases: &[u8]) -> emo::Bases {
    let mut emo_bases: &[u8] = emo_bases;
    emo::Bases::decode(&mut emo_bases).unwrap()
}

pub fn decode_catalog(catalog: &[u8]) -> mtc::shop::Catalog {
    let mut catalog: &[u8] = catalog;
    mtc::shop::Catalog::decode(&mut catalog).unwrap()
}

pub fn decode_grade_and_ghost_boards(
    grade_and_ghost_boards: &[u8],
) -> Vec<mtc::GradeAndGhostBoard> {
    let mut grade_and_ghost_boards: &[u8] = grade_and_ghost_boards;
    Vec::decode(&mut grade_and_ghost_boards).unwrap()
}

pub fn decode_ghost_state(ghost_state: &[u8]) -> mtc::GhostState {
    let mut ghost_state: &[u8] = ghost_state;
    mtc::GhostState::decode(&mut ghost_state).unwrap()
}

pub fn decode_ghost_states(ghost_states: &[u8]) -> Vec<mtc::GhostState> {
    let mut ghost_states: &[u8] = ghost_states;
    Vec::decode(&mut ghost_states).unwrap()
}

pub fn decode_ghost_board(ghost_board: &[u8]) -> mtc::GhostBoard {
    let mut ghost_board: &[u8] = ghost_board;
    mtc::GhostBoard::decode(&mut ghost_board).unwrap()
}

pub fn decode_board_emo(board_emo: &[u8]) -> mtc::BoardEmo {
    let mut board_emo: &[u8] = board_emo;
    mtc::BoardEmo::decode(&mut board_emo).unwrap()
}

pub fn decode_board_emos(board_emos: &[u8]) -> Vec<mtc::BoardEmo> {
    let mut board_emos: &[u8] = board_emos;
    Vec::decode(&mut board_emos).unwrap()
}

pub fn decode_mtc_emos(mtc_emos: &[u8]) -> Vec<mtc::Emo> {
    let mut mtc_emos: &[u8] = mtc_emos;
    Vec::decode(&mut mtc_emos).unwrap()
}

pub fn decode_typ_opts(typ_opts: &[u8]) -> Vec<Option<emo::Typ>> {
    let mut typ_opts: &[u8] = typ_opts;
    Vec::decode(&mut typ_opts).unwrap()
}

pub fn decode_option_u8(option_u8: &[u8]) -> Option<u8> {
    let mut option_u8: &[u8] = option_u8;
    Option::decode(&mut option_u8).unwrap()
}

pub fn decode_shop_player_operations(
    shop_player_operations: &[u8],
) -> Vec<mtc::shop::PlayerOperation> {
    let mut shop_player_operations: &[u8] = shop_player_operations;
    Vec::decode(&mut shop_player_operations).unwrap()
}
