use crate::{
    codec_types::*,
    error::{format_err, Result},
};
use rand::seq::{IteratorRandom, SliceRandom};
use rand::SeedableRng;
use rand_pcg::Pcg64Mcg;
use sp_std::prelude::*;

const CATALOG_COUNT: u8 = 5;
const CATALOG_LINE_EMO_COUNT: u8 = 7;

pub fn get_catalog(pool: &[mtc::Emo], board: &mtc::Board, seed: u64) -> Result<mtc::shop::Catalog> {
    let onboard_deck_emo_ids: Vec<u16> =
        board.0.iter().flat_map(|e| e.mtc_emo_ids.clone()).collect();
    let mut rng = Pcg64Mcg::seed_from_u64(seed);
    let mut emos = pool
        .iter()
        .filter(|e| !onboard_deck_emo_ids.contains(&e.id))
        .choose_multiple(&mut rng, (CATALOG_COUNT * CATALOG_LINE_EMO_COUNT).into())
        .into_iter()
        .cloned()
        .collect::<Vec<_>>();
    emos.shuffle(&mut rng);

    let mut catalog = mtc::shop::Catalog(Vec::with_capacity(CATALOG_COUNT.into()));
    for _i in 0..CATALOG_COUNT {
        let mut catalog_line =
            mtc::shop::CatalogLine(Vec::with_capacity(CATALOG_LINE_EMO_COUNT.into()));
        for _j in 0..CATALOG_LINE_EMO_COUNT {
            catalog_line
                .0
                .push(emos.pop().ok_or_else(|| format_err!("catalog failed"))?);
        }
        catalog.0.push(catalog_line);
    }
    Ok(catalog)
}
