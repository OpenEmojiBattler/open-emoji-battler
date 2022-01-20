use crate::{
    codec_types::*,
    mtc::ep::{get_ep_band, INITIAL_EP},
};
use rand::{
    seq::{IteratorRandom, SliceRandom},
    SeedableRng,
};
use rand_pcg::Pcg64Mcg;
use sp_std::prelude::*;

pub const GHOST_COUNT: usize = 3;

pub fn choose_ghosts<A, F>(ep: u16, seed: u64, get_ghosts: &F) -> Vec<(A, u16, mtc::Ghost)>
where
    A: Default,
    F: Fn(u16) -> Option<Vec<(A, u16, mtc::Ghost)>>,
{
    let mut rng = Pcg64Mcg::seed_from_u64(seed);

    let mut ep_band = get_ep_band(ep);
    let mut selected = Vec::with_capacity(GHOST_COUNT);
    let mut n = GHOST_COUNT;
    let mut circuitbreaker = 0u8;

    loop {
        let mut ghosts = get_ghosts(ep_band)
            .unwrap_or_else(Vec::new)
            .into_iter()
            .choose_multiple(&mut rng, n);
        ghosts.shuffle(&mut rng);
        selected.extend(ghosts);

        if selected.len() >= GHOST_COUNT || ep_band < 1 {
            break;
        }
        n = GHOST_COUNT - selected.len();
        ep_band -= 1;

        circuitbreaker += 1;
        if circuitbreaker > 100 {
            break;
        }
    }

    if selected.len() < GHOST_COUNT {
        for _ in 0..(GHOST_COUNT - selected.len()) {
            selected.push((
                Default::default(),
                INITIAL_EP,
                mtc::Ghost { history: vec![] },
            ));
        }
    }

    selected
}
