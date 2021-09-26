#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
pub mod contract {
    use common::codec_types::*;
    use ink_env::call::FromAccountId;
    use ink_prelude::vec::Vec as StdVec;
    use storage::contract::Storage;

    #[ink(storage)]
    pub struct Logic {
        storage_account_id: AccountId,
    }

    impl Logic {
        #[ink(constructor)]
        pub fn new(storage_account_id: AccountId) -> Self {
            Self { storage_account_id }
        }

        #[ink(message)]
        pub fn get_storage_account_id(&self) -> AccountId {
            self.storage_account_id
        }

        #[ink(message)]
        pub fn do_something(&self) {
            let mut storage = Storage::from_account_id(self.storage_account_id);
            storage.set(true);
        }

        #[ink(message)]
        pub fn update_emo_bases(
            &self,
            new_bases: emo::Bases,
            fixed_base_ids: StdVec<u16>,
            built_base_ids: StdVec<u16>,
            force_bases_update: bool,
        ) {
            // FIXME
        }
    }
}
