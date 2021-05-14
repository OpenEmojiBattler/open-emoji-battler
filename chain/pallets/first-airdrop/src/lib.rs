#![cfg_attr(not(feature = "std"), no_std)]

use frame_support::{dispatch::DispatchResultWithPostInfo, ensure};

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use super::*;
    use frame_support::pallet_prelude::*;
    use frame_system::pallet_prelude::*;

    #[pallet::config]
    pub trait Config: frame_system::Config + pallet_game::Config {}

    #[pallet::pallet]
    #[pallet::generate_store(pub(super) trait Store)]
    pub struct Pallet<T>(_);

    #[pallet::storage]
    pub type PlayerAirdropDestinationKusamaAccountId<T: Config> =
        StorageMap<_, Blake2_128Concat, T::AccountId, T::AccountId>;

    #[pallet::error]
    pub enum Error<T> {
        AirdropCountMax,
        PlayerEpNone,
        PlayerEpLow,
    }

    #[pallet::hooks]
    impl<T: Config> Hooks<BlockNumberFor<T>> for Pallet<T> {}

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        #[pallet::weight(1)]
        pub fn claim(
            origin: OriginFor<T>,
            kusama_account_id: T::AccountId,
        ) -> DispatchResultWithPostInfo {
            let player_account_id = ensure_signed(origin)?;

            let airdropped_count = PlayerAirdropDestinationKusamaAccountId::<T>::iter().count();
            ensure!(airdropped_count < 500, Error::<T>::AirdropCountMax);

            let player_dp = pallet_game::PlayerEp::<T>::get(&player_account_id)
                .ok_or(Error::<T>::PlayerEpNone)?;
            ensure!(player_dp > 1000, Error::<T>::PlayerEpLow);

            PlayerAirdropDestinationKusamaAccountId::<T>::insert(
                &player_account_id,
                kusama_account_id,
            );

            Ok(().into())
        }
    }
}
