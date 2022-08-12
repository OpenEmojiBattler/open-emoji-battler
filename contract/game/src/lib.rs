#![cfg_attr(not(feature = "std"), no_std)]

mod functions;

use ink_lang as ink;

#[ink::contract]
pub mod contract {
    use crate::functions::*;
    use common::{codec_types::*, mtc::*};
    use ink_prelude::vec::Vec;
    use ink_storage::{traits::SpreadAllocate, Mapping};
    use scale::Decode;

    #[ink(storage)]
    #[derive(SpreadAllocate)]
    pub struct Contract {
        admins: Vec<AccountId>,

        emo_bases: Option<emo::Bases>,
        deck_fixed_emo_base_ids: Option<Vec<u16>>,
        deck_built_emo_base_ids: Option<Vec<u16>>,

        matchmaking_ghosts: Mapping<u16, Vec<(AccountId, mtc::Ghost)>>,
        leaderboard: Vec<(u16, AccountId)>,

        player_ep: Mapping<AccountId, u16>,
        player_seed: Mapping<AccountId, u64>,

        // remove for each mtc
        player_mtc_immutable: Mapping<AccountId, (Vec<mtc::Emo>, Vec<(AccountId, mtc::Ghost)>)>,
        player_mtc_mutable: Mapping<AccountId, mtc::storage::PlayerMutable>,
    }

    impl Contract {
        #[ink(constructor)]
        pub fn new() -> Self {
            ink_lang::utils::initialize_contract(|contract: &mut Self| {
                contract.admins.push(Self::env().caller());
            })
        }

        #[ink(message)]
        pub fn get_admins(&self) -> Vec<AccountId> {
            self.admins.clone()
        }

        #[ink(message)]
        pub fn add_admin(&mut self, account_id: AccountId) {
            self.assert_admin();
            self.admins.push(account_id);
        }

        #[ink(message)]
        pub fn remove_admin(&mut self, account_id: AccountId) {
            self.assert_admin();
            self.admins.retain(|a| a != &account_id);
        }

        fn assert_admin(&self) -> AccountId {
            let caller = self.env().caller();
            assert!(
                self.admins.contains(&caller),
                "assert_admin: caller is not admin",
            );
            caller
        }

        #[ink(message)]
        pub fn set_code(&mut self, code_hash: [u8; 32]) {
            self.assert_admin();

            ink_env::set_code_hash(&code_hash).unwrap_or_else(|err| {
                panic!(
                    "Failed to `set_code_hash` to {:?} due to {:?}",
                    code_hash, err
                )
            });
        }

        #[ink(message)]
        pub fn update_emo_bases(
            &mut self,
            new_bases: emo::Bases,
            fixed_base_ids: Vec<u16>,
            built_base_ids: Vec<u16>,
            force_bases_update: bool,
        ) {
            self.assert_admin();

            let bases = emo_bases::check_and_build_emo_bases(
                self.emo_bases.clone(),
                new_bases,
                &fixed_base_ids,
                &built_base_ids,
                force_bases_update,
            )
            .expect("update_emo_bases: invalig arg");

            self.emo_bases = Some(bases);
            self.deck_fixed_emo_base_ids = Some(fixed_base_ids);
            self.deck_built_emo_base_ids = Some(built_base_ids);
        }

        #[ink(message)]
        pub fn start_mtc(&mut self, deck_emo_base_ids: [u16; 6]) {
            let caller = self.env().caller();

            let emo_bases = self.emo_bases.clone();
            let deck_fixed_emo_base_ids = self.deck_fixed_emo_base_ids.clone();
            let deck_built_emo_base_ids = self.deck_built_emo_base_ids.clone();
            let player_ep = self.player_ep.get(caller);

            let ep = if self.player_mtc_mutable.contains(caller) {
                // the previous mtc didn't normally finish
                player_ep
                    .expect("player ep none")
                    .saturating_sub(ep::EP_UNFINISH_PENALTY)
            } else {
                player_ep.unwrap_or(ep::INITIAL_EP)
            };

            let seed = self.get_insecure_random_seed(caller, b"start_mtc");

            let selected_ghosts =
                ghost::choose_ghosts(ep, seed, &|ep_band| self.matchmaking_ghosts.get(ep_band));

            if let Some(e) = player_ep {
                if e != ep {
                    self.player_ep.insert(caller, &ep);
                }
            } else {
                self.player_ep.insert(caller, &ep);
            }
            self.player_seed.insert(caller, &seed);
            self.player_mtc_immutable.insert(
                caller,
                &(
                    setup::build_pool(
                        &deck_emo_base_ids,
                        &emo_bases.expect("emo_bases none"),
                        &deck_fixed_emo_base_ids.expect("deck_fixed_emo_base_ids none"),
                        &deck_built_emo_base_ids.expect("deck_built_emo_base_ids none"),
                    )
                    .expect("failed to build player pool"),
                    selected_ghosts,
                ),
            );
            self.player_mtc_mutable.insert(
                caller,
                &mtc::storage::PlayerMutable {
                    health: setup::PLAYER_INITIAL_HEALTH,
                    grade_and_board_history: Vec::new(),
                    upgrade_coin: shop::coin::get_upgrade_coin(2),
                    ghost_states: build_initial_ghost_states(ep),
                    battle_ghost_index: 0,
                },
            );
        }

        #[ink(message)]
        pub fn finish_mtc_shop(&mut self, player_operations: Vec<mtc::shop::PlayerOperation>) {
            let caller = self.env().caller();

            let emo_bases_opt = self.emo_bases.clone();
            let player_ep = self.player_ep.get(caller);
            let player_seed = self.player_seed.get(caller);
            let (player_pool, player_ghosts) = self
                .player_mtc_immutable
                .get(caller)
                .expect("player_mtc_immutable none");
            let player_mtc_mutable = self
                .player_mtc_mutable
                .get(caller)
                .expect("player_mtc_mutable none");

            let emo_bases = emo_bases_opt.expect("emo_bases_opt none");
            let mut health = player_mtc_mutable.health;
            let mut upgrade_coin = player_mtc_mutable.upgrade_coin;
            let mut ghost_states = player_mtc_mutable.ghost_states;

            let (
                turn,
                mtc::GradeAndBoard {
                    mut grade,
                    mut board,
                },
            ) = finish::get_turn_and_previous_grade_and_board(
                &player_mtc_mutable.grade_and_board_history,
            );

            board = shop::player_operation::verify_player_operations_and_update(
                board,
                &mut grade,
                &mut upgrade_coin,
                &player_operations,
                &player_pool,
                player_seed.expect("player_seed none"),
                turn,
                &emo_bases,
            )
            .expect("invalid shop player operations");

            let new_seed = self.get_insecure_random_seed(caller, b"finish_mtc_shop");
            let ghosts = player_ghosts
                .into_iter()
                .map(|(_, ghost)| ghost)
                .collect::<Vec<_>>();

            let final_place = battle::organizer::battle_all(
                &board,
                &mut health,
                &mut ghost_states,
                grade,
                &ghosts,
                player_mtc_mutable.battle_ghost_index,
                turn,
                new_seed,
                &emo_bases,
            )
            .expect("battle failed");

            self.finish(
                caller,
                grade,
                board,
                new_seed,
                upgrade_coin,
                player_mtc_mutable.battle_ghost_index,
                health,
                ghost_states,
                player_mtc_mutable.grade_and_board_history,
                final_place,
                player_ep.expect("player_ep none"),
            );
        }

        fn get_insecure_random_seed(&self, caller: AccountId, subject: &[u8]) -> u64 {
            let (seed, _) = self.env().random(
                &self
                    .env()
                    .hash_encoded::<ink_env::hash::Blake2x128, _>(&(subject, caller)),
            );
            <u64>::decode(&mut seed.as_ref()).expect("failed to get seed")
        }

        fn finish(
            &mut self,
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

            if let Some(place) = final_place {
                let (new_ep, matchmaking_ghosts_opt) =
                    self.finish_mtc(account_id, place, &grade_and_board_history, ep);

                self.player_ep.insert(account_id, &new_ep);
                self.player_seed.insert(account_id, &new_seed);

                if let Some((ep_band, g)) = matchmaking_ghosts_opt {
                    self.matchmaking_ghosts.insert(ep_band, &g);
                }

                update_leaderboard(&mut self.leaderboard, new_ep, &account_id);

                self.remove_player_mtc(account_id);
            } else {
                let (new_upgrade_coin, new_battle_ghost_index) = finish_battle(
                    upgrade_coin,
                    &ghost_states,
                    battle_ghost_index,
                    new_seed,
                    &grade_and_board_history,
                );
                self.player_seed.insert(account_id, &new_seed);
                self.player_mtc_mutable.insert(
                    account_id,
                    &mtc::storage::PlayerMutable {
                        health,
                        grade_and_board_history,
                        upgrade_coin: new_upgrade_coin,
                        ghost_states,
                        battle_ghost_index: new_battle_ghost_index,
                    },
                );
            }
        }

        fn finish_mtc(
            &self,
            account_id: AccountId,
            place: u8,
            grade_and_board_history: &[mtc::GradeAndBoard],
            ep: u16,
        ) -> (u16, Option<(u16, Vec<(AccountId, mtc::Ghost)>)>) {
            let new_ep = calc_new_ep(place, ep);

            let matchmaking_ghosts_opt =
                if grade_and_board_history.last().unwrap().board.0.is_empty() {
                    None
                } else {
                    Some(ghost::build_matchmaking_ghosts(
                        &account_id,
                        ep,
                        grade_and_board_history,
                        &|ep_band| self.matchmaking_ghosts.get(ep_band),
                    ))
                };

            (new_ep, matchmaking_ghosts_opt)
        }

        #[ink(message)]
        pub fn get_emo_bases(&self) -> Option<emo::Bases> {
            self.emo_bases.clone()
        }

        #[ink(message)]
        pub fn get_deck_fixed_emo_base_ids(&self) -> Option<Vec<u16>> {
            self.deck_fixed_emo_base_ids.clone()
        }

        #[ink(message)]
        pub fn get_deck_built_emo_base_ids(&self) -> Option<Vec<u16>> {
            self.deck_built_emo_base_ids.clone()
        }

        #[ink(message)]
        pub fn get_matchmaking_ghosts(&self, ep_band: u16) -> Option<Vec<(AccountId, mtc::Ghost)>> {
            self.matchmaking_ghosts.get(ep_band)
        }

        #[ink(message)]
        pub fn get_leaderboard(&self) -> Vec<(u16, AccountId)> {
            self.leaderboard.clone()
        }

        #[ink(message)]
        pub fn get_player_ep(&self, account: AccountId) -> Option<u16> {
            self.player_ep.get(account)
        }

        #[ink(message)]
        pub fn get_player_seed(&self, account: AccountId) -> Option<u64> {
            self.player_seed.get(account)
        }

        #[ink(message)]
        pub fn get_player_mtc_immutable(
            &self,
            account: AccountId,
        ) -> Option<(Vec<mtc::Emo>, Vec<(AccountId, mtc::Ghost)>)> {
            self.player_mtc_immutable.get(&account)
        }

        #[ink(message)]
        pub fn get_player_mtc_mutable(
            &self,
            account: AccountId,
        ) -> Option<mtc::storage::PlayerMutable> {
            self.player_mtc_mutable.get(&account)
        }

        fn remove_player_mtc(&mut self, account: AccountId) {
            self.player_mtc_immutable.remove(&account);
            self.player_mtc_mutable.remove(&account);
        }
    }
}
