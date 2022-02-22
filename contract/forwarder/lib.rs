#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod contract {
    use common::codec_types::*;
    use ink_env::call::FromAccountId;
    use ink_prelude::{vec, vec::Vec};

    #[ink(storage)]
    pub struct Forwarder {
        logic_start_mtc_account_id: AccountId,
        logic_finish_mtc_shop_account_id: AccountId,
        allowed_accounts: Vec<AccountId>,
    }

    impl Forwarder {
        #[ink(constructor)]
        pub fn new(
            logic_start_mtc_account_id: AccountId,
            logic_finish_mtc_shop_account_id: AccountId,
        ) -> Self {
            Self {
                logic_start_mtc_account_id,
                logic_finish_mtc_shop_account_id,
                allowed_accounts: vec![Self::env().caller()],
            }
        }

        #[ink(message)]
        pub fn start_mtc(&mut self, deck_emo_base_ids: [u16; 6]) {
            logic_start_mtc::contract::LogicRef::from_account_id(self.logic_start_mtc_account_id)
                .start_mtc(self.env().caller(), deck_emo_base_ids);
        }

        #[ink(message)]
        pub fn finish_mtc_shop(&mut self, player_operations: Vec<mtc::shop::PlayerOperation>) {
            logic_finish_mtc_shop::contract::LogicRef::from_account_id(
                self.logic_finish_mtc_shop_account_id,
            )
            .finish_mtc_shop(self.env().caller(), player_operations);
        }

        #[ink(message)]
        pub fn get_logic_account_ids(&self) -> (AccountId, AccountId) {
            (
                self.logic_start_mtc_account_id,
                self.logic_finish_mtc_shop_account_id,
            )
        }

        #[ink(message)]
        pub fn change_logic_account_id(
            &mut self,
            logic_start_mtc_account_id: AccountId,
            logic_finish_mtc_shop_account_id: AccountId,
        ) {
            self.only_allowed_caller();

            self.logic_start_mtc_account_id = logic_start_mtc_account_id;
            self.logic_finish_mtc_shop_account_id = logic_finish_mtc_shop_account_id;
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
