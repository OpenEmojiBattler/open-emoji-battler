#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
pub mod contract {
    use common::{codec_types::*, mtc::emo_bases::check_and_build_emo_bases};
    use ink_env::call::FromAccountId;
    use ink_prelude::vec::Vec as StdVec;
    use storage::contract::Storage;

    #[ink(storage)]
    pub struct Logic {
        storage_account_id: AccountId,
        admin_account_id: AccountId,
    }

    impl Logic {
        #[ink(constructor)]
        pub fn new(storage_account_id: AccountId, admin_account_id: AccountId) -> Self {
            Self {
                storage_account_id,
                admin_account_id,
            }
        }

        #[ink(message)]
        pub fn get_storage_account_id(&self) -> AccountId {
            self.storage_account_id
        }

        #[ink(message)]
        pub fn update_emo_bases(
            &self,
            new_bases: emo::Bases,
            fixed_base_ids: StdVec<u16>,
            built_base_ids: StdVec<u16>,
            force_bases_update: bool,
        ) {
            self.only_admin_caller();

            let mut storage = Storage::from_account_id(self.storage_account_id);

            let bases = check_and_build_emo_bases(
                storage.get_emo_bases(),
                new_bases,
                &fixed_base_ids,
                &built_base_ids,
                force_bases_update,
            )
            .unwrap();

            storage.set_emo_bases(bases);
            storage.set_deck_fixed_emo_base_ids(fixed_base_ids);
            storage.set_deck_built_emo_base_ids(built_base_ids);
        }

        #[ink(message)]
        pub fn start_mtc(&self, caller: AccountId, deck_emo_base_ids: [u16; 6]) {
            let mut storage = Storage::from_account_id(self.storage_account_id);

            if storage.get_player_pool(caller).is_some() {
                self.cleanup_finished(&mut storage, caller);
            }
            // FIXME
            // let seed = get_random_seed();
        }

        #[ink(message)]
        pub fn finish_mtc_shop(&self, player_operations: StdVec<mtc::shop::PlayerOperation>) {
            // FIXME
        }

        fn cleanup_finished(&self, storage: &mut Storage, account: AccountId) {
            storage.take_player_pool(account);
            storage.take_player_health(account);
            storage.take_player_grade_and_board_history(account);
            storage.take_player_upgrade_coin(account);
            storage.take_player_ghosts(account);
            storage.take_player_ghost_states(account);
            storage.take_player_battle_ghost_index(account);
        }

        #[ink(message)]
        pub fn get_admin_account_id(&self) -> AccountId {
            self.admin_account_id.clone()
        }

        fn only_admin_caller(&self) {
            assert!(
                self.admin_account_id == self.env().caller(),
                "only_admin_caller: caller is not admin ({:?})",
                &self.env().caller()
            );
        }
    }
}
