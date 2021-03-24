use crate::codec_types::*;
use sp_std::prelude::*;

pub fn build_ghost_from_history(grade_and_board_history: &[mtc::GradeAndBoard]) -> mtc::Ghost {
    let history = grade_and_board_history
        .iter()
        .map(|h| mtc::GradeAndGhostBoard {
            grade: h.grade,
            board: build_ghost_board_from_board(&h.board),
        })
        .collect();
    mtc::Ghost { history }
}

fn build_ghost_board_from_board(board: &mtc::Board) -> mtc::GhostBoard {
    mtc::GhostBoard(
        board
            .0
            .iter()
            .map(|be| mtc::GhostBoardEmo {
                base_id: be.base_id,
                attributes: be.attributes.clone(),
            })
            .collect(),
    )
}
