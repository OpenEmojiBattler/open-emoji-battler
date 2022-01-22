use crate::codec_types::*;
use sp_std::prelude::*;

pub fn get_turn_and_previous_grade_and_board(
    history: &[mtc::GradeAndBoard],
) -> (u8, mtc::GradeAndBoard) {
    let history_len = history.len();
    let grade_and_board = if history_len > 0 {
        history[history_len - 1].clone()
    } else {
        mtc::GradeAndBoard {
            grade: 1,
            board: mtc::Board(vec![]),
        }
    };
    let turn = history_len as u8 + 1;

    (turn, grade_and_board)
}

pub fn exceeds_grade_and_board_history_limit(
    grade_and_board_history: &[mtc::GradeAndBoard],
) -> bool {
    grade_and_board_history.len() > 30
}
