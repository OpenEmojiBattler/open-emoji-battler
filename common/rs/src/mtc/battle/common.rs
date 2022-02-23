use crate::{
    codec_types::*,
    error::{format_err, Result},
    mtc::utils::{build_emo_attributes, is_matched_typ_and_triple},
    utils::is_view_logs_enabled,
};
use core::sync::atomic::{AtomicU16, Ordering};
use sp_std::prelude::*;

// internal use only
#[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Debug)]
pub struct BattleEmo {
    pub id: u16, // unique identifier for each battles
    pub base_id: u16,
    pub typ: emo::Typ,
    pub attributes: emo::Attributes,
    pub attack_and_survived_count: u8,
}

impl BattleEmo {
    pub fn new_with_base(base: &emo::Base, is_triple: bool) -> Self {
        Self::new_with_attributes(base, build_emo_attributes(base, is_triple))
    }

    pub fn new_with_attributes(base: &emo::Base, attributes: emo::Attributes) -> Self {
        Self {
            id: generate_battle_emo_id(),
            base_id: base.id,
            typ: base.typ.clone(),
            attributes,
            attack_and_survived_count: 0,
        }
    }

    // return (ability_index, ability)[]
    pub fn get_abilities(&self) -> Vec<(u8, emo::ability::battle::Battle)> {
        let mut v = vec![];
        for (ability, ability_index) in self.attributes.abilities.iter().zip(0u8..) {
            if let emo::ability::Ability::Battle(battle_ability) = ability {
                v.push((ability_index, battle_ability.clone()));
            }
        }
        v
    }
}

static BATTLE_EMO_ID_GENERATOR: AtomicU16 = AtomicU16::new(0);
fn generate_battle_emo_id() -> u16 {
    BATTLE_EMO_ID_GENERATOR.fetch_add(1, Ordering::Relaxed) // wraps around on overflow
}

pub struct BattleBoards(pub [Vec<BattleEmo>; 2]);

impl BattleBoards {
    pub fn get_board(&self, player_index: u8) -> Result<&Vec<BattleEmo>> {
        self.0
            .get(player_index as usize)
            .ok_or_else(|| format_err!("board not found"))
    }

    pub fn get_board_mut(&mut self, player_index: u8) -> Result<&mut Vec<BattleEmo>> {
        self.0
            .get_mut(player_index as usize)
            .ok_or_else(|| format_err!("board mut not found"))
    }

    pub fn is_empty_board(&self, player_index: u8) -> Result<bool> {
        Ok(self.get_board(player_index)?.is_empty())
    }

    pub fn count_board_emos(&self, player_index: u8) -> Result<u8> {
        Ok(self.get_board(player_index)?.len() as u8)
    }

    pub fn get_emo(&self, player_index: u8, emo_index: u8) -> Result<&BattleEmo> {
        self.get_board(player_index)?
            .get(emo_index as usize)
            .ok_or_else(|| format_err!("emo not found"))
    }

    pub fn get_emo_mut(&mut self, player_index: u8, emo_index: u8) -> Result<&mut BattleEmo> {
        self.get_board_mut(player_index)?
            .get_mut(emo_index as usize)
            .ok_or_else(|| format_err!("emo mut not found"))
    }

    pub fn find_emo_index_by_id(&self, player_index: u8, emo_id: u16) -> Result<Option<u8>> {
        Ok(self
            .get_board(player_index)?
            .iter()
            .zip(0u8..)
            .find(|(e, _)| e.id == emo_id)
            .map(|(_, i)| i))
    }

    pub fn has_emo_at_index(&self, player_index: u8, emo_index: u8) -> Result<bool> {
        Ok(self.count_board_emos(player_index)? > emo_index)
    }

    // return (emo_index, ability)[]
    pub fn get_board_abilities(
        &self,
        player_index: u8,
    ) -> Result<Vec<(u8, emo::ability::battle::Battle)>> {
        let mut v = vec![];
        for (emo, emo_index) in self.get_board(player_index)?.iter().zip(0u8..) {
            for ability in emo.attributes.abilities.iter() {
                if let emo::ability::Ability::Battle(battle_ability) = ability {
                    v.push((emo_index, battle_ability.clone()));
                }
            }
        }
        Ok(v)
    }
}

impl mtc::battle::Logs {
    pub fn new() -> Self {
        Self(Vec::new())
    }

    pub fn extend(&mut self, new_logs: mtc::battle::Logs) {
        if is_view_logs_enabled() {
            self.0.extend(new_logs.0);
        }
    }

    pub fn add<F>(&mut self, f: &F)
    where
        F: Fn() -> mtc::battle::Log,
    {
        if is_view_logs_enabled() {
            self.0.push(f());
        }
    }
}

pub fn switch_player_index(index: u8) -> u8 {
    if index == 0 {
        1
    } else {
        0
    }
}

pub fn is_matched_typ_and_triple_for_emo(
    typ_and_triple: &emo::ability::TypOptAndIsTripleOpt,
    emo: &BattleEmo,
) -> bool {
    is_matched_typ_and_triple(typ_and_triple, &emo.typ, emo.attributes.is_triple)
}
