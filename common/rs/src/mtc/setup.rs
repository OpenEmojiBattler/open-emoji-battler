use crate::{codec_types::*, mtc::utils};
use anyhow::{bail, ensure, Result};
use sp_std::prelude::*;

pub const PLAYER_INITIAL_HEALTH: u8 = 30;

pub fn build_pool(
    selected_built_base_ids: &[u16],
    bases: &emo::Bases,
    fixed_base_ids: &[u16],
    built_base_ids: &[u16],
) -> Result<Vec<mtc::Emo>> {
    let mut base_ids = build_built_base_ids(selected_built_base_ids, bases, built_base_ids)?;

    base_ids.extend(fixed_base_ids);

    let mut mtc_emo_id = 1;
    let mut deck = Vec::new();

    for id in base_ids.into_iter() {
        let base = bases.find(id)?;
        let num = utils::get_pool_emo_count_by_grade(base.grade)?;
        for _ in 0..num {
            deck.push(mtc::Emo {
                id: mtc_emo_id,
                base_id: base.id,
            });
            mtc_emo_id += 1;
        }
    }

    Ok(deck)
}

fn build_built_base_ids(
    selected_built_base_ids: &[u16],
    bases: &emo::Bases,
    built_base_ids: &[u16],
) -> Result<Vec<u16>> {
    ensure!(
        selected_built_base_ids.len() == 6,
        "invalid len for selected_built_base_ids"
    );

    let mut base_ids = Vec::new();
    let mut used_grades = vec![];

    for id in selected_built_base_ids.iter() {
        let base = bases.find(*id)?;
        if !built_base_ids.contains(&base.id) {
            bail!("not contained in allowlist: {}", id);
        }
        if used_grades.contains(&base.grade) {
            bail!("contains same grade");
        }

        base_ids.push(base.id);
        used_grades.push(base.grade);
    }

    Ok(base_ids)
}

pub fn build_initial_ghost_states() -> Vec<mtc::GhostState> {
    vec![
        mtc::GhostState::Active {
            health: PLAYER_INITIAL_HEALTH,
        },
        mtc::GhostState::Active {
            health: PLAYER_INITIAL_HEALTH,
        },
        mtc::GhostState::Active {
            health: PLAYER_INITIAL_HEALTH,
        },
    ]
}
