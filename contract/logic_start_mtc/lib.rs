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
            Self {
                storage_account_id,
                allowed_accounts: vec![Self::env().caller()],
            }
        }

        #[ink(message)]
        pub fn start_mtc(&mut self, caller: AccountId, deck_emo_base_ids: [u16; 6]) {
            self.only_allowed_caller();

            let mut storage = StorageRef::from_account_id(self.storage_account_id);

            let (
                emo_bases,
                deck_fixed_emo_base_ids,
                deck_built_emo_base_ids,
                player_ep,
                _,
                _,
                player_health,
                ..,
            ) = storage.get_player_batch(
                caller, true, true, true, true, false, false, true, false, false, false, false,
                false,
            );

            let ep = if player_health.is_some() {
                // the previous mtc didn't normally finish
                player_ep
                    .expect("player ep none")
                    .saturating_sub(EP_UNFINISH_PENALTY)
            } else {
                player_ep.unwrap_or(INITIAL_EP)
            };

            let seed = self.get_random_seed(caller, b"start_mtc");

            let selected_ghosts =
                choose_ghosts(ep, seed, &|ep_band| storage.get_matchmaking_ghosts(ep_band));

            storage.set_player_batch(
                caller,
                if let Some(e) = player_ep {
                    if e == ep {
                        None
                    } else {
                        Some(ep)
                    }
                } else {
                    Some(ep)
                },
                Some(seed),
                Some(
                    build_pool(
                        &deck_emo_base_ids,
                        &emo_bases.expect("emo_bases none"),
                        &deck_fixed_emo_base_ids.expect("deck_fixed_emo_base_ids none"),
                        &deck_built_emo_base_ids.expect("deck_built_emo_base_ids none"),
                    )
                    .expect("failed to build player pool"),
                ),
                Some(PLAYER_INITIAL_HEALTH),
                Some(Vec::new()),
                Some(get_upgrade_coin(2)),
                Some(selected_ghosts),
                Some(build_initial_ghost_states()),
                Some(0),
            );
        }

        fn get_random_seed(&self, caller: AccountId, subject: &[u8]) -> u64 {
            let (seed, _) = self
                .env()
                .random(&self.env().hash_encoded::<Blake2x128, _>(&(subject, caller)));
            <u64>::decode(&mut seed.as_ref()).expect("failed to get seed")
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
