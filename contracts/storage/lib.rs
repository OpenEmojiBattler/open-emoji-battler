#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
pub mod contract {
    use common::codec_types::*;
    #[cfg(not(feature = "ink-as-dependency"))]
    use ink_prelude::vec as std_vec;
    use ink_prelude::vec::Vec as StdVec;
    #[cfg(not(feature = "ink-as-dependency"))]
    use ink_storage::collections::HashMap as StorageMap;
    #[cfg(not(feature = "ink-as-dependency"))]
    use ink_storage::Lazy;

    #[ink(storage)]
    pub struct Storage {
        emo_bases: Lazy<emo::Bases>,
        deck_fixed_emo_base_ids: Lazy<StdVec<u16>>,
        deck_built_emo_base_ids: Lazy<StdVec<u16>>,
        matchmaking_ghosts: Lazy<StdVec<(AccountId, mtc::Ghost)>>,

        player_seed: Lazy<StorageMap<AccountId, u64>>,

        // remove for each mtc
        player_pool: Lazy<StorageMap<AccountId, StdVec<mtc::Emo>>>,
        player_health: Lazy<StorageMap<AccountId, u8>>,
        player_grade_and_board_history: Lazy<StorageMap<AccountId, StdVec<mtc::GradeAndBoard>>>,
        player_upgrade_coin: Lazy<StorageMap<AccountId, u8>>,
        player_ghosts: Lazy<StorageMap<AccountId, StdVec<(AccountId, mtc::Ghost)>>>,
        player_ghost_states: Lazy<StorageMap<AccountId, StdVec<mtc::GhostState>>>,
        player_battle_ghost_index: Lazy<StorageMap<AccountId, u8>>,

        // allowed accounts
        allowed_accounts: Lazy<StdVec<AccountId>>,
    }

    impl Storage {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                emo_bases: Default::default(),
                deck_fixed_emo_base_ids: Default::default(),
                deck_built_emo_base_ids: Default::default(),
                matchmaking_ghosts: Default::default(),
                player_seed: Default::default(),
                player_pool: Default::default(),
                player_health: Default::default(),
                player_grade_and_board_history: Default::default(),
                player_upgrade_coin: Default::default(),
                player_ghosts: Default::default(),
                player_ghost_states: Default::default(),
                player_battle_ghost_index: Default::default(),

                allowed_accounts: Lazy::new(std_vec![Self::env().caller()]),
            }
        }

        #[ink(message)]
        pub fn get_emo_bases(&self) -> emo::Bases {
            self.emo_bases.clone()
        }

        #[ink(message)]
        pub fn set_emo_bases(&mut self, value: emo::Bases) {
            self.only_allowed_caller();
            *self.emo_bases = value;
        }

        #[ink(message)]
        pub fn get_deck_fixed_emo_base_ids(&self) -> StdVec<u16> {
            self.deck_fixed_emo_base_ids.clone()
        }

        #[ink(message)]
        pub fn set_deck_fixed_emo_base_ids(&mut self, value: StdVec<u16>) {
            self.only_allowed_caller();
            *self.deck_fixed_emo_base_ids = value;
        }

        #[ink(message)]
        pub fn get_deck_built_emo_base_ids(&self) -> StdVec<u16> {
            self.deck_built_emo_base_ids.clone()
        }

        #[ink(message)]
        pub fn set_deck_built_emo_base_ids(&mut self, value: StdVec<u16>) {
            self.only_allowed_caller();
            *self.deck_built_emo_base_ids = value;
        }

        #[ink(message)]
        pub fn get_matchmaking_ghosts(&self) -> StdVec<(AccountId, mtc::Ghost)> {
            self.matchmaking_ghosts.clone()
        }

        #[ink(message)]
        pub fn set_matchmaking_ghosts(&mut self, value: StdVec<(AccountId, mtc::Ghost)>) {
            self.only_allowed_caller();
            *self.matchmaking_ghosts = value;
        }

        #[ink(message)]
        pub fn get_player_seed(&self, account: AccountId) -> Option<u64> {
            self.player_seed.get(&account).copied()
        }

        #[ink(message)]
        pub fn contains_player_seed(&self, account: AccountId) -> bool {
            self.player_seed.contains_key(&account)
        }

        #[ink(message)]
        pub fn set_player_seed(&mut self, account: AccountId, value: u64) {
            self.only_allowed_caller();
            self.player_seed.insert(account, value);
        }

        #[ink(message)]
        pub fn take_player_seed(&mut self, account: AccountId) -> Option<u64> {
            self.only_allowed_caller();
            self.player_seed.take(&account)
        }

        #[ink(message)]
        pub fn get_player_pool(&self, account: AccountId) -> Option<StdVec<mtc::Emo>> {
            self.player_pool.get(&account).cloned()
        }

        #[ink(message)]
        pub fn contains_player_pool(&self, account: AccountId) -> bool {
            self.player_pool.contains_key(&account)
        }

        #[ink(message)]
        pub fn set_player_pool(&mut self, account: AccountId, value: StdVec<mtc::Emo>) {
            self.only_allowed_caller();
            self.player_pool.insert(account, value);
        }

        #[ink(message)]
        pub fn take_player_pool(&mut self, account: AccountId) -> Option<StdVec<mtc::Emo>> {
            self.only_allowed_caller();
            self.player_pool.take(&account)
        }

        #[ink(message)]
        pub fn get_player_health(&self, account: AccountId) -> Option<u8> {
            self.player_health.get(&account).copied()
        }

        #[ink(message)]
        pub fn contains_player_health(&self, account: AccountId) -> bool {
            self.player_health.contains_key(&account)
        }

        #[ink(message)]
        pub fn set_player_health(&mut self, account: AccountId, value: u8) {
            self.only_allowed_caller();
            self.player_health.insert(account, value);
        }

        #[ink(message)]
        pub fn take_player_health(&mut self, account: AccountId) -> Option<u8> {
            self.only_allowed_caller();
            self.player_health.take(&account)
        }

        #[ink(message)]
        pub fn get_player_grade_and_board_history(
            &self,
            account: AccountId,
        ) -> Option<StdVec<mtc::GradeAndBoard>> {
            self.player_grade_and_board_history.get(&account).cloned()
        }

        #[ink(message)]
        pub fn contains_player_grade_and_board_history(&self, account: AccountId) -> bool {
            self.player_grade_and_board_history.contains_key(&account)
        }

        #[ink(message)]
        pub fn set_player_grade_and_board_history(
            &mut self,
            account: AccountId,
            value: StdVec<mtc::GradeAndBoard>,
        ) {
            self.only_allowed_caller();
            self.player_grade_and_board_history.insert(account, value);
        }

        #[ink(message)]
        pub fn take_player_grade_and_board_history(
            &mut self,
            account: AccountId,
        ) -> Option<StdVec<mtc::GradeAndBoard>> {
            self.only_allowed_caller();
            self.player_grade_and_board_history.take(&account)
        }

        #[ink(message)]
        pub fn get_player_upgrade_coin(&self, account: AccountId) -> Option<u8> {
            self.player_upgrade_coin.get(&account).copied()
        }

        #[ink(message)]
        pub fn contains_player_upgrade_coin(&self, account: AccountId) -> bool {
            self.player_upgrade_coin.contains_key(&account)
        }

        #[ink(message)]
        pub fn set_player_upgrade_coin(&mut self, account: AccountId, value: u8) {
            self.only_allowed_caller();
            self.player_upgrade_coin.insert(account, value);
        }

        #[ink(message)]
        pub fn take_player_upgrade_coin(&mut self, account: AccountId) -> Option<u8> {
            self.only_allowed_caller();
            self.player_upgrade_coin.take(&account)
        }

        #[ink(message)]
        pub fn get_player_ghosts(
            &self,
            account: AccountId,
        ) -> Option<StdVec<(AccountId, mtc::Ghost)>> {
            self.player_ghosts.get(&account).cloned()
        }

        #[ink(message)]
        pub fn contains_player_ghosts(&self, account: AccountId) -> bool {
            self.player_ghosts.contains_key(&account)
        }

        #[ink(message)]
        pub fn set_player_ghosts(
            &mut self,
            account: AccountId,
            value: StdVec<(AccountId, mtc::Ghost)>,
        ) {
            self.only_allowed_caller();
            self.player_ghosts.insert(account, value);
        }

        #[ink(message)]
        pub fn take_player_ghosts(
            &mut self,
            account: AccountId,
        ) -> Option<StdVec<(AccountId, mtc::Ghost)>> {
            self.only_allowed_caller();
            self.player_ghosts.take(&account)
        }

        #[ink(message)]
        pub fn get_player_ghost_states(
            &self,
            account: AccountId,
        ) -> Option<StdVec<mtc::GhostState>> {
            self.player_ghost_states.get(&account).cloned()
        }

        #[ink(message)]
        pub fn contains_player_ghost_states(&self, account: AccountId) -> bool {
            self.player_ghost_states.contains_key(&account)
        }

        #[ink(message)]
        pub fn set_player_ghost_states(
            &mut self,
            account: AccountId,
            value: StdVec<mtc::GhostState>,
        ) {
            self.only_allowed_caller();
            self.player_ghost_states.insert(account, value);
        }

        #[ink(message)]
        pub fn take_player_ghost_states(
            &mut self,
            account: AccountId,
        ) -> Option<StdVec<mtc::GhostState>> {
            self.only_allowed_caller();
            self.player_ghost_states.take(&account)
        }

        #[ink(message)]
        pub fn get_player_battle_ghost_index(&self, account: AccountId) -> Option<u8> {
            self.player_battle_ghost_index.get(&account).copied()
        }

        #[ink(message)]
        pub fn contains_player_battle_ghost_index(&self, account: AccountId) -> bool {
            self.player_battle_ghost_index.contains_key(&account)
        }

        #[ink(message)]
        pub fn set_player_battle_ghost_index(&mut self, account: AccountId, value: u8) {
            self.only_allowed_caller();
            self.player_battle_ghost_index.insert(account, value);
        }

        #[ink(message)]
        pub fn take_player_battle_ghost_index(&mut self, account: AccountId) -> Option<u8> {
            self.only_allowed_caller();
            self.player_battle_ghost_index.take(&account)
        }

        // allowed accounts

        #[ink(message)]
        pub fn get_allowed_accounts(&self) -> StdVec<AccountId> {
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
                "allowed accounts: this caller is not allowed: {:?}",
                &self.env().caller()
            );
        }
    }
}
