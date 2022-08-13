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

    type Ghosts = Vec<(AccountId, mtc::Ghost)>;
    type PlayerImmutable = (Vec<mtc::Emo>, Ghosts); // (pool, ghosts)

    #[ink(storage)]
    #[derive(SpreadAllocate)]
    pub struct Contract {
        admins: Vec<AccountId>,

        emo_bases: Option<emo::Bases>,
        deck_fixed_emo_base_ids: Option<Vec<u16>>,
        deck_built_emo_base_ids: Option<Vec<u16>>,

        matchmaking_ghosts: Mapping<u16, Ghosts>,
        leaderboard: Vec<(u16, AccountId)>,

        player_ep: Mapping<AccountId, u16>,
        player_seed: Mapping<AccountId, u64>,

        // remove on each mtc
        player_mtc_immutable: Mapping<AccountId, PlayerImmutable>,
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
        pub fn get_matchmaking_ghosts(&self, ep_band: u16) -> Option<Ghosts> {
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
        pub fn get_player_mtc_immutable(&self, account: AccountId) -> Option<PlayerImmutable> {
            self.player_mtc_immutable.get(&account)
        }

        #[ink(message)]
        pub fn get_player_mtc_mutable(
            &self,
            account: AccountId,
        ) -> Option<mtc::storage::PlayerMutable> {
            self.player_mtc_mutable.get(&account)
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
            let player = self.env().caller();
            let seed = self.get_insecure_random_seed(player, b"start_mtc");

            let ep = self.create_or_update_player_ep(player);

            self.player_seed.insert(player, &seed);

            self.player_mtc_immutable.insert(
                player,
                &(
                    setup::build_pool(
                        &deck_emo_base_ids,
                        self.emo_bases.as_ref().expect("emo_bases none"),
                        self.deck_fixed_emo_base_ids
                            .as_ref()
                            .expect("deck_fixed_emo_base_ids none"),
                        self.deck_fixed_emo_base_ids
                            .as_ref()
                            .expect("deck_built_emo_base_ids none"),
                    )
                    .expect("failed to build player pool"),
                    ghost::choose_ghosts(ep, seed, &|ep_band| self.matchmaking_ghosts.get(ep_band)),
                ),
            );

            self.player_mtc_mutable.insert(
                player,
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
            let player = self.env().caller();

            let emo_bases = self.emo_bases.as_ref().expect("emo_bases none");

            let (player_pool, player_ghosts) = self
                .player_mtc_immutable
                .get(player)
                .expect("player_mtc_immutable none");
            let mut player_mtc_mutable = self
                .player_mtc_mutable
                .get(player)
                .expect("player_mtc_mutable none");

            let (turn, mut grade, mut board) =
                get_turn_and_previous_grade_and_board(&player_mtc_mutable.grade_and_board_history);

            board = shop::player_operation::verify_player_operations_and_update(
                board,
                &mut grade,
                &mut player_mtc_mutable.upgrade_coin,
                &player_operations,
                &player_pool,
                self.player_seed.get(player).expect("player_seed none"),
                turn,
                emo_bases,
            )
            .expect("invalid shop player operations");

            let new_seed = self.get_insecure_random_seed(player, b"finish_mtc_shop");

            let final_place = battle::organizer::battle_all(
                &board,
                &mut player_mtc_mutable.health,
                &mut player_mtc_mutable.ghost_states,
                grade,
                &player_ghosts
                    .into_iter()
                    .map(|(_, ghost)| ghost)
                    .collect::<Vec<_>>(),
                player_mtc_mutable.battle_ghost_index,
                turn,
                new_seed,
                emo_bases,
            )
            .expect("battle failed");

            self.update_for_finish_mtc_shop(
                player,
                grade,
                board,
                new_seed,
                player_mtc_mutable,
                final_place,
            );
        }
    }

    #[ink(impl)]
    impl Contract {
        fn assert_admin(&self) -> AccountId {
            let caller = self.env().caller();
            assert!(
                self.admins.contains(&caller),
                "assert_admin: caller is not admin",
            );
            caller
        }

        // enough for this game
        fn get_insecure_random_seed(&self, account_id: AccountId, subject: &[u8]) -> u64 {
            assert!(
                self.env().caller_is_origin(),
                "contracts aren't supported yet"
            );

            let (seed, _) =
                self.env()
                    .random(&self.env().hash_encoded::<ink_env::hash::Blake2x128, _>(&(
                        subject,
                        account_id,
                        self.env().block_timestamp(),
                    )));

            <u64>::decode(&mut seed.as_ref()).expect("failed to get seed")
        }

        fn create_or_update_player_ep(&mut self, player: AccountId) -> u16 {
            let new_ep = if let Some(old_ep) = self.player_ep.get(player) {
                if self.player_mtc_mutable.contains(player) {
                    ep::reduce_ep(old_ep, ep::EP_UNFINISH_PENALTY)
                } else {
                    return old_ep;
                }
            } else {
                ep::INITIAL_EP
            };

            self.player_ep.insert(player, &new_ep);

            new_ep
        }

        fn update_for_finish_mtc_shop(
            &mut self,
            player: AccountId,
            grade: u8,
            board: mtc::Board,
            new_seed: u64,
            mut player_mtc_mutable: mtc::storage::PlayerMutable,
            final_place: Option<u8>,
        ) {
            player_mtc_mutable
                .grade_and_board_history
                .push(mtc::GradeAndBoard { grade, board });

            if let Some(place) = final_place {
                self.finish_mtc(player, place, &player_mtc_mutable.grade_and_board_history);
            } else {
                self.finish_mtc_turn(player, player_mtc_mutable, new_seed);
            }

            self.player_seed.insert(player, &new_seed);
        }

        fn finish_mtc(
            &mut self,
            player: AccountId,
            place: u8,
            grade_and_board_history: &[mtc::GradeAndBoard],
        ) {
            let old_ep = self.player_ep.get(player).expect("player_ep none");
            let new_ep = calc_new_ep(place, old_ep);
            update_leaderboard(&mut self.leaderboard, new_ep, &player);
            self.player_ep.insert(player, &new_ep);

            if !grade_and_board_history.last().unwrap().board.0.is_empty() {
                let (ep_band, g) = ghost::build_matchmaking_ghosts(
                    &player,
                    old_ep,
                    grade_and_board_history,
                    &|ep_band| self.matchmaking_ghosts.get(ep_band),
                );
                self.matchmaking_ghosts.insert(ep_band, &g);
            }

            self.player_mtc_immutable.remove(&player);
            self.player_mtc_mutable.remove(&player);
        }

        fn finish_mtc_turn(
            &mut self,
            player: AccountId,
            mut player_mtc_mutable: mtc::storage::PlayerMutable,
            new_seed: u64,
        ) {
            update_player_mtc_mutable_after_battle(&mut player_mtc_mutable, new_seed);
            self.player_mtc_mutable.insert(player, &player_mtc_mutable);
        }
    }
}
