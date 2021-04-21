use crate::codec_types::*;
use anyhow::{anyhow, Result};
use sp_std::prelude::*;

impl mtc::Board {
    pub fn get_emo(&self, emo_index: u8) -> Result<&mtc::BoardEmo> {
        self.0
            .get(emo_index as usize)
            .ok_or_else(|| anyhow!("emo not found: index {}", emo_index))
    }

    pub fn get_emo_mut(&mut self, emo_index: u8) -> Result<&mut mtc::BoardEmo> {
        self.0
            .get_mut(emo_index as usize)
            .ok_or_else(|| anyhow!("emo for mut not found: index {}", emo_index))
    }

    pub fn emos(&self) -> Vec<&mtc::BoardEmo> {
        self.0.iter().collect()
    }

    pub fn emo_indexes(&self) -> Vec<u8> {
        self.0.iter().zip(0u8..).map(|(_, i)| i).collect()
    }

    pub fn emos_with_indexes(&self) -> Vec<(&mtc::BoardEmo, u8)> {
        self.0.iter().zip(0u8..).map(|(e, i)| (e, i)).collect()
    }

    pub fn count_emos(&self) -> u8 {
        self.0.len() as u8
    }

    pub fn swap_emos(&mut self, a: u8, b: u8) {
        self.0.swap(a as usize, b as usize);
    }

    pub fn insert_emo(&mut self, index: u8, emo: mtc::BoardEmo) {
        self.0.insert(index as usize, emo);
    }

    pub fn remove_emo(&mut self, index: u8) -> mtc::BoardEmo {
        self.0.remove(index as usize)
    }

    // return (emo_index, ability)[]
    pub fn get_board_pre_abilities(&self) -> Vec<(u8, emo::ability::shop::Pre)> {
        let mut v = vec![];
        for (emo, emo_index) in self.0.iter().zip(0u8..) {
            for ability in emo.attributes.abilities.iter() {
                if let emo::ability::Ability::Shop(emo::ability::shop::Shop::Pre(pre_ability)) =
                    ability
                {
                    v.push((emo_index, pre_ability.clone()));
                }
            }
        }
        v
    }

    // return (emo_index, ability)[]
    pub fn get_board_peri_abilities(&self) -> Vec<(u8, emo::ability::shop::Peri)> {
        let mut v = vec![];
        for (emo, emo_index) in self.0.iter().zip(0u8..) {
            for ability in emo.attributes.abilities.iter() {
                if let emo::ability::Ability::Shop(emo::ability::shop::Shop::Peri(peri_ability)) =
                    ability
                {
                    v.push((emo_index, peri_ability.clone()));
                }
            }
        }
        v
    }
}

impl mtc::BoardEmo {
    pub fn get_peri_abilities(&self) -> Vec<emo::ability::shop::Peri> {
        let mut v = vec![];
        for ability in self.attributes.abilities.iter() {
            if let emo::ability::Ability::Shop(emo::ability::shop::Shop::Peri(peri_ability)) =
                ability
            {
                v.push(peri_ability.clone());
            }
        }
        v
    }
}
