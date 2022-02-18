#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
pub mod contract {
    use common::mtc::{
        ep::{EP_UNFINISH_PENALTY, INITIAL_EP},
        ghost::choose_ghosts,
        setup::{build_initial_ghost_states, build_pool, PLAYER_INITIAL_HEALTH},
        shop::coin::get_upgrade_coin,
    };
    use ink_env::{call::FromAccountId, hash::Blake2x128};
    use ink_prelude::{vec, vec::Vec};
    use scale::Decode;
    use storage::contract::StorageRef;

    #[ink(storage)]
    pub struct Logic {
        storage_account_id: AccountId,
        allowed_accounts: Vec<AccountId>,
    }

    impl Logic {
        #[ink(constructor)]
        pub fn new(storage_account_id: AccountId) -> Self {
            let caller = Self::env().caller();
            Self {
                storage_account_id,
                allowed_accounts: vec![caller],
            }
        }

        #[ink(message)]
        pub fn get_storage_account_id(&self) -> AccountId {
            self.storage_account_id
        }

        fn get_storage(&self) -> StorageRef {
            FromAccountId::from_account_id(self.storage_account_id)
        }

        #[ink(message)]
        pub fn start_mtc(&mut self, caller: AccountId, deck_emo_base_ids: [u16; 6]) {
            self.only_allowed_caller();

            let mut storage = self.get_storage();

            if storage.get_player_pool(caller).is_some() {
                self.cleanup_finished(&mut storage, caller);
                let ep = storage.get_player_ep(caller).expect("player ep none");
                storage.set_player_ep(caller, ep.saturating_sub(EP_UNFINISH_PENALTY));
            }

            let seed = self.get_random_seed(caller, b"start_mtc");

            storage.set_player_health(caller, PLAYER_INITIAL_HEALTH);
            storage.set_player_seed(caller, seed);
            storage.set_player_pool(
                caller,
                build_pool(
                    &deck_emo_base_ids,
                    &storage.get_emo_bases().expect("emo_bases none"),
                    &storage
                        .get_deck_fixed_emo_base_ids()
                        .expect("deck_fixed_emo_base_ids none"),
                    &storage
                        .get_deck_built_emo_base_ids()
                        .expect("deck_built_emo_base_ids none"),
                )
                .expect("failed to build player pool"),
            );
            storage.set_player_grade_and_board_history(caller, Vec::new());
            storage.set_player_battle_ghost_index(caller, 0);
            self.update_upgrade_coin(&mut storage, caller, get_upgrade_coin(2));

            self.matchmake(caller, &mut storage, seed)
        }

        fn cleanup_finished(&self, storage: &mut StorageRef, account: AccountId) {
            storage.remove_player_pool(account);
            storage.remove_player_health(account);
            storage.remove_player_grade_and_board_history(account);
            storage.remove_player_upgrade_coin(account);
            storage.remove_player_ghosts(account);
            storage.remove_player_ghost_states(account);
            storage.remove_player_battle_ghost_index(account);
        }

        fn get_random_seed(&self, caller: AccountId, subject: &[u8]) -> u64 {
            let (seed, _) = self
                .env()
                .random(&self.env().hash_encoded::<Blake2x128, _>(&(subject, caller)));
            <u64>::decode(&mut seed.as_ref()).expect("failed to get seed")
        }

        fn update_upgrade_coin(
            &self,
            storage: &mut StorageRef,
            account_id: AccountId,
            upgrade_coin: Option<u8>,
        ) {
            if let Some(c) = upgrade_coin {
                storage.set_player_upgrade_coin(account_id, c);
            } else {
                storage.remove_player_upgrade_coin(account_id);
            }
        }

        fn matchmake(&self, account_id: AccountId, storage: &mut StorageRef, seed: u64) {
            let ep = storage.get_player_ep(account_id).unwrap_or_else(|| {
                storage.set_player_ep(account_id, INITIAL_EP);
                INITIAL_EP
            });

            let selected =
                choose_ghosts(ep, seed, &|ep_band| storage.get_matchmaking_ghosts(ep_band));

            storage.set_player_ghosts(account_id, selected);
            storage.set_player_ghost_states(account_id, build_initial_ghost_states());
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
            let caller = &self.env().caller();
            assert!(
                self.allowed_accounts.contains(caller),
                "allowed accounts: this caller is not allowed: {caller:?}",
            );
        }
    }
}
