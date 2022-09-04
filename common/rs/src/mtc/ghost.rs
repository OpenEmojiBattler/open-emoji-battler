use crate::{codec_types::*, mtc::ep::get_ep_band};
use rand::{
    seq::{IteratorRandom, SliceRandom},
    SeedableRng,
};
use rand_pcg::Pcg64Mcg;
use sp_std::prelude::*;

const GHOST_COUNT: u8 = 3;
const GHOST_COUNT_USIZE: usize = GHOST_COUNT as usize;

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
            ghosts_infos.push((ep_band, v));

            if ghosts_infos.iter().map(|(_, v)| v.len()).sum::<usize>() >= GHOST_COUNT_USIZE {
                break;
            }
        }

        if ep_band < 1 {
            break;
        }

        ep_band -= 1;
    }

    let mut choosen_ghosts = Vec::with_capacity(GHOST_COUNT_USIZE);

    for (band, v) in ghosts_infos.into_iter() {
        choosen_ghosts.extend(
            v.into_iter()
                .zip(0u8..)
                .choose_multiple(&mut rng, GHOST_COUNT_USIZE - choosen_ghosts.len())
                .into_iter()
                .map(|(a, index)| (a, get_ghost((band, index)).unwrap())),
        );
    }

    choosen_ghosts.shuffle(&mut rng);

    for _ in 0..(GHOST_COUNT_USIZE - choosen_ghosts.len()) {
        choosen_ghosts.push((Default::default(), mtc::Ghost { history: vec![] }));
    }

    choosen_ghosts
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
) -> (u16, Vec<(A, u16, mtc::Ghost)>)
where
    A: Eq + Clone,
    F: Fn(u16) -> Option<Vec<(A, u16, mtc::Ghost)>>,
{
    let ep_band = get_ep_band(ep);
    let ghost = build_ghost_from_history(grade_and_board_history);

    let mut ghosts_with_data = get_matchmaking_ghosts(ep_band).unwrap_or_default();

    if let Some(ghost_with_data) = ghosts_with_data
        .iter_mut()
        .find(|(aid, _, _)| aid == account_id)
    {
        ghost_with_data.1 = ep;
        ghost_with_data.2 = ghost;
    } else if ghosts_with_data.len() < 20 {
        ghosts_with_data.push((account_id.clone(), ep, ghost));
    } else {
        ghosts_with_data.remove(0);
        ghosts_with_data.push((account_id.clone(), ep, ghost));
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
