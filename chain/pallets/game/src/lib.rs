#![cfg_attr(not(feature = "std"), no_std)]

use common::{
    codec_types::*,
    mtc::{
        battle::organizer::{battle_all, select_battle_ghost_index},
        emo_bases::check_and_build_emo_bases,
        ep::{calculate_new_ep, get_ep_band, EP_UNFINISH_PENALTY, INITIAL_EP},
        result::build_ghost_from_history,
        setup::{build_initial_ghost_states, build_pool},
        shop::{
            coin::{decrease_upgrade_coin, get_upgrade_coin},
            player_operation::verify_player_operations_and_update,
        },
        utils::{get_turn_and_previous_grade_and_board, GHOST_COUNT, PLAYER_INITIAL_HEALTH},
    },
    utils::partial_bytes_to_u64,
};
use frame_support::{
    debug::native::debug, dispatch::DispatchResultWithPostInfo, traits::Randomness,
};
use parity_scale_codec::Encode;
use rand::seq::SliceRandom;
use rand::SeedableRng;
use rand_pcg::Pcg64Mcg;
use sp_std::prelude::*;

pub use pallet::*;

mod metadata_names {
    #![allow(non_camel_case_types)]

    use common::codec_types::*;

    pub type mtc_Ghost = mtc::Ghost;
    pub type mtc_Emo = mtc::Emo;
    pub type mtc_GradeAndBoard = mtc::GradeAndBoard;
    pub type mtc_GhostState = mtc::GhostState;
    pub type mtc_shop_PlayerOperation = mtc::shop::PlayerOperation;

    pub type emo_Bases = emo::Bases;
}
use metadata_names::*;

#[frame_support::pallet]
pub mod pallet {
    use super::*;
    use frame_support::{pallet_prelude::*, transactional};
    use frame_system::pallet_prelude::*;

    #[pallet::config]
    pub trait Config: frame_system::Config {}

    #[pallet::pallet]
    #[pallet::generate_store(pub(super) trait Store)]
    pub struct Pallet<T>(_);

    #[pallet::storage]
    pub type EmoBases<T: Config> = StorageValue<_, emo_Bases>;
    #[pallet::storage]
    pub type DeckFixedEmoBaseIds<T: Config> = StorageValue<_, Vec<u16>>;
    #[pallet::storage]
    pub type DeckBuiltEmoBaseIds<T: Config> = StorageValue<_, Vec<u16>>;

    #[pallet::storage]
    pub type MatchmakingGhosts<T: Config> =
        StorageMap<_, Blake2_128Concat, u16, Vec<(T::AccountId, u16, mtc_Ghost)>>;

    #[pallet::storage]
    pub type PlayerEp<T: Config> = StorageMap<_, Blake2_128Concat, T::AccountId, u16>;
    #[pallet::storage]
    pub type PlayerMainToSession<T: Config> =
        StorageMap<_, Blake2_128Concat, T::AccountId, T::AccountId>;
    #[pallet::storage]
    pub type PlayerSessionToMain<T: Config> =
        StorageMap<_, Blake2_128Concat, T::AccountId, T::AccountId>;

    #[pallet::storage]
    pub type PlayerSeed<T: Config> = StorageMap<_, Blake2_128Concat, T::AccountId, u64>;

    // remove for each mtc
    #[pallet::storage]
    pub type PlayerPool<T: Config> = StorageMap<_, Blake2_128Concat, T::AccountId, Vec<mtc_Emo>>;
    #[pallet::storage]
    pub type PlayerHealth<T: Config> = StorageMap<_, Blake2_128Concat, T::AccountId, u8>;
    #[pallet::storage]
    pub type PlayerGradeAndBoardHistory<T: Config> =
        StorageMap<_, Blake2_128Concat, T::AccountId, Vec<mtc_GradeAndBoard>>;
    #[pallet::storage]
    pub type PlayerUpgradeCoin<T: Config> = StorageMap<_, Blake2_128Concat, T::AccountId, u8>;
    #[pallet::storage]
    pub type PlayerGhosts<T: Config> =
        StorageMap<_, Blake2_128Concat, T::AccountId, Vec<(T::AccountId, u16, mtc_Ghost)>>;
    #[pallet::storage]
    pub type PlayerGhostStates<T: Config> =
        StorageMap<_, Blake2_128Concat, T::AccountId, Vec<mtc_GhostState>>;
    #[pallet::storage]
    pub type PlayerBattleGhostIndex<T: Config> = StorageMap<_, Blake2_128Concat, T::AccountId, u8>;

    #[pallet::storage]
    pub type PlayerFirstAirdropEligible<T: Config> =
        StorageMap<_, Blake2_128Concat, T::AccountId, bool>;

    #[pallet::error]
    pub enum Error<T> {
        EmoBasesNone,
        FixedEmoBaseIdsNone,
        BuiltEmoBaseIdsNone,
        MatchmakingGhostsNone,
        PlayerEpNone,
        PlayerMainToSessionNone,
        PlayerSessionToMainNone,
        PlayerSeedNone,
        PlayerPoolNone,
        PlayerHealthNone,
        PlayerGradeAndBoardHistoryNone,
        PlayerUpgradeCoinNone,
        PlayerGhostsNone,
        PlayerGhostStatesNone,
        PlayerBattleGhostIndexNone,

        InvalidEmoBases,
        DeckBuildingFailed,
        InvalidShopPlayerOperations,
        BattleFailed,
        BattleGhostSelectionFailed,
        MaxTurnExceeded,
    }

    #[pallet::hooks]
    impl<T: Config> Hooks<BlockNumberFor<T>> for Pallet<T> {}

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        #[pallet::weight(1)]
        pub fn update_emo_bases(
            origin: OriginFor<T>,
            new_bases: emo_Bases,
            fixed_base_ids: Vec<u16>,
            built_base_ids: Vec<u16>,
            force_bases_update: bool,
        ) -> DispatchResultWithPostInfo {
            ensure_root(origin)?;

            let bases = check_and_build_emo_bases(
                <EmoBases<T>>::get().unwrap_or_else(emo::Bases::new),
                new_bases,
                &fixed_base_ids,
                &built_base_ids,
                force_bases_update,
            )
            .map_err(|_e| Error::<T>::InvalidEmoBases)?;

            <EmoBases<T>>::put(bases);
            <DeckFixedEmoBaseIds<T>>::put(fixed_base_ids);
            <DeckBuiltEmoBaseIds<T>>::put(built_base_ids);

            Ok(().into())
        }

        #[pallet::weight(1)]
        #[transactional]
        pub fn start_mtc(
            origin: OriginFor<T>,
            session: T::AccountId,
            deck_emo_base_ids: [u16; 6],
        ) -> DispatchResultWithPostInfo {
            let main = ensure_signed(origin)?;

            Self::_start_mtc(main, session, deck_emo_base_ids)
        }

        #[pallet::weight(1)]
        #[transactional]
        pub fn start_mtc_by_session(
            origin: OriginFor<T>,
            deck_emo_base_ids: [u16; 6],
        ) -> DispatchResultWithPostInfo {
            let session = ensure_signed(origin)?;
            let main = PlayerSessionToMain::<T>::get(&session)
                .ok_or(Error::<T>::PlayerSessionToMainNone)?;

            Self::_start_mtc(main, session, deck_emo_base_ids)
        }

        #[pallet::weight(1)]
        #[transactional]
        pub fn finish_mtc_shop(
            origin: OriginFor<T>,
            player_operations: Vec<mtc_shop_PlayerOperation>,
        ) -> DispatchResultWithPostInfo {
            let session = ensure_signed(origin)?;
            let main = PlayerSessionToMain::<T>::get(&session)
                .ok_or(Error::<T>::PlayerSessionToMainNone)?;

            Self::_finish_mtc_shop(main, player_operations)
        }
    }
}

impl<T: Config> Pallet<T> {
    fn _start_mtc(
        main: T::AccountId,
        session: T::AccountId,
        deck_emo_base_ids: [u16; 6],
    ) -> DispatchResultWithPostInfo {
        if PlayerPool::<T>::contains_key(&main) {
            Self::_cleanup_finished(&main);
            let ep = PlayerEp::<T>::get(&main).ok_or(<Error<T>>::PlayerEpNone)?;
            PlayerEp::<T>::insert(&main, ep.saturating_sub(EP_UNFINISH_PENALTY));
        }

        let seed = Self::_get_random_seed(&b"start_mtc"[..]);

        PlayerMainToSession::<T>::insert(&main, &session);
        PlayerSessionToMain::<T>::insert(&session, &main);

        PlayerHealth::<T>::insert(&main, PLAYER_INITIAL_HEALTH);
        PlayerSeed::<T>::insert(&main, seed);
        PlayerPool::<T>::insert(
            &main,
            build_pool(
                &deck_emo_base_ids,
                &<EmoBases<T>>::get().ok_or(<Error<T>>::EmoBasesNone)?,
                &<DeckFixedEmoBaseIds<T>>::get().ok_or(<Error<T>>::FixedEmoBaseIdsNone)?,
                &<DeckBuiltEmoBaseIds<T>>::get().ok_or(<Error<T>>::BuiltEmoBaseIdsNone)?,
            )
            .or(Err(Error::<T>::DeckBuildingFailed))?,
        );
        PlayerGradeAndBoardHistory::<T>::insert(&main, Vec::<mtc::GradeAndBoard>::new());
        PlayerBattleGhostIndex::<T>::insert(&main, 0);
        Self::_update_upgrade_coin(&main, get_upgrade_coin(2));

        Self::_matchmake(&main, seed);

        Ok(().into())
    }

    fn _matchmake(account_id: &T::AccountId, seed: u64) {
        let mut rng = Pcg64Mcg::seed_from_u64(seed);

        let ep = if PlayerEp::<T>::contains_key(account_id) {
            PlayerEp::<T>::get(account_id).unwrap()
        } else {
            PlayerEp::<T>::insert(account_id, INITIAL_EP);
            INITIAL_EP
        };
        let mut ep_band = get_ep_band(ep);
        let mut selected = Vec::with_capacity(GHOST_COUNT);
        let mut n = GHOST_COUNT;
        let mut circuitbreaker = 0u8;

        loop {
            let ghosts = MatchmakingGhosts::<T>::get(ep_band).unwrap_or_else(Vec::new);
            selected.extend(
                ghosts
                    .choose_multiple(&mut rng, n)
                    .cloned()
                    .collect::<Vec<_>>(),
            );
            if selected.len() >= GHOST_COUNT || ep_band < 1 {
                break;
            }
            n = GHOST_COUNT - selected.len();
            ep_band -= 1;

            circuitbreaker += 1;
            if circuitbreaker > 100 {
                break;
            }
        }

        if selected.len() < GHOST_COUNT {
            for _ in 0..(GHOST_COUNT - selected.len()) {
                selected.push((
                    Default::default(),
                    INITIAL_EP,
                    mtc::Ghost { history: vec![] },
                ));
            }
        }

        PlayerGhosts::<T>::insert(account_id, selected);
        PlayerGhostStates::<T>::insert(&account_id, build_initial_ghost_states());
    }

    fn _finish_mtc_shop(
        account_id: T::AccountId,
        player_operations: Vec<mtc_shop_PlayerOperation>,
    ) -> DispatchResultWithPostInfo {
        let emo_bases = <EmoBases<T>>::get().ok_or(<Error<T>>::EmoBasesNone)?;
        let grade_and_board_history = PlayerGradeAndBoardHistory::<T>::get(&account_id)
            .ok_or(<Error<T>>::PlayerGradeAndBoardHistoryNone)?;
        let mut upgrade_coin = PlayerUpgradeCoin::<T>::get(&account_id);

        let (
            turn,
            mtc::GradeAndBoard {
                mut grade,
                mut board,
            },
        ) = get_turn_and_previous_grade_and_board(&grade_and_board_history);

        board = Self::_verify_player_operations_and_update(
            &account_id,
            board,
            &mut grade,
            &mut upgrade_coin,
            &player_operations,
            turn,
            &emo_bases,
        )?;

        let mut health = PlayerHealth::<T>::get(&account_id).ok_or(<Error<T>>::PlayerHealthNone)?;
        let battle_ghost_index = PlayerBattleGhostIndex::<T>::get(&account_id)
            .ok_or(<Error<T>>::PlayerBattleGhostIndexNone)?;
        let mut ghost_states =
            PlayerGhostStates::<T>::get(&account_id).ok_or(<Error<T>>::PlayerGhostStatesNone)?;

        let new_seed = Self::_get_random_seed(&b"finish_mtc_shop"[..]);
        let (ghosts, ghost_eps) = Self::_get_ghosts_and_ghost_eps(&account_id)?;

        let final_place = Self::_battle(
            &account_id,
            &board,
            &mut health,
            &mut ghost_states,
            grade,
            &ghosts,
            battle_ghost_index,
            turn,
            new_seed,
            &emo_bases,
        )?;

        Self::_finish(
            &account_id,
            grade,
            board,
            new_seed,
            upgrade_coin,
            battle_ghost_index,
            health,
            ghost_states,
            &ghost_eps,
            grade_and_board_history,
            final_place,
        )?;

        Ok(().into())
    }

    fn _verify_player_operations_and_update(
        account_id: &T::AccountId,
        board: mtc::Board,
        grade: &mut u8,
        upgrade_coin: &mut Option<u8>,
        player_operations: &[mtc_shop_PlayerOperation],
        turn: u8,
        emo_bases: &emo::Bases,
    ) -> Result<mtc::Board, Error<T>> {
        let pool = PlayerPool::<T>::get(account_id).ok_or(<Error<T>>::PlayerPoolNone)?;
        let old_seed = PlayerSeed::<T>::get(account_id).ok_or(<Error<T>>::PlayerSeedNone)?;

        verify_player_operations_and_update(
            board,
            grade,
            upgrade_coin,
            player_operations,
            &pool,
            old_seed,
            turn,
            emo_bases,
        )
        .map_err(|e| {
            let (turn, mtc::GradeAndBoard { grade, board }) = get_turn_and_previous_grade_and_board(
                &PlayerGradeAndBoardHistory::<T>::get(&account_id).unwrap_or_default(),
            );
            let upgrade_coin = PlayerUpgradeCoin::<T>::get(&account_id);

            debug!(
                "verify_player_operations_and_update: {}, {}, {}, {:?}, {}, {}, {}, {}, {}",
                e,
                hex::encode(board.encode()).as_str(),
                grade,
                upgrade_coin,
                hex::encode(player_operations.encode()).as_str(),
                hex::encode(pool.encode()).as_str(),
                old_seed,
                turn,
                hex::encode(emo_bases.encode()).as_str(),
            );

            Error::<T>::InvalidShopPlayerOperations
        })
    }

    fn _battle(
        account_id: &T::AccountId,
        board: &mtc::Board,
        health: &mut u8,
        ghost_states: &mut Vec<mtc::GhostState>,
        grade: u8,
        ghosts: &[mtc::Ghost],
        battle_ghost_index: u8,
        turn: u8,
        new_seed: u64,
        emo_bases: &emo::Bases,
    ) -> Result<Option<u8>, Error<T>> {
        battle_all(
            board,
            health,
            ghost_states,
            grade,
            ghosts,
            battle_ghost_index,
            turn,
            new_seed,
            emo_bases,
        )
        .map_err(|e| {
            debug!(
                "battle_all: {}, {}, {}, {}, {}, {}, {}, {}, {}, {}",
                e,
                hex::encode(board.encode()).as_str(),
                PlayerHealth::<T>::get(&account_id).unwrap_or(0),
                hex::encode(ghost_states.encode()).as_str(),
                grade,
                hex::encode(ghosts.encode()).as_str(),
                battle_ghost_index,
                turn,
                new_seed,
                hex::encode(emo_bases.encode()).as_str(),
            );

            Error::<T>::BattleFailed
        })
    }

    fn _finish(
        account_id: &T::AccountId,
        grade: u8,
        board: mtc::Board,
        new_seed: u64,
        upgrade_coin: Option<u8>,
        battle_ghost_index: u8,
        health: u8,
        ghost_states: Vec<mtc::GhostState>,
        ghost_eps: &[u16],
        mut grade_and_board_history: Vec<mtc::GradeAndBoard>,
        final_place: Option<u8>,
    ) -> Result<(), Error<T>> {
        grade_and_board_history.push(mtc::GradeAndBoard { grade, board });

        if let Some(place) = final_place {
            Self::_finish_mtc(
                account_id,
                place,
                &ghost_states,
                ghost_eps,
                &grade_and_board_history,
            )?;
        } else {
            Self::_finish_battle(
                account_id,
                upgrade_coin,
                ghost_states,
                battle_ghost_index,
                new_seed,
                health,
                grade_and_board_history,
            )?;
        }

        PlayerSeed::<T>::insert(&account_id, new_seed);

        Ok(())
    }

    fn _finish_mtc(
        account_id: &T::AccountId,
        place: u8,
        ghost_states: &[mtc::GhostState],
        ghost_eps: &[u16],
        grade_and_board_history: &[mtc::GradeAndBoard],
    ) -> Result<(), Error<T>> {
        let ep = Self::_update_ep(account_id, place, ghost_states, ghost_eps)?;

        if place < 4 {
            Self::_register_ghost(account_id, ep, grade_and_board_history);
            PlayerFirstAirdropEligible::<T>::insert(&account_id, true);
        }

        Self::_cleanup_finished(account_id);
        Ok(())
    }

    fn _finish_battle(
        account_id: &T::AccountId,
        upgrade_coin: Option<u8>,
        ghost_states: Vec<mtc::GhostState>,
        battle_ghost_index: u8,
        new_seed: u64,
        health: u8,
        grade_and_board_history: Vec<mtc::GradeAndBoard>,
    ) -> Result<(), Error<T>> {
        if grade_and_board_history.len() > 30 {
            return Err(Error::<T>::MaxTurnExceeded);
        }

        let upgrade_coin = decrease_upgrade_coin(upgrade_coin);

        let new_battle_ghost_index =
            select_battle_ghost_index(&ghost_states, battle_ghost_index, new_seed).map_err(
                |e| {
                    debug!("select_battle_ghost_index: {}", e);
                    Error::<T>::BattleGhostSelectionFailed
                },
            )?;

        PlayerGradeAndBoardHistory::<T>::insert(account_id, grade_and_board_history);
        PlayerHealth::<T>::insert(account_id, health);
        PlayerGhostStates::<T>::insert(account_id, ghost_states);
        PlayerBattleGhostIndex::<T>::insert(account_id, new_battle_ghost_index);
        Self::_update_upgrade_coin(account_id, upgrade_coin);

        Ok(())
    }

    fn _register_ghost(
        account_id: &T::AccountId,
        ep: u16,
        grade_and_board_history: &[mtc::GradeAndBoard],
    ) {
        let ep_band = get_ep_band(ep);
        let ghost = build_ghost_from_history(grade_and_board_history);

        let mut ghosts_with_data = MatchmakingGhosts::<T>::get(ep_band).unwrap_or_else(Vec::new);

        if let Some(ghost_with_data) = ghosts_with_data
            .iter_mut()
            .find(|(aid, _, _)| aid == account_id)
        {
            ghost_with_data.1 = ep;
            ghost_with_data.2 = ghost;
        } else if ghosts_with_data.len() < 20 {
            ghosts_with_data.push((account_id.clone(), ep, ghost));
        } else {
            ghosts_with_data.remove(0);
            ghosts_with_data.push((account_id.clone(), ep, ghost));
        }

        MatchmakingGhosts::<T>::insert(ep_band, ghosts_with_data);
    }

    fn _update_ep(
        account_id: &T::AccountId,
        place: u8,
        ghost_states: &[mtc::GhostState],
        ghost_eps: &[u16],
    ) -> Result<u16, Error<T>> {
        let mut ghosts = ghost_states
            .iter()
            .map(|s| {
                if let mtc::GhostState::Active { health: h } = s {
                    *h
                } else {
                    0
                }
            })
            .zip(ghost_eps.to_vec())
            .collect::<Vec<_>>();

        ghosts.sort_by_key(|&(health, _)| health);
        ghosts.reverse();

        let sorted_ghost_eps = ghosts.iter().map(|&(_, ep)| ep).collect::<Vec<_>>();

        let new_ep = calculate_new_ep(
            PlayerEp::<T>::get(account_id).ok_or(<Error<T>>::PlayerEpNone)?,
            place,
            &sorted_ghost_eps,
        );

        PlayerEp::<T>::insert(account_id, new_ep);
        Ok(new_ep)
    }

    fn _cleanup_finished(main: &T::AccountId) {
        PlayerPool::<T>::remove(main);
        PlayerHealth::<T>::remove(main);
        PlayerGradeAndBoardHistory::<T>::remove(main);
        PlayerUpgradeCoin::<T>::remove(main);
        PlayerGhosts::<T>::remove(main);
        PlayerGhostStates::<T>::remove(main);
        PlayerBattleGhostIndex::<T>::remove(main);
    }

    fn _update_upgrade_coin(account_id: &T::AccountId, upgrade_coin: Option<u8>) {
        if let Some(c) = upgrade_coin {
            PlayerUpgradeCoin::<T>::insert(account_id, c);
        } else {
            PlayerUpgradeCoin::<T>::remove(account_id);
        }
    }

    fn _get_random_seed(subject: &[u8]) -> u64 {
        partial_bytes_to_u64(
            <pallet_randomness_collective_flip::Module<T>>::random(subject).as_ref(),
        )
    }

    fn _get_ghosts_and_ghost_eps(
        account_id: &T::AccountId,
    ) -> Result<(Vec<mtc::Ghost>, Vec<u16>), Error<T>> {
        let player_ghosts =
            PlayerGhosts::<T>::get(account_id).ok_or(<Error<T>>::PlayerGhostsNone)?;
        let len = player_ghosts.len();

        let mut ghosts = Vec::with_capacity(len);
        let mut ghost_eps = Vec::with_capacity(len);

        for (_, ep, ghost) in player_ghosts.into_iter() {
            ghosts.push(ghost);
            ghost_eps.push(ep);
        }

        Ok((ghosts, ghost_eps))
    }
}
