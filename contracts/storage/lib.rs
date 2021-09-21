#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
pub mod contract {
    use ink_prelude::vec::Vec as StdVec;

    #[ink(storage)]
    pub struct Storage {
        value: bool,
        allowed_accounts: StdVec<AccountId>,
    }

    impl Storage {
        #[ink(constructor)]
        pub fn new(value: bool) -> Self {
            let mut allowed_accounts = StdVec::with_capacity(1);
            allowed_accounts.push(Self::env().caller());

            Self {
                value,
                allowed_accounts,
            }
        }

        #[ink(message)]
        pub fn get(&self) -> bool {
            self.value
        }

        #[ink(message)]
        pub fn set(&mut self, new_value: bool) {
            self.only_allowed_caller();
            self.value = new_value;
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

    #[cfg(test)]
    mod tests {
        use super::*;

        use ink_lang as ink;

        #[ink::test]
        fn it_works() {
            let mut storage = Storage::new(false);
            assert_eq!(storage.get(), false);
            storage.set(true);
            assert_eq!(storage.get(), true);
        }
    }
}
