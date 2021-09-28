use crate::codec_types::*;
use sp_std::prelude::*;

pub fn check_and_build_emo_bases(
    mut bases: emo::Bases,
    new_bases: emo::Bases,
    fixed_base_ids: &[u16],
    built_base_ids: &[u16],
    force_bases_update: bool,
) -> Result<emo::Bases, &'static str> {
    if force_bases_update {
        bases = new_bases;
    } else {
        for (id, value) in new_bases.0.into_iter() {
            if bases.0.contains_key(&id) {
                continue;
            }
            bases.0.insert(id, value);
        }
    }

    let base_keys = bases.0.keys().cloned().collect::<Vec<_>>();

    for id in fixed_base_ids.iter() {
        if base_keys.contains(id) {
            return Err("invalid emo bases: fixed_base_ids");
        }
    }
    for id in built_base_ids.iter() {
        if base_keys.contains(id) {
            return Err("invalid emo bases: built_base_ids");
        }
    }

    Ok(bases)
}
