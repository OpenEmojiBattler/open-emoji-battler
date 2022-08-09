#![cfg_attr(not(feature = "std"), no_std)]

use common::{codec_types::*, mtc::*};
use ink_lang as ink;

#[ink::contract]
pub mod contract {
    use super::*;
    use ink_env::hash::Blake2x128;
    use ink_prelude::vec::Vec;
    use ink_storage::{traits::SpreadAllocate, Mapping};
    use scale::Decode;

    #[ink(storage)]
    #[derive(SpreadAllocate)]
    pub struct Contract {
        // allowed accounts
        allowed_accounts: Vec<AccountId>,

        emo_bases: Option<emo::Bases>,
        deck_fixed_emo_base_ids: Option<Vec<u16>>,
        deck_built_emo_base_ids: Option<Vec<u16>>,

        matchmaking_ghosts: Mapping<u16, Vec<(AccountId, u16, mtc::Ghost)>>,

        player_ep: Mapping<AccountId, u16>,
        player_seed: Mapping<AccountId, u64>,

        // remove for each mtc
        player_pool: Mapping<AccountId, Vec<mtc::Emo>>,
        player_health: Mapping<AccountId, u8>,
        player_grade_and_board_history: Mapping<AccountId, Vec<mtc::GradeAndBoard>>,
        player_upgrade_coin: Mapping<AccountId, Option<u8>>,
        player_ghosts: Mapping<AccountId, Vec<(AccountId, u16, mtc::Ghost)>>,
        player_ghost_states: Mapping<AccountId, Vec<mtc::GhostState>>,
        player_battle_ghost_index: Mapping<AccountId, u8>,
    }

    impl Contract {
        #[ink(constructor)]
        pub fn new() -> Self {
            ink_lang::utils::initialize_contract(|contract: &mut Self| {
                contract.allowed_accounts.push(Self::env().caller());
            })
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

        #[ink(message)]
        pub fn set_code(&mut self, code_hash: [u8; 32]) {
            self.only_allowed_caller();

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
            self.only_allowed_caller();

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
            let player_health = self.player_health.get(caller);

            let ep = if player_health.is_some() {
                // the previous mtc didn't normally finish
                player_ep
                    .expect("player ep none")
                    .saturating_sub(ep::EP_UNFINISH_PENALTY)
            } else {
                player_ep.unwrap_or(ep::INITIAL_EP)
            };

            let seed = self.get_random_seed(caller, b"start_mtc");

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
            self.player_pool.insert(
                caller,
                &setup::build_pool(
                    &deck_emo_base_ids,
                    &emo_bases.expect("emo_bases none"),
                    &deck_fixed_emo_base_ids.expect("deck_fixed_emo_base_ids none"),
                    &deck_built_emo_base_ids.expect("deck_built_emo_base_ids none"),
                )
                .expect("failed to build player pool"),
            );
            self.player_health
                .insert(caller, &setup::PLAYER_INITIAL_HEALTH);
            self.player_grade_and_board_history
                .insert(caller, &Vec::<mtc::GradeAndBoard>::new());
            self.player_upgrade_coin
                .insert(caller, &shop::coin::get_upgrade_coin(2));
            self.player_ghosts.insert(caller, &selected_ghosts);
            self.player_ghost_states
                .insert(caller, &setup::build_initial_ghost_states());
            self.player_battle_ghost_index.insert(caller, &0);
        }

        #[ink(message)]
        pub fn finish_mtc_shop(&mut self, player_operations: Vec<mtc::shop::PlayerOperation>) {
            let caller = self.env().caller();

            let emo_bases_opt = self.emo_bases.clone();
            let player_ep = self.player_ep.get(caller);
            let player_seed = self.player_seed.get(caller);
            let player_pool = self.player_pool.get(caller);
            let player_health = self.player_health.get(caller);
            let player_grade_and_board_history = self.player_grade_and_board_history.get(caller);
            let player_upgrade_coin = self.player_upgrade_coin.get(caller);
            let player_ghosts = self.player_ghosts.get(caller);
            let player_ghost_states = self.player_ghost_states.get(caller);
            let player_battle_ghost_index = self.player_battle_ghost_index.get(caller);

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
            ) = finish::get_turn_and_previous_grade_and_board(&grade_and_board_history);

            board = shop::player_operation::verify_player_operations_and_update(
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
                ghost::separate_player_ghosts(player_ghosts.expect("player_ghosts none"));

            let final_place = battle::organizer::battle_all(
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
                self.player_health.insert(account_id, &health);
                self.player_grade_and_board_history
                    .insert(account_id, &grade_and_board_history);
                self.player_upgrade_coin
                    .insert(account_id, &new_upgrade_coin);
                self.player_ghost_states.insert(account_id, &ghost_states);
                self.player_battle_ghost_index
                    .insert(account_id, &new_battle_ghost_index);
            }
        }

        fn finish_mtc(
            &self,
            account_id: AccountId,
            place: u8,
            grade_and_board_history: &[mtc::GradeAndBoard],
            ep: u16,
        ) -> (u16, Option<(u16, Vec<(AccountId, u16, mtc::Ghost)>)>) {
            let new_ep = calc_new_ep(place, ep);

            let matchmaking_ghosts_opt = if place < 4 {
                Some(ghost::build_matchmaking_ghosts(
                    &account_id,
                    new_ep,
                    grade_and_board_history,
                    &|ep_band| self.matchmaking_ghosts.get(ep_band),
                ))
            } else {
                None
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
        pub fn get_matchmaking_ghosts(
            &self,
            ep_band: u16,
        ) -> Option<Vec<(AccountId, u16, mtc::Ghost)>> {
            self.matchmaking_ghosts.get(ep_band)
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
        pub fn get_player_pool(&self, account: AccountId) -> Option<Vec<mtc::Emo>> {
            self.player_pool.get(&account)
        }

        #[ink(message)]
        pub fn get_player_health(&self, account: AccountId) -> Option<u8> {
            self.player_health.get(&account)
        }

        #[ink(message)]
        pub fn get_player_grade_and_board_history(
            &self,
            account: AccountId,
        ) -> Option<Vec<mtc::GradeAndBoard>> {
            self.player_grade_and_board_history.get(&account)
        }

        #[ink(message)]
        pub fn get_player_upgrade_coin(&self, account: AccountId) -> Option<Option<u8>> {
            self.player_upgrade_coin.get(&account)
        }

        #[ink(message)]
        pub fn get_player_ghosts(
            &self,
            account: AccountId,
        ) -> Option<Vec<(AccountId, u16, mtc::Ghost)>> {
            self.player_ghosts.get(&account)
        }

        #[ink(message)]
        pub fn get_player_ghost_states(&self, account: AccountId) -> Option<Vec<mtc::GhostState>> {
            self.player_ghost_states.get(&account)
        }

        #[ink(message)]
        pub fn get_player_battle_ghost_index(&self, account: AccountId) -> Option<u8> {
            self.player_battle_ghost_index.get(&account)
        }

        fn remove_player_mtc(&mut self, account: AccountId) {
            self.player_pool.remove(&account);
            self.player_health.remove(&account);
            self.player_grade_and_board_history.remove(&account);
            self.player_upgrade_coin.remove(&account);
            self.player_ghosts.remove(&account);
            self.player_ghost_states.remove(&account);
            self.player_battle_ghost_index.remove(&account);
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
    if finish::exceeds_grade_and_board_history_limit(grade_and_board_history) {
        panic!("max turn exceeded");
    }

    let upgrade_coin = shop::coin::decrease_upgrade_coin(upgrade_coin);

    let new_battle_ghost_index =
        battle::organizer::select_battle_ghost_index(ghost_states, battle_ghost_index, new_seed)
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
            if e > ep::MIN_EP {
                e
            } else {
                ep::MIN_EP
            }
        }
        _ => panic!("unsupported place"),
    }
}