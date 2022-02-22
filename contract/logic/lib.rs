#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
pub mod contract {
    use common::{
        codec_types::*,
        mtc::{
            battle::organizer::{battle_all, select_battle_ghost_index},
            ep::MIN_EP,
            finish::{
                exceeds_grade_and_board_history_limit, get_turn_and_previous_grade_and_board,
            },
            ghost::{build_matchmaking_ghosts, separate_player_ghosts},
            shop::{
                coin::decrease_upgrade_coin, player_operation::verify_player_operations_and_update,
            },
        },
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
        pub fn finish_mtc_shop(
            &mut self,
            caller: AccountId,
            player_operations: Vec<mtc::shop::PlayerOperation>,
        ) {
            self.only_allowed_caller();

            let mut storage = self.get_storage();
            let (
                emo_bases,
                grade_and_board_history,
                mut upgrade_coin,
                player_pool,
                player_seed,
                mut health,
                battle_ghost_index,
                mut ghost_states,
                player_ghosts,
            ) = storage.get_data_for_finish_mtc_shop(caller);

            let (
                turn,
                mtc::GradeAndBoard {
                    mut grade,
                    mut board,
                },
            ) = get_turn_and_previous_grade_and_board(&grade_and_board_history);

            board = verify_player_operations_and_update(
                board,
                &mut grade,
                &mut upgrade_coin,
                &player_operations,
                &player_pool,
                player_seed,
                turn,
                &emo_bases,
            )
            .expect("invalid shop player operations");

            let new_seed = self.get_random_seed(caller, b"finish_mtc_shop");
            let (ghosts, _ghost_eps) = separate_player_ghosts(player_ghosts);

            let final_place = battle_all(
                &board,
                &mut health,
                &mut ghost_states,
                grade,
                &ghosts,
                battle_ghost_index,
                turn,
                new_seed,
                &emo_bases,
            )
            .expect("battle failed");

            self.finish(
                &mut storage,
                caller,
                grade,
                board,
                new_seed,
                upgrade_coin,
                battle_ghost_index,
                health,
                ghost_states,
                grade_and_board_history,
                final_place,
            );
        }

        fn cleanup_finished(&self, storage: &mut StorageRef, account: AccountId) {
            storage.remove_data_for_finish_mtc_shop_cleanup_finished(account);
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

        fn finish(
            &self,
            storage: &mut StorageRef,
            account_id: AccountId,
            grade: u8,
            board: mtc::Board,
            new_seed: u64,
            upgrade_coin: Option<u8>,
            battle_ghost_index: u8,
            health: u8,
            ghost_states: Vec<mtc::GhostState>,
            mut grade_and_board_history: Vec<mtc::GradeAndBoard>,
            final_place: Option<u8>,
        ) {
            grade_and_board_history.push(mtc::GradeAndBoard { grade, board });

            if let Some(place) = final_place {
                self.finish_mtc(storage, account_id, place, &grade_and_board_history);
            } else {
                self.finish_battle(
                    storage,
                    account_id,
                    upgrade_coin,
                    ghost_states,
                    battle_ghost_index,
                    new_seed,
                    health,
                    grade_and_board_history,
                );
            }

            storage.set_player_seed(account_id, new_seed);
        }

        fn finish_mtc(
            &self,
            storage: &mut StorageRef,
            account_id: AccountId,
            place: u8,
            grade_and_board_history: &[mtc::GradeAndBoard],
        ) {
            let ep = self.update_ep(storage, account_id, place);

            if place < 4 {
                self.register_ghost(storage, account_id, ep, grade_and_board_history);
            }

            self.cleanup_finished(storage, account_id);
        }

        fn update_ep(&self, storage: &mut StorageRef, account_id: AccountId, place: u8) -> u16 {
            let old_ep = storage.get_player_ep(account_id).expect("player ep none");

            let new_ep = match place {
                1 => old_ep.saturating_add(80),
                2 => old_ep.saturating_add(40),
                3 => old_ep,
                4 => {
                    let e = old_ep.saturating_sub(40);
                    if e > MIN_EP {
                        e
                    } else {
                        MIN_EP
                    }
                }
                _ => panic!("unsupported place"),
            };

            storage.set_player_ep(account_id, new_ep);
            new_ep
        }

        fn register_ghost(
            &self,
            storage: &mut StorageRef,
            account_id: AccountId,
            ep: u16,
            grade_and_board_history: &[mtc::GradeAndBoard],
        ) {
            let (ep_band, ghosts_with_data) =
                build_matchmaking_ghosts(&account_id, ep, grade_and_board_history, &|ep_band| {
                    storage.get_matchmaking_ghosts(ep_band)
                });

            storage.set_matchmaking_ghosts(ep_band, ghosts_with_data);
        }

        fn finish_battle(
            &self,
            storage: &mut StorageRef,
            account_id: AccountId,
            upgrade_coin: Option<u8>,
            ghost_states: Vec<mtc::GhostState>,
            battle_ghost_index: u8,
            new_seed: u64,
            health: u8,
            grade_and_board_history: Vec<mtc::GradeAndBoard>,
        ) {
            if exceeds_grade_and_board_history_limit(&grade_and_board_history) {
                panic!("max turn exceeded");
            }

            let upgrade_coin = decrease_upgrade_coin(upgrade_coin);

            let new_battle_ghost_index =
                select_battle_ghost_index(&ghost_states, battle_ghost_index, new_seed)
                    .expect("battle ghost selection failed");

            storage.set_data_for_finish_mtc_shop_finish_battle(
                account_id,
                grade_and_board_history,
                health,
                ghost_states,
                new_battle_ghost_index,
            );
            self.update_upgrade_coin(storage, account_id, upgrade_coin);
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
                "allowed accounts: this caller is not allowed",
            );
        }
    }
}
