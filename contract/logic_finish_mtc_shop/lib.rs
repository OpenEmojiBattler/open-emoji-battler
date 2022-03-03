#![cfg_attr(not(feature = "std"), no_std)]

use common::{
    codec_types::*,
    mtc::{
        battle::organizer::{battle_all, select_battle_ghost_index},
        ep::MIN_EP,
        finish::{exceeds_grade_and_board_history_limit, get_turn_and_previous_grade_and_board},
        ghost::{build_matchmaking_ghosts, separate_player_ghosts},
        shop::{
            coin::decrease_upgrade_coin, player_operation::verify_player_operations_and_update,
        },
    },
};
use ink_lang as ink;

#[ink::contract]
pub mod contract {
    use super::*;
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
        pub fn finish_mtc_shop(
            &mut self,
            caller: AccountId,
            player_operations: Vec<mtc::shop::PlayerOperation>,
        ) {
            self.only_allowed_caller();

            let mut storage = StorageRef::from_account_id(self.storage_account_id);

            let (
                emo_bases_opt,
                _,
                _,
                player_ep,
                player_seed,
                player_pool,
                player_health,
                player_grade_and_board_history,
                player_upgrade_coin,
                player_ghosts,
                player_ghost_states,
                player_battle_ghost_index,
            ) = storage.get_player_batch(
                caller, true, false, false, true, true, true, true, true, true, true, true, true,
            );

            let emo_bases = emo_bases_opt.expect("emo_bases_opt none");
            let mut health = player_health.expect("player_health none");
            let grade_and_board_history =
                player_grade_and_board_history.expect("player_grade_and_board_history none");
            let mut upgrade_coin = player_upgrade_coin.expect("player_upgrade_coin none");
            let mut ghost_states = player_ghost_states.expect("player_ghost_states none");
            let battle_ghost_index =
                player_battle_ghost_index.expect("player_battle_ghost_index none");

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
                &player_pool.expect("player_pool none"),
                player_seed.expect("player_seed none"),
                turn,
                &emo_bases,
            )
            .expect("invalid shop player operations");

            let new_seed = self.get_random_seed(caller, b"finish_mtc_shop");
            let (ghosts, _ghost_eps) =
                separate_player_ghosts(player_ghosts.expect("player_ghosts none"));

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
                player_ep.expect("player_ep none"),
            );
        }

        fn get_random_seed(&self, caller: AccountId, subject: &[u8]) -> u64 {
            let (seed, _) = self
                .env()
                .random(&self.env().hash_encoded::<Blake2x128, _>(&(subject, caller)));
            <u64>::decode(&mut seed.as_ref()).expect("failed to get seed")
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
            ep: u16,
        ) {
            grade_and_board_history.push(mtc::GradeAndBoard { grade, board });

            let (
                ep_opt,
                health_opt,
                grade_and_board_history_opt,
                upgrade_coin_opt,
                ghost_states_opt,
                battle_ghost_index_opt,
            ) = if let Some(place) = final_place {
                (
                    Some(self.finish_mtc(storage, account_id, place, &grade_and_board_history, ep)),
                    None,
                    None,
                    None,
                    None,
                    None,
                )
            } else {
                let (new_upgrade_coin, new_battle_ghost_index) = finish_battle(
                    upgrade_coin,
                    &ghost_states,
                    battle_ghost_index,
                    new_seed,
                    &grade_and_board_history,
                );
                (
                    None,
                    Some(health),
                    Some(grade_and_board_history),
                    Some(new_upgrade_coin),
                    Some(ghost_states),
                    Some(new_battle_ghost_index),
                )
            };

            storage.set_player_batch(
                account_id,
                ep_opt,
                Some(new_seed),
                None,
                health_opt,
                grade_and_board_history_opt,
                upgrade_coin_opt,
                None,
                ghost_states_opt,
                battle_ghost_index_opt,
            );
        }

        fn finish_mtc(
            &self,
            storage: &mut StorageRef,
            account_id: AccountId,
            place: u8,
            grade_and_board_history: &[mtc::GradeAndBoard],
            ep: u16,
        ) -> u16 {
            let new_ep = calc_new_ep(place, ep);

            let mathchmaking_ghosts_opt = if place < 4 {
                Some(build_matchmaking_ghosts(
                    &account_id,
                    new_ep,
                    grade_and_board_history,
                    &|ep_band| storage.get_matchmaking_ghosts(ep_band),
                ))
            } else {
                None
            };

            storage
                .update_for_logic_finish_mtc_shop_finish_mtc(account_id, mathchmaking_ghosts_opt);

            new_ep
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

fn finish_battle(
    upgrade_coin: Option<u8>,
    ghost_states: &[mtc::GhostState],
    battle_ghost_index: u8,
    new_seed: u64,
    grade_and_board_history: &[mtc::GradeAndBoard],
) -> (Option<u8>, u8) {
    if exceeds_grade_and_board_history_limit(grade_and_board_history) {
        panic!("max turn exceeded");
    }

    let upgrade_coin = decrease_upgrade_coin(upgrade_coin);

    let new_battle_ghost_index =
        select_battle_ghost_index(ghost_states, battle_ghost_index, new_seed)
            .expect("battle ghost selection failed");

    (upgrade_coin, new_battle_ghost_index)
}

fn calc_new_ep(place: u8, old_ep: u16) -> u16 {
    match place {
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
    }
}
