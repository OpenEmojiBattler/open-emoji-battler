#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod contract {
    use ink_env::call::FromAccountId;
    use ink_prelude::vec::Vec as StdVec;
    use logic::contract::Logic;

    #[ink(storage)]
    pub struct Forwarder {
        logic_account_id: AccountId,
        allowed_accounts: StdVec<AccountId>,
    }

    impl Forwarder {
        #[ink(constructor)]
        pub fn new(logic_account_id: AccountId) -> Self {
            let mut allowed_accounts = StdVec::with_capacity(1);
            allowed_accounts.push(Self::env().caller());

            Self {
                logic_account_id,
                allowed_accounts,
            }
        }

        #[ink(message)]
        pub fn do_something(&self) {
            let logic = Logic::from_account_id(self.logic_account_id);
            logic.do_something();
        }

        #[ink(message)]
        pub fn get_logic_account_id(&self) -> AccountId {
            self.logic_account_id
        }

        #[ink(message)]
        pub fn change_logic_account_id(&mut self, new_account_id: AccountId) {
            self.only_allowed_caller();
            self.logic_account_id = new_account_id;
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
