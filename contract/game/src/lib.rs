#![cfg_attr(not(feature = "std"), no_std, no_main)]

mod functions;

#[ink::contract]
pub mod contract {
    use crate::functions::*;
    use common::{codec_types::*, mtc::*};
    use ink::prelude::{vec, vec::Vec};
    use ink::storage::Mapping;
    use scale::{Decode, Encode};

    type PlayerImmutable = (Vec<mtc::Emo>, Vec<Option<(AccountId, mtc::Ghost)>>); // (pool, ghosts)

    #[derive(PartialEq, Eq, Clone, Debug, Encode, Decode)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    enum LazyStorageKey {
        Leaderboard,
    }

    #[derive(PartialEq, Eq, Clone, Debug, Encode, Decode)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    enum LazyStorageValue {
        Leaderboard(Vec<(u16, AccountId)>),
    }

    #[ink(storage)]
    #[derive(Default)]
    pub struct Contract {
        admins: Vec<AccountId>,

        emo_bases: Option<emo::Bases>,
        deck_fixed_emo_base_ids: Option<Vec<u16>>,
        deck_built_emo_base_ids: Option<Vec<u16>>,

        matchmaking_ghosts_info: Mapping<u16, Vec<(BlockNumber, AccountId)>>,
        matchmaking_ghost_by_index: Mapping<(u16, u8), mtc::Ghost>,

        lazy: Mapping<LazyStorageKey, LazyStorageValue>,

        player_ep: Mapping<AccountId, u16>,
        player_seed: Mapping<AccountId, u64>,

        // remove on each mtc
        player_mtc_immutable: Mapping<AccountId, PlayerImmutable>,
        player_mtc_mutable: Mapping<AccountId, mtc::storage::PlayerMutable>,
    }

    impl Contract {
        #[ink(constructor)]
        pub fn new() -> Self {
            let mut contract: Self = Default::default();
            contract.admins.push(Self::env().caller());
            contract
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

            ink::env::set_code_hash(&code_hash).unwrap_or_else(|err| {
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
        pub fn get_matchmaking_ghosts_info(
            &self,
            ep_band: u16,
        ) -> Option<Vec<(BlockNumber, AccountId)>> {
            self.matchmaking_ghosts_info.get(ep_band)
        }

        #[ink(message)]
        pub fn get_matchmaking_ghost_by_index(
            &self,
            ep_band: u16,
            index: u8,
        ) -> Option<mtc::Ghost> {
            self.matchmaking_ghost_by_index.get((ep_band, index))
        }

        #[ink(message)]
        pub fn get_leaderboard(&self) -> Vec<(u16, AccountId)> {
            if let Some(value) = self.lazy.get(LazyStorageKey::Leaderboard) {
                let LazyStorageValue::Leaderboard(leaderboard) = value;
                return leaderboard;
            }
            vec![]
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
            self.player_mtc_immutable.get(account)
        }

        #[ink(message)]
        pub fn get_player_mtc_mutable(
            &self,
            account: AccountId,
        ) -> Option<mtc::storage::PlayerMutable> {
            self.player_mtc_mutable.get(account)
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
                        self.deck_built_emo_base_ids
                            .as_ref()
                            .expect("deck_built_emo_base_ids none"),
                    )
                    .expect("failed to build player pool"),
                    ghost::choose_ghosts(
                        ep,
                        seed,
                        &|ep_band| {
                            self.matchmaking_ghosts_info
                                .get(ep_band)
                                .map(|v| v.into_iter().map(|(_, a)| a).collect())
                        },
                        &|t| self.matchmaking_ghost_by_index.get(t),
                    ),
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
                    .map(|o| o.map(|(_, g)| g).unwrap_or_default())
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

        fn set_leaderboard(&mut self, x: Vec<(u16, AccountId)>) {
            self.lazy.insert(
                LazyStorageKey::Leaderboard,
                &LazyStorageValue::Leaderboard(x),
            );
        }

        fn get_insecure_random_seed(&self, account_id: AccountId, subject: &[u8]) -> u64 {
            assert!(
                self.env().caller_is_origin(),
                "contracts aren't supported yet"
            );

            let seed = self.env().hash_encoded::<ink::env::hash::Blake2x128, _>(&(
                subject,
                account_id,
                self.env().block_timestamp(),
            ));

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

            if let Some(leaderboard) = update_leaderboard(self.get_leaderboard(), new_ep, &player) {
                self.set_leaderboard(leaderboard);
            }

            self.player_ep.insert(player, &new_ep);

            if !grade_and_board_history.last().unwrap().board.0.is_empty() {
                self.add_matchmaking_ghost(player, old_ep, grade_and_board_history);
            }

            self.player_mtc_immutable.remove(player);
            self.player_mtc_mutable.remove(player);
        }

        fn add_matchmaking_ghost(
            &mut self,
            player: AccountId,
            ep: u16,
            grade_and_board_history: &[mtc::GradeAndBoard],
        ) {
            let ep_band = ep::get_ep_band(ep);
            let player_info_element = (self.env().block_number(), player);

            let (info, index) = if let Some(mut info) = self.matchmaking_ghosts_info.get(ep_band) {
                let index = if let Some(idx) = info.iter().position(|(_, a)| a == &player) {
                    info[idx] = player_info_element;
                    idx
                } else if info.len() < 20 {
                    info.push(player_info_element);
                    info.len() - 1
                } else {
                    let mut iter = info.iter().enumerate();
                    let (mut oldest_idx, (mut oldest_num, _)) = iter.next().unwrap();
                    for (idx, &(num, _)) in iter {
                        if num < oldest_num {
                            oldest_num = num;
                            oldest_idx = idx;
                        }
                    }
                    info[oldest_idx] = player_info_element;
                    oldest_idx
                };

                (info, index as u8)
            } else {
                (vec![player_info_element], 0)
            };

            self.matchmaking_ghosts_info.insert(ep_band, &info);
            self.matchmaking_ghost_by_index.insert(
                (ep_band, index),
                &ghost::build_ghost_from_history(grade_and_board_history),
            );
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

    #[cfg(test)]
    mod tests {
        use super::*;

        fn set_caller(caller: AccountId) {
            ink::env::test::set_caller::<Environment>(caller);
        }

        fn get_default_accounts() -> ink::env::test::DefaultAccounts<Environment> {
            ink::env::test::default_accounts::<Environment>()
        }

        fn get_account(n: u8) -> AccountId {
            assert!(n < 255, "not supported");
            let mut arr = [0xff; 32];
            arr[0] -= n + 1;
            AccountId::from(arr)
        }

        struct AccountIdForDebug(AccountId);
        impl std::fmt::Debug for AccountIdForDebug {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                let a: &[u8; 32] = self.0.as_ref();
                write!(f, "a:{}", 254 - a[0])
            }
        }

        fn get_current_block_number() -> BlockNumber {
            ink::env::block_number::<Environment>()
        }

        fn advance_block() -> BlockNumber {
            ink::env::test::advance_block::<Environment>();
            get_current_block_number()
        }

        fn init_contract() -> Contract {
            set_caller(get_default_accounts().alice);
            Contract::new()
        }

        #[ink::test]
        fn new() {
            assert_eq!(init_contract().admins, vec![get_default_accounts().alice]);
        }

        #[ink::test]
        fn create_or_update_player_ep() {
            let mut contract = init_contract();

            let account0 = get_account(0);
            assert_eq!(contract.player_ep.get(account0), None);
            assert_eq!(contract.create_or_update_player_ep(account0), 300);
            assert_eq!(contract.player_ep.get(account0), Some(300));

            let account1 = get_account(1);
            contract.player_ep.insert(account1, &400);
            assert_eq!(contract.create_or_update_player_ep(account1), 400);
            assert_eq!(contract.player_ep.get(account1), Some(400));

            let account2 = get_account(2);
            contract.player_ep.insert(account2, &500);
            let m: mtc::storage::PlayerMutable = Default::default();
            contract.player_mtc_mutable.insert(account2, &m);
            assert_eq!(contract.create_or_update_player_ep(account2), 440);
            assert_eq!(contract.player_ep.get(account2), Some(440));
        }

        #[ink::test]
        fn add_matchmaking_ghost() {
            let mut contract = init_contract();
            let ep = 300;
            let ep_band = ep::get_ep_band(ep);
            let mut current_block = get_current_block_number();

            assert_eq!(contract.matchmaking_ghosts_info.get(ep_band), None);
            assert_eq!(contract.matchmaking_ghost_by_index.get((ep_band, 0)), None);

            fn build_grade_and_board_vec(grade: u8) -> Vec<mtc::GradeAndBoard> {
                vec![mtc::GradeAndBoard {
                    grade,
                    board: Default::default(),
                }]
            }

            fn build_ghost(grade: u8) -> mtc::Ghost {
                mtc::Ghost {
                    history: vec![mtc::GradeAndGhostBoard {
                        grade,
                        board: Default::default(),
                    }],
                }
            }

            contract.add_matchmaking_ghost(get_account(0), ep, &build_grade_and_board_vec(0));
            assert_eq!(
                contract.matchmaking_ghosts_info.get(ep_band).unwrap(),
                vec![(current_block, get_account(0))]
            );
            assert_eq!(
                contract
                    .matchmaking_ghost_by_index
                    .get((ep_band, 0))
                    .unwrap(),
                build_ghost(0)
            );

            contract.add_matchmaking_ghost(get_account(1), ep, &build_grade_and_board_vec(1));
            assert_eq!(
                contract.matchmaking_ghosts_info.get(ep_band).unwrap(),
                vec![
                    (current_block, get_account(0)),
                    (current_block, get_account(1))
                ]
            );
            assert_eq!(
                contract
                    .matchmaking_ghost_by_index
                    .get((ep_band, 0))
                    .unwrap(),
                build_ghost(0)
            );
            assert_eq!(
                contract
                    .matchmaking_ghost_by_index
                    .get((ep_band, 1))
                    .unwrap(),
                build_ghost(1)
            );

            current_block = advance_block();

            contract.add_matchmaking_ghost(get_account(0), ep, &build_grade_and_board_vec(2));
            assert_eq!(
                contract.matchmaking_ghosts_info.get(ep_band).unwrap(),
                vec![
                    (current_block, get_account(0)),
                    (current_block - 1, get_account(1))
                ]
            );
            assert_eq!(
                contract
                    .matchmaking_ghost_by_index
                    .get((ep_band, 0))
                    .unwrap(),
                build_ghost(2)
            );

            advance_block();

            for n in 2u8..19 {
                contract.add_matchmaking_ghost(get_account(n), ep, &build_grade_and_board_vec(3));
            }
            assert_eq!(
                contract.matchmaking_ghosts_info.get(ep_band).unwrap().len(),
                19
            );

            current_block = advance_block();

            contract.add_matchmaking_ghost(get_account(19), ep, &build_grade_and_board_vec(4));
            let result = contract.matchmaking_ghosts_info.get(ep_band).unwrap();
            assert_eq!(result.len(), 20);
            assert_eq!(result.last().unwrap(), &(current_block, get_account(19)));
            assert_eq!(
                contract
                    .matchmaking_ghost_by_index
                    .get((ep_band, 19))
                    .unwrap(),
                build_ghost(4)
            );

            let mut before = contract.matchmaking_ghosts_info.get(ep_band).unwrap();
            // println!("{:?}", before.clone().into_iter().map(|(b, a)| (b, AccountIdForDebug(a))).collect::<Vec<_>>());
            assert_eq!(
                contract
                    .matchmaking_ghost_by_index
                    .get((ep_band, 1))
                    .unwrap(),
                build_ghost(1)
            );
            contract.add_matchmaking_ghost(get_account(20), ep, &build_grade_and_board_vec(5));
            let after = contract.matchmaking_ghosts_info.get(ep_band).unwrap();
            // println!("{:?}", after.clone().into_iter().map(|(b, a)| (b, AccountIdForDebug(a))).collect::<Vec<_>>());
            assert_eq!(after.len(), 20);
            before[1] = (current_block, get_account(20));
            assert_eq!(after, before);
            assert_eq!(
                contract
                    .matchmaking_ghost_by_index
                    .get((ep_band, 1))
                    .unwrap(),
                build_ghost(5)
            );

            current_block = advance_block();

            assert_eq!(
                contract.matchmaking_ghosts_info.get(ep_band).unwrap()[10],
                (2, get_account(10))
            );
            assert_eq!(
                contract
                    .matchmaking_ghost_by_index
                    .get((ep_band, 10))
                    .unwrap()
                    .history
                    .last()
                    .unwrap()
                    .grade,
                3
            );
            contract.add_matchmaking_ghost(get_account(10), ep, &build_grade_and_board_vec(6));
            assert_eq!(
                contract.matchmaking_ghosts_info.get(ep_band).unwrap()[10],
                (current_block, get_account(10))
            );
            assert_eq!(
                contract
                    .matchmaking_ghost_by_index
                    .get((ep_band, 10))
                    .unwrap()
                    .history
                    .last()
                    .unwrap()
                    .grade,
                6
            );
        }
    }
}
