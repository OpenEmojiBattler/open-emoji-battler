#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
pub mod contract {
    use common::codec_types::*;
    use ink_prelude::vec::Vec;
    use ink_storage::{traits::SpreadAllocate, Mapping};

    #[ink(storage)]
    #[derive(SpreadAllocate)]
    pub struct Storage {
        emo_bases: Option<emo::Bases>,
        deck_fixed_emo_base_ids: Option<Vec<u16>>,
        deck_built_emo_base_ids: Option<Vec<u16>>,

        matchmaking_ghosts: Mapping<u16, Vec<(AccountId, u16, mtc::Ghost)>>,

        player_ep: Mapping<AccountId, u16>,

        player_seed: Mapping<AccountId, u64>,

        // remove for each mtc
        player_pool: Mapping<AccountId, Vec<mtc::Emo>>,
        player_health: Mapping<AccountId, u8>,
        player_grade_and_board_history: Mapping<AccountId, Vec<mtc::GradeAndBoard>>,
        player_upgrade_coin: Mapping<AccountId, u8>,
        player_ghosts: Mapping<AccountId, Vec<(AccountId, u16, mtc::Ghost)>>,
        player_ghost_states: Mapping<AccountId, Vec<mtc::GhostState>>,
        player_battle_ghost_index: Mapping<AccountId, u8>,

        // allowed accounts
        allowed_accounts: Vec<AccountId>,
    }

    impl Storage {
        #[ink(constructor)]
        pub fn new() -> Self {
            ink_lang::utils::initialize_contract(|contract: &mut Self| {
                contract.allowed_accounts.push(Self::env().caller());
            })
        }

        #[ink(message)]
        pub fn get_emo_bases(&self) -> Option<emo::Bases> {
            self.emo_bases.clone()
        }

        #[ink(message)]
        pub fn set_emo_bases(&mut self, value: Option<emo::Bases>) {
            self.only_allowed_caller();
            self.emo_bases = value;
        }

        #[ink(message)]
        pub fn get_deck_fixed_emo_base_ids(&self) -> Option<Vec<u16>> {
            self.deck_fixed_emo_base_ids.clone()
        }

        #[ink(message)]
        pub fn set_deck_fixed_emo_base_ids(&mut self, value: Option<Vec<u16>>) {
            self.only_allowed_caller();
            self.deck_fixed_emo_base_ids = value;
        }

        #[ink(message)]
        pub fn get_deck_built_emo_base_ids(&self) -> Option<Vec<u16>> {
            self.deck_built_emo_base_ids.clone()
        }

        #[ink(message)]
        pub fn set_deck_built_emo_base_ids(&mut self, value: Option<Vec<u16>>) {
            self.only_allowed_caller();
            self.deck_built_emo_base_ids = value;
        }

        #[ink(message)]
        pub fn get_matchmaking_ghosts(
            &self,
            ep_band: u16,
        ) -> Option<Vec<(AccountId, u16, mtc::Ghost)>> {
            self.matchmaking_ghosts.get(ep_band)
        }

        #[ink(message)]
        pub fn set_matchmaking_ghosts(
            &mut self,
            ep_band: u16,
            value: Vec<(AccountId, u16, mtc::Ghost)>,
        ) {
            self.only_allowed_caller();
            self.matchmaking_ghosts.insert(ep_band, &value);
        }

        #[ink(message)]
        pub fn remove_matchmaking_ghosts(&mut self, ep_band: u16) {
            self.only_allowed_caller();
            self.matchmaking_ghosts.remove(ep_band);
        }

        #[ink(message)]
        pub fn get_player_ep(&self, account: AccountId) -> Option<u16> {
            self.player_ep.get(account)
        }

        #[ink(message)]
        pub fn set_player_ep(&mut self, account: AccountId, value: u16) {
            self.only_allowed_caller();
            self.player_ep.insert(account, &value);
        }

        #[ink(message)]
        pub fn remove_player_ep(&mut self, account: AccountId) {
            self.only_allowed_caller();
            self.player_ep.remove(account)
        }

        #[ink(message)]
        pub fn get_player_seed(&self, account: AccountId) -> Option<u64> {
            self.player_seed.get(account)
        }

        #[ink(message)]
        pub fn set_player_seed(&mut self, account: AccountId, value: u64) {
            self.only_allowed_caller();
            self.player_seed.insert(account, &value);
        }

        #[ink(message)]
        pub fn remove_player_seed(&mut self, account: AccountId) {
            self.only_allowed_caller();
            self.player_seed.remove(account)
        }

        #[ink(message)]
        pub fn get_player_pool(&self, account: AccountId) -> Option<Vec<mtc::Emo>> {
            self.player_pool.get(&account)
        }

        #[ink(message)]
        pub fn set_player_pool(&mut self, account: AccountId, value: Vec<mtc::Emo>) {
            self.only_allowed_caller();
            self.player_pool.insert(account, &value);
        }

        #[ink(message)]
        pub fn remove_player_pool(&mut self, account: AccountId) {
            self.only_allowed_caller();
            self.player_pool.remove(&account)
        }

        #[ink(message)]
        pub fn get_player_health(&self, account: AccountId) -> Option<u8> {
            self.player_health.get(&account)
        }

        #[ink(message)]
        pub fn set_player_health(&mut self, account: AccountId, value: u8) {
            self.only_allowed_caller();
            self.player_health.insert(account, &value);
        }

        #[ink(message)]
        pub fn remove_player_health(&mut self, account: AccountId) {
            self.only_allowed_caller();
            self.player_health.remove(&account)
        }

        #[ink(message)]
        pub fn get_player_grade_and_board_history(
            &self,
            account: AccountId,
        ) -> Option<Vec<mtc::GradeAndBoard>> {
            self.player_grade_and_board_history.get(&account)
        }

        #[ink(message)]
        pub fn set_player_grade_and_board_history(
            &mut self,
            account: AccountId,
            value: Vec<mtc::GradeAndBoard>,
        ) {
            self.only_allowed_caller();
            self.player_grade_and_board_history.insert(account, &value);
        }

        #[ink(message)]
        pub fn remove_player_grade_and_board_history(&mut self, account: AccountId) {
            self.only_allowed_caller();
            self.player_grade_and_board_history.remove(&account)
        }

        #[ink(message)]
        pub fn get_player_upgrade_coin(&self, account: AccountId) -> Option<u8> {
            self.player_upgrade_coin.get(&account)
        }

        #[ink(message)]
        pub fn set_player_upgrade_coin(&mut self, account: AccountId, value: u8) {
            self.only_allowed_caller();
            self.player_upgrade_coin.insert(account, &value);
        }

        #[ink(message)]
        pub fn remove_player_upgrade_coin(&mut self, account: AccountId) {
            self.only_allowed_caller();
            self.player_upgrade_coin.remove(&account)
        }

        #[ink(message)]
        pub fn get_player_ghosts(
            &self,
            account: AccountId,
        ) -> Option<Vec<(AccountId, u16, mtc::Ghost)>> {
            self.player_ghosts.get(&account)
        }

        #[ink(message)]
        pub fn set_player_ghosts(
            &mut self,
            account: AccountId,
            value: Vec<(AccountId, u16, mtc::Ghost)>,
        ) {
            self.only_allowed_caller();
            self.player_ghosts.insert(account, &value);
        }

        #[ink(message)]
        pub fn remove_player_ghosts(&mut self, account: AccountId) {
            self.only_allowed_caller();
            self.player_ghosts.remove(&account)
        }

        #[ink(message)]
        pub fn get_player_ghost_states(&self, account: AccountId) -> Option<Vec<mtc::GhostState>> {
            self.player_ghost_states.get(&account)
        }

        #[ink(message)]
        pub fn set_player_ghost_states(&mut self, account: AccountId, value: Vec<mtc::GhostState>) {
            self.only_allowed_caller();
            self.player_ghost_states.insert(account, &value);
        }

        #[ink(message)]
        pub fn remove_player_ghost_states(&mut self, account: AccountId) {
            self.only_allowed_caller();
            self.player_ghost_states.remove(&account)
        }

        #[ink(message)]
        pub fn get_player_battle_ghost_index(&self, account: AccountId) -> Option<u8> {
            self.player_battle_ghost_index.get(&account)
        }

        #[ink(message)]
        pub fn set_player_battle_ghost_index(&mut self, account: AccountId, value: u8) {
            self.only_allowed_caller();
            self.player_battle_ghost_index.insert(account, &value);
        }

        #[ink(message)]
        pub fn remove_player_battle_ghost_index(&mut self, account: AccountId) {
            self.only_allowed_caller();
            self.player_battle_ghost_index.remove(&account)
        }

        // batch ops

        #[ink(message)]
        pub fn get_data_for_finish_mtc_shop(
            &self,
            account: AccountId,
        ) -> (
            emo::Bases,
            Vec<mtc::GradeAndBoard>,
            Option<u8>,
            Vec<mtc::Emo>,
            u64,
            u8,
            u8,
            Vec<mtc::GhostState>,
            Vec<(AccountId, u16, mtc::Ghost)>,
        ) {
            (
                self.get_emo_bases().expect("emo_bases none"),
                self.get_player_grade_and_board_history(account)
                    .expect("player_grade_and_board_history none"),
                self.get_player_upgrade_coin(account),
                self.get_player_pool(account).expect("player_pool none"),
                self.get_player_seed(account).expect("player_seed none"),
                self.get_player_health(account).expect("player_health none"),
                self.get_player_battle_ghost_index(account)
                    .expect("battle_ghost_index none"),
                self.get_player_ghost_states(account)
                    .expect("ghost_states none"),
                self.get_player_ghosts(account).expect("player_ghosts none"),
            )
        }

        #[ink(message)]
        pub fn set_data_for_finish_mtc_shop_finish_battle(
            &mut self,
            account: AccountId,
            grade_and_board_history: Vec<mtc::GradeAndBoard>,
            health: u8,
            ghost_states: Vec<mtc::GhostState>,
            battle_ghost_index: u8,
        ) {
            self.set_player_grade_and_board_history(account, grade_and_board_history);
            self.set_player_health(account, health);
            self.set_player_ghost_states(account, ghost_states);
            self.set_player_battle_ghost_index(account, battle_ghost_index);
        }

        #[ink(message)]
        pub fn remove_data_for_finish_mtc_shop_cleanup_finished(&mut self, account: AccountId) {
            self.remove_player_pool(account);
            self.remove_player_health(account);
            self.remove_player_grade_and_board_history(account);
            self.remove_player_upgrade_coin(account);
            self.remove_player_ghosts(account);
            self.remove_player_ghost_states(account);
            self.remove_player_battle_ghost_index(account);
        }

        // allowed accounts

        #[ink(message)]
        pub fn get_allowed_accounts(&self) -> Vec<AccountId> {
            self.allowed_accounts.clone()
        }

        #[ink(message)]
        pub fn allow_account(&mut self, account_id: AccountId) {
            self.only_allowed_caller();
            self.allowed_accounts.push(account_id);
        }

        #[ink(message)]
        pub fn disallow_account(&mut self, account_id: AccountId) {
            self.only_allowed_caller();
            self.allowed_accounts.retain(|a| a != &account_id);
        }

        fn only_allowed_caller(&self) {
            assert!(
                self.allowed_accounts.contains(&self.env().caller()),
                "only_allowed_caller: this caller is not allowed",
            );
        }
    }
}
