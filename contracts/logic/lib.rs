#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
pub mod contract {
    use ink_env::call::FromAccountId;
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
    }
}
