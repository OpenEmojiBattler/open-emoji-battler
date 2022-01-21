#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
pub mod contract {
    use common::{
        codec_types::*,
        mtc::{
            battle::organizer::{battle_all, select_battle_ghost_index},
            emo_bases::check_and_build_emo_bases,
            ep::{EP_UNFINISH_PENALTY, INITIAL_EP, MIN_EP},
            finish::{
                exceeds_grade_and_board_history_limit, get_turn_and_previous_grade_and_board,
            },
            ghost::{build_matchmaking_ghosts, choose_ghosts, separate_player_ghosts},
            setup::{build_initial_ghost_states, build_pool, PLAYER_INITIAL_HEALTH},
            shop::{
                coin::{decrease_upgrade_coin, get_upgrade_coin},
                player_operation::verify_player_operations_and_update,
            },
        },
    };
    use ink_env::call::FromAccountId;
    use ink_prelude::vec as std_vec;
    use ink_prelude::vec::Vec as StdVec;
    use scale::{Decode, Encode};
    use storage::contract::StorageRef;

    #[ink(storage)]
    pub struct Logic {
        storage_account_id: AccountId,
        allowed_accounts: StdVec<AccountId>,
        root_account_id: AccountId,
    }

    impl Logic {
        #[ink(constructor)]
        pub fn new(storage_account_id: AccountId) -> Self {
            let caller = Self::env().caller();
            Self {
                storage_account_id,
                allowed_accounts: std_vec![caller],
                root_account_id: caller,
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
        pub fn get_root_account_id(&self) -> AccountId {
            self.root_account_id
        }

        #[ink(message)]
        pub fn set_root_account_id(&mut self, new_root_account_id: AccountId) {
            self.only_root_caller();
            self.root_account_id = new_root_account_id;
        }

        fn only_root_caller(&self) {
            assert_eq!(
                self.root_account_id,
                self.env().caller(),
                "set_root_account_id: not allowed"
            );
        }

        #[ink(message)]
        pub fn update_emo_bases(
            &mut self,
            new_bases: emo::Bases,
            fixed_base_ids: StdVec<u16>,
            built_base_ids: StdVec<u16>,
            force_bases_update: bool,
        ) {
            self.only_root_caller();

            let mut storage = self.get_storage();

            let bases = check_and_build_emo_bases(
                storage.get_emo_bases(),
                new_bases,
                &fixed_base_ids,
                &built_base_ids,
                force_bases_update,
            )
            .expect("update_emo_bases: invalig arg");

            storage.set_emo_bases(bases);
            storage.set_deck_fixed_emo_base_ids(fixed_base_ids);
            storage.set_deck_built_emo_base_ids(built_base_ids);
        }

        #[ink(message)]
        pub fn start_mtc(&mut self, caller: AccountId, deck_emo_base_ids: [u16; 6]) {
            self.only_allowed_caller();

            let mut storage = self.get_storage();

            if storage.get_player_pool(caller).is_some() {
                self.cleanup_finished(&mut storage, caller);
                let ep = storage.get_player_ep(caller).expect("player ep none");
                storage.set_player_ep(caller, ep.saturating_sub(EP_UNFINISH_PENALTY));
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
            &mut self,
            caller: AccountId,
            player_operations: StdVec<mtc::shop::PlayerOperation>,
        ) {
            self.only_allowed_caller();

            let mut storage = self.get_storage();

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
            let (ghosts, _ghost_eps) = separate_player_ghosts(
                storage
                    .get_player_ghosts(caller)
                    .expect("player_ghosts none"),
            );

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
            let ep = storage.get_player_ep(account_id).unwrap_or_else(|| {
                storage.set_player_ep(account_id, INITIAL_EP);
                INITIAL_EP
            });

            let selected =
                choose_ghosts(ep, seed, &|ep_band| storage.get_matchmaking_ghosts(ep_band));

            storage.set_player_ghosts(account_id, selected);
            storage.set_player_ghost_states(account_id, build_initial_ghost_states());
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
            mut grade_and_board_history: StdVec<mtc::GradeAndBoard>,
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
                _ => panic!("unsupported place: {:?}", place),
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
            ghost_states: StdVec<mtc::GhostState>,
            battle_ghost_index: u8,
            new_seed: u64,
            health: u8,
            grade_and_board_history: StdVec<mtc::GradeAndBoard>,
        ) {
            if exceeds_grade_and_board_history_limit(&grade_and_board_history) {
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
