#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
pub mod contract {
    use common::codec_types::*;
    use common::mtc::{
        battle::organizer::{battle_all, select_battle_ghost_index},
        emo_bases::check_and_build_emo_bases,
        setup::build_pool,
        shop::{
            coin::{decrease_upgrade_coin, get_upgrade_coin},
            player_operation::verify_player_operations_and_update,
        },
        utils::{get_turn_and_previous_grade_and_board, PLAYER_INITIAL_HEALTH},
    };
    use ink_env::call::FromAccountId;
    use ink_prelude::vec::Vec as StdVec;
    use scale::{Decode, Encode};
    use storage::contract::StorageRef;

    #[ink(storage)]
    pub struct Logic {
        storage_account_id: AccountId,
        admin_account_id: AccountId,
    }

    impl Logic {
        #[ink(constructor)]
        pub fn new(storage_account_id: AccountId) -> Self {
            Self {
                storage_account_id,
                admin_account_id: Self::env().caller(),
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

            let mut storage: StorageRef = FromAccountId::from_account_id(self.storage_account_id);

            let bases = check_and_build_emo_bases(
                storage.get_emo_bases(),
                new_bases,
                &fixed_base_ids,
                &built_base_ids,
                force_bases_update,
            )
            .expect("invalig arg");

            storage.set_emo_bases(bases);
            storage.set_deck_fixed_emo_base_ids(fixed_base_ids);
            storage.set_deck_built_emo_base_ids(built_base_ids);
        }

        #[ink(message)]
        pub fn start_mtc(&self, caller: AccountId, deck_emo_base_ids: [u16; 6]) {
            let mut storage: StorageRef = FromAccountId::from_account_id(self.storage_account_id);

            if storage.get_player_pool(caller).is_some() {
                self.cleanup_finished(&mut storage, caller);
                // FIXME: EP
            }

            let seed = self.get_random_seed(caller, b"start_mtc");

            storage.set_player_health(caller, PLAYER_INITIAL_HEALTH);
            storage.set_player_seed(caller, seed);
            storage.set_player_pool(
                caller,
                build_pool(
                    &deck_emo_base_ids,
                    &storage.get_emo_bases(),
                    &storage.get_deck_fixed_emo_base_ids(),
                    &storage.get_deck_built_emo_base_ids(),
                )
                .expect("failed to build player pool"),
            );
            storage.set_player_grade_and_board_history(caller, StdVec::new());
            storage.set_player_battle_ghost_index(caller, 0);
            self.update_upgrade_coin(&mut storage, caller, get_upgrade_coin(2));

            self.matchmake(caller, &mut storage, seed)
        }

        #[ink(message)]
        pub fn finish_mtc_shop(
            &self,
            caller: AccountId,
            player_operations: StdVec<mtc::shop::PlayerOperation>,
        ) {
            let mut storage: StorageRef = FromAccountId::from_account_id(self.storage_account_id);

            let emo_bases = storage.get_emo_bases();
            let grade_and_board_history = storage
                .get_player_grade_and_board_history(caller)
                .expect("player_grade_and_board_history none");
            let mut upgrade_coin = storage.get_player_upgrade_coin(caller);

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
                &storage.get_player_pool(caller).expect("player_pool none"),
                storage.get_player_seed(caller).expect("player_seed none"),
                turn,
                &emo_bases,
            )
            .expect("invalid shop player operations");

            let mut health = storage
                .get_player_health(caller)
                .expect("player_health none");
            let battle_ghost_index = storage
                .get_player_battle_ghost_index(caller)
                .expect("battle_ghost_index none");
            let mut ghost_states = storage
                .get_player_ghost_states(caller)
                .expect("ghost_states none");

            let new_seed = self.get_random_seed(caller, b"finish_mtc_shop");

            let ghosts = storage
                .get_player_ghosts(caller)
                .expect("player_ghosts none")
                .into_iter()
                .map(|(_, ghost)| ghost)
                .collect::<StdVec<_>>(); // FIXME: EP

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
                // &ghost_eps,
                grade_and_board_history,
                final_place,
            );
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
            let (seed, _) = self.env().random(&(subject, caller).encode());
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
            // TODO
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
            ghost_states: StdVec<mtc::GhostState>,
            // ghost_eps: &[u16],
            mut grade_and_board_history: StdVec<mtc::GradeAndBoard>,
            final_place: Option<u8>,
        ) {
            grade_and_board_history.push(mtc::GradeAndBoard { grade, board });

            if let Some(place) = final_place {
                self.finish_mtc(
                    storage,
                    account_id,
                    place,
                    &ghost_states,
                    // ghost_eps,
                    &grade_and_board_history,
                );
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
            ghost_states: &[mtc::GhostState],
            // ghost_eps: &[u16],
            grade_and_board_history: &[mtc::GradeAndBoard],
        ) {
            // let ep = Self::_update_ep(account_id, place, ghost_states, ghost_eps)?;

            if place < 4 {
                // Self::_register_ghost(account_id, ep, grade_and_board_history);
            }

            self.cleanup_finished(storage, account_id);
        }

        fn finish_battle(
            &self,
            storage: &mut StorageRef,
            account_id: AccountId,
            upgrade_coin: Option<u8>,
            ghost_states: StdVec<mtc::GhostState>,
            battle_ghost_index: u8,
            new_seed: u64,
            health: u8,
            grade_and_board_history: StdVec<mtc::GradeAndBoard>,
        ) {
            if grade_and_board_history.len() > 30 {
                panic!("max turn exceeded");
            }

            let upgrade_coin = decrease_upgrade_coin(upgrade_coin);

            let new_battle_ghost_index =
                select_battle_ghost_index(&ghost_states, battle_ghost_index, new_seed)
                    .expect("battle ghost selection failed");

            storage.set_player_grade_and_board_history(account_id, grade_and_board_history);
            storage.set_player_health(account_id, health);
            storage.set_player_ghost_states(account_id, ghost_states);
            storage.set_player_battle_ghost_index(account_id, new_battle_ghost_index);
            self.update_upgrade_coin(storage, account_id, upgrade_coin);
        }

        #[ink(message)]
        pub fn get_admin_account_id(&self) -> AccountId {
            self.admin_account_id
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
