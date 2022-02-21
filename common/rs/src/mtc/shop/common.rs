use crate::error::{anyhow, Result};
use crate::{codec_types::*, mtc::utils::build_emo_attributes, utils::is_view_logs_enabled};
use core::sync::atomic::{AtomicU16, Ordering};
use sp_std::prelude::*;

// internal use only
#[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Debug)]
pub struct ShopBoardEmo {
    pub id: u16, // unique identifier for each shop action
    // same as mtc::BoardEmo
    pub mtc_emo_ids: Vec<u16>,
    pub base_id: u16,
    pub attributes: emo::Attributes,
}

impl ShopBoardEmo {
    pub fn from_board_emo(board_emo: mtc::BoardEmo) -> Self {
        let mtc::BoardEmo {
            mtc_emo_ids,
            base_id,
            attributes,
        } = board_emo;

        Self {
            id: generate_shop_board_emo_id(),
            mtc_emo_ids,
            base_id,
            attributes,
        }
    }

    pub fn into_board_emo(self) -> mtc::BoardEmo {
        let Self {
            mtc_emo_ids,
            base_id,
            attributes,
            ..
        } = self;

        mtc::BoardEmo {
            mtc_emo_ids,
            base_id,
            attributes,
        }
    }

    pub fn new_with_base(mtc_emo_ids: Vec<u16>, base: &emo::Base, is_triple: bool) -> Self {
        Self::from_attributes(mtc_emo_ids, base.id, build_emo_attributes(base, is_triple))
    }

    pub fn from_attributes(
        mtc_emo_ids: Vec<u16>,
        base_id: u16,
        attributes: emo::Attributes,
    ) -> Self {
        Self {
            id: generate_shop_board_emo_id(),
            mtc_emo_ids,
            base_id,
            attributes,
        }
    }

    pub fn clone_as_board_emo(&self) -> mtc::BoardEmo {
        mtc::BoardEmo {
            mtc_emo_ids: self.mtc_emo_ids.clone(),
            base_id: self.base_id,
            attributes: self.attributes.clone(),
        }
    }

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

static SHOP_BOARD_EMO_ID_GENERATOR: AtomicU16 = AtomicU16::new(0);
fn generate_shop_board_emo_id() -> u16 {
    SHOP_BOARD_EMO_ID_GENERATOR.fetch_add(1, Ordering::Relaxed) // wraps around on overflow
}

#[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Debug)]
pub struct ShopBoard(pub Vec<ShopBoardEmo>);

impl ShopBoard {
    pub fn from_board(board: mtc::Board) -> Self {
        Self(
            board
                .0
                .into_iter()
                .map(ShopBoardEmo::from_board_emo)
                .collect(),
        )
    }

    pub fn into_board(self) -> mtc::Board {
        mtc::Board(self.0.into_iter().map(|e| e.into_board_emo()).collect())
    }

    pub fn get_emo_and_index_by_id(&self, shop_board_emo_id: u16) -> Result<(&ShopBoardEmo, u8)> {
        self.0
            .iter()
            .zip(0u8..)
            .find(|(e, _)| e.id == shop_board_emo_id)
            .ok_or_else(|| anyhow!("emo not found"))
    }

    pub fn get_emo(&self, emo_index: u8) -> Result<&ShopBoardEmo> {
        self.0
            .get(emo_index as usize)
            .ok_or_else(|| anyhow!("emo not found"))
    }

    pub fn get_emo_mut(&mut self, emo_index: u8) -> Result<&mut ShopBoardEmo> {
        self.0
            .get_mut(emo_index as usize)
            .ok_or_else(|| anyhow!("emo for mut not found"))
    }

    pub fn emos(&self) -> Vec<&ShopBoardEmo> {
        self.0.iter().collect()
    }

    pub fn emo_indexes(&self) -> Vec<u8> {
        self.0.iter().zip(0u8..).map(|(_, i)| i).collect()
    }

    pub fn emos_with_indexes(&self) -> Vec<(&ShopBoardEmo, u8)> {
        self.0.iter().zip(0u8..).map(|(e, i)| (e, i)).collect()
    }

    pub fn count_emos(&self) -> u8 {
        self.0.len() as u8
    }

    pub fn swap_emos(&mut self, a: u8, b: u8) {
        self.0.swap(a as usize, b as usize);
    }

    pub fn insert_emo(&mut self, index: u8, emo: ShopBoardEmo) {
        self.0.insert(index as usize, emo);
    }

    pub fn remove_emo(&mut self, index: u8) -> ShopBoardEmo {
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

impl mtc::shop::BoardLogs {
    pub fn new() -> Self {
        Self(Vec::new())
    }

    pub fn extend(&mut self, new_logs: Self) {
        if is_view_logs_enabled() {
            self.0.extend(new_logs.0);
        }
    }

    pub fn add<F>(&mut self, f: &F)
    where
        F: Fn() -> mtc::shop::BoardLog,
    {
        if is_view_logs_enabled() {
            self.0.push(f());
        }
    }
}
