use crate::{codec_types::*, mtc::ep::get_ep_band};
use rand::{
    seq::{IteratorRandom, SliceRandom},
    SeedableRng,
};
use rand_pcg::Pcg64Mcg;
use sp_std::prelude::*;

const GHOST_COUNT: u8 = 3;

pub fn choose_ghosts<A, F0, F1>(
    ep: u16,
    seed: u64,
    get_ghosts_info: &F0,
    get_ghost: &F1,
) -> Vec<(A, mtc::Ghost)>
where
    A: Default,
    F0: Fn(u16) -> Option<Vec<A>>,
    F1: Fn((u16, u8)) -> Option<mtc::Ghost>,
{
    let mut rng = Pcg64Mcg::seed_from_u64(seed);

    let mut ep_band = get_ep_band(ep);
    let mut ghosts_infos = Vec::new();

    loop {
        if let Some(v) = get_ghosts_info(ep_band) {
            ghosts_infos.push((ep_band, v.len() as u8, v));
        } else {
            continue;
        }

        if ghosts_infos.iter().map(|(_, len, _)| len).sum::<u8>() >= GHOST_COUNT || ep_band < 1 {
            break;
        }

        ep_band -= 1;
    }

    let mut selected = Vec::with_capacity(GHOST_COUNT.into());
    let mut n: usize = GHOST_COUNT.into();

    for (band, _, v) in ghosts_infos.into_iter() {
        let ghosts = v
            .into_iter()
            .zip(0u8..)
            .choose_multiple(&mut rng, n)
            .into_iter()
            .map(|(a, index)| (a, get_ghost((band, index)).unwrap()))
            .collect::<Vec<_>>();

        selected.extend(ghosts);

        n = (GHOST_COUNT as usize) - selected.len();
    }

    selected.shuffle(&mut rng);

    let selected_len = selected.len() as u8;
    if selected_len < GHOST_COUNT {
        for _ in 0..(GHOST_COUNT - selected_len) {
            selected.push((Default::default(), mtc::Ghost { history: vec![] }));
        }
    }

    selected
}

pub fn separate_player_ghosts<T>(
    player_ghosts: Vec<(T, u16, mtc::Ghost)>,
) -> (Vec<mtc::Ghost>, Vec<u16>) {
    let len = player_ghosts.len();

    let mut ghosts = Vec::with_capacity(len);
    let mut ghost_eps = Vec::with_capacity(len);

    for (_, ep, ghost) in player_ghosts.into_iter() {
        ghosts.push(ghost);
        ghost_eps.push(ep);
    }

    (ghosts, ghost_eps)
}

pub fn build_matchmaking_ghosts<A, F>(
    account_id: &A,
    ep: u16,
    grade_and_board_history: &[mtc::GradeAndBoard],
    get_matchmaking_ghosts: &F,
) -> (u16, Vec<(A, mtc::Ghost)>)
where
    A: Eq + Clone,
    F: Fn(u16) -> Option<Vec<(A, mtc::Ghost)>>,
{
    let ep_band = get_ep_band(ep);
    let ghost = build_ghost_from_history(grade_and_board_history);

    let mut ghosts_with_data = get_matchmaking_ghosts(ep_band).unwrap_or_default();

    if let Some(ghost_with_data) = ghosts_with_data
        .iter_mut()
        .find(|(aid, _)| aid == account_id)
    {
        ghost_with_data.1 = ghost;
    } else if ghosts_with_data.len() < 20 {
        ghosts_with_data.push((account_id.clone(), ghost));
    } else {
        ghosts_with_data.remove(0);
        ghosts_with_data.push((account_id.clone(), ghost));
    }

    (ep_band, ghosts_with_data)
}

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
