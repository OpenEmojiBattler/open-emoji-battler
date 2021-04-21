use crate::codec_types::*;
use anyhow::{anyhow, bail, Result};
use sp_std::prelude::*;

pub const BOARD_EMO_MAX_COUNT: u8 = 7;
pub const GHOST_COUNT: usize = 3;
pub const PLAYER_INITIAL_HEALTH: u8 = 40;

pub fn build_emo_attributes(base: &emo::Base, is_triple: bool) -> emo::Attributes {
    emo::Attributes {
        attack: if is_triple {
            base.attack.saturating_mul(2)
        } else {
            base.attack
        },
        health: if is_triple {
            base.health.saturating_mul(2)
        } else {
            base.health
        },
        abilities: base.abilities.clone(),
        is_triple,
    }
}

impl mtc::BoardEmo {
    pub fn new_with_base(mtc_emo_ids: Vec<u16>, base: &emo::Base, is_triple: bool) -> Self {
        Self::new_with_attributes(mtc_emo_ids, base.id, build_emo_attributes(base, is_triple))
    }

    pub fn new_with_attributes(
        mtc_emo_ids: Vec<u16>,
        base_id: u16,
        attributes: emo::Attributes,
    ) -> Self {
        Self {
            mtc_emo_ids,
            base_id,
            attributes,
        }
    }
}

impl emo::Bases {
    pub fn new() -> Self {
        Self(Default::default())
    }

    pub fn add(&mut self, base: emo::Base) {
        self.0.insert(base.id, base);
    }

    pub fn find(&self, id: u16) -> Result<&emo::Base> {
        self.0
            .get(&id)
            .ok_or_else(|| anyhow!("emo base not found: {}", id))
    }
}

pub fn is_matched_typ(required_typ: &Option<emo::Typ>, test_typ: &emo::Typ) -> bool {
    matches!((required_typ.as_ref(), test_typ), (Some(typ), _) | (None, typ) if typ == test_typ)
}

pub fn is_matched_triple(required_triple: Option<bool>, test_triple: bool) -> bool {
    if let Some(_required_triple) = required_triple {
        if test_triple == _required_triple {
            return true;
        }
    } else {
        return true;
    }
    false
}

pub fn is_matched_typ_and_triple(
    typ_and_triple: &emo::ability::TypOptAndIsTripleOpt,
    typ: &emo::Typ,
    is_triple: bool,
) -> bool {
    is_matched_typ(&typ_and_triple.typ_opt, typ)
        && is_matched_triple(typ_and_triple.is_triple_opt, is_triple)
}

pub fn double_attack_and_health_if(condition: bool, attack: u16, health: u16) -> (u16, u16) {
    if condition {
        (attack.saturating_mul(2), health.saturating_mul(2))
    } else {
        (attack, health)
    }
}

pub fn get_pool_emo_count_by_grade(grade: u8) -> Result<u8> {
    Ok(match grade {
        1 => 7,
        2 => 6,
        3 => 6,
        4 => 5,
        5 => 5,
        6 => 4,
        _ => bail!("invalid grade: {}", grade),
    })
}

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

#[cfg(test)]
mod tests {
    use super::*;
    use sp_std::collections::btree_map::BTreeMap;

    #[test]
    fn test_emo_bases_find() {
        let bases = emo::Bases(BTreeMap::new());
        let r = bases.find(1);
        assert_eq!(r.is_err(), true);
    }
}
