#![cfg_attr(not(feature = "std"), no_std)]

use common::pow;
use frame_support::{
    debug::native::debug,
    dispatch::{CallMetadata, GetCallMetadata},
    traits::{Currency, Get, Imbalance, OnUnbalanced},
    weights::constants::ExtrinsicBaseWeight,
};
use pallet_transaction_payment::{CurrencyAdapter, OnChargeTransaction};
use sp_runtime::{
    traits::{CheckedSub, DispatchInfoOf, One, PostDispatchInfoOf},
    transaction_validity::{InvalidTransaction, TransactionValidityError},
};
use sp_std::convert::{TryFrom, TryInto};

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::pallet_prelude::*;
    use frame_system::pallet_prelude::*;

    #[pallet::config]
    pub trait Config: frame_system::Config + pallet_sudo::Config {}

    #[pallet::pallet]
    #[pallet::generate_store(pub(super) trait Store)]
    pub struct Pallet<T>(_);

    #[pallet::storage]
    pub type AccountData<T: Config> =
        StorageMap<_, Blake2_128Concat, T::AccountId, (T::BlockNumber, T::Index)>;

    #[pallet::hooks]
    impl<T: Config> Hooks<BlockNumberFor<T>> for Pallet<T> {}

    #[pallet::call]
    impl<T: Config> Pallet<T> {}
}

type NegativeImbalanceOf<C, T> =
    <C as Currency<<T as frame_system::Config>::AccountId>>::NegativeImbalance;
type Balance<T, C> = <C as Currency<<T as frame_system::Config>::AccountId>>::Balance;

pub struct PowCurrencyAdapter<C, OU>(CurrencyAdapter<C, OU>);

impl<T, C, OU> OnChargeTransaction<T> for PowCurrencyAdapter<C, OU>
where
    T: pallet_transaction_payment::Config + Config,
    T::TransactionByteFee: Get<<C as Currency<<T as frame_system::Config>::AccountId>>::Balance>,
    C: Currency<<T as frame_system::Config>::AccountId>,
    C::PositiveImbalance: Imbalance<
        <C as Currency<<T as frame_system::Config>::AccountId>>::Balance,
        Opposite = C::NegativeImbalance,
    >,
    C::NegativeImbalance: Imbalance<
        <C as Currency<<T as frame_system::Config>::AccountId>>::Balance,
        Opposite = C::PositiveImbalance,
    >,
    OU: OnUnbalanced<NegativeImbalanceOf<C, T>>,
    T::AccountId: AsRef<[u8; 32]>,
    <T as frame_system::Config>::Call: GetCallMetadata,
{
    type LiquidityInfo = Option<NegativeImbalanceOf<C, T>>;
    type Balance = Balance<T, C>;

    fn withdraw_fee(
        who: &T::AccountId,
        call: &<T as frame_system::Config>::Call,
        info: &DispatchInfoOf<<T as frame_system::Config>::Call>,
        fee: Self::Balance,
        tip: Self::Balance,
    ) -> Result<Self::LiquidityInfo, TransactionValidityError> {
        match which_payment_kind::<T, C>(who, tip).map_err(|_| InvalidTransaction::Payment)? {
            PaymentKind::Root => {
                debug!("Pow: Root");
                Ok(None)
            }
            PaymentKind::Payment => {
                debug!("Pow: Payment");
                <CurrencyAdapter<C, OU> as OnChargeTransaction<T>>::withdraw_fee(
                    who, call, info, fee, tip,
                )
            }
            PaymentKind::Pow(solution) => {
                debug!("Pow: Pow ({})", solution);
                validate_pow::<T, C>(who, &call.get_call_metadata(), fee, tip, solution)
                    .map_err(|_| InvalidTransaction::Payment)?;
                Ok(None)
            }
        }
    }

    fn correct_and_deposit_fee(
        who: &T::AccountId,
        dispatch_info: &DispatchInfoOf<<T as frame_system::Config>::Call>,
        post_info: &PostDispatchInfoOf<<T as frame_system::Config>::Call>,
        corrected_fee: Self::Balance,
        tip: Self::Balance,
        already_withdrawn: Self::LiquidityInfo,
    ) -> Result<(), TransactionValidityError> {
        match which_payment_kind::<T, C>(who, tip).map_err(|_| InvalidTransaction::Payment)? {
            PaymentKind::Root => Ok(()),
            PaymentKind::Payment => {
                <CurrencyAdapter<C, OU> as OnChargeTransaction<T>>::correct_and_deposit_fee(
                    who,
                    dispatch_info,
                    post_info,
                    corrected_fee,
                    tip,
                    already_withdrawn,
                )
            }
            PaymentKind::Pow(_) => Ok(()),
        }
    }
}

enum PaymentKind {
    Root,
    Payment,
    Pow(u64),
}

fn which_payment_kind<T: Config, C: Currency<<T as frame_system::Config>::AccountId>>(
    who: &T::AccountId,
    tip: Balance<T, C>,
) -> Result<PaymentKind, ()> {
    if who == &<pallet_sudo::Module<T>>::key() {
        return Ok(PaymentKind::Root);
    }

    let tip_u128: u128 = tip.try_into().map_err(|_| {
        debug!("Pow: failed: Balance => u128");
    })?;

    // head bit is 0 => normal payment
    Ok(if tip_u128 & (1 << 127) == 0 {
        PaymentKind::Payment
    } else {
        PaymentKind::Pow((tip_u128 & !(u128::MAX << 64)) as u64) // tail 64 bits
    })
}

fn validate_pow<T: Config, C: Currency<<T as frame_system::Config>::AccountId>>(
    who: &T::AccountId,
    call_metadata: &CallMetadata,
    fee: Balance<T, C>,
    tip: Balance<T, C>,
    solution: u64,
) -> Result<(), ()>
where
    T::AccountId: AsRef<[u8; 32]>,
{
    let almostlen = get_almostlen::<T, C>(fee, tip)?;
    if almostlen > 1500 {
        debug!("Pow: too big len: {}", almostlen);
        return Err(());
    }

    let pallet_name = call_metadata.pallet_name;
    let function_name = call_metadata.function_name;
    if !["Game", "FirstAirdrop"].contains(&pallet_name)
        || ![
            "start_mtc",
            "start_mtc_by_session",
            "finish_mtc_shop",
            "claim",
        ]
        .contains(&function_name)
    {
        debug!("Pow: not allowed call: {}, {}", pallet_name, function_name);
        return Err(());
    }

    let (previous_block_num, count) =
        <Pallet<T> as Store>::AccountData::get(who).unwrap_or_default();
    let current_block_num = <frame_system::Module<T>>::block_number();

    if current_block_num <= previous_block_num {
        debug!("Pow: illegal block num");
        return Err(());
    }

    if !pow::check_solution(who.as_ref(), count.try_into().map_err(|_| ())?, solution) {
        debug!("Pow: invalid solution");
        return Err(());
    }

    <Pallet<T> as Store>::AccountData::insert(who, (current_block_num, count + One::one()));
    Ok(())
}

fn get_almostlen<T: Config, C: Currency<<T as frame_system::Config>::AccountId>>(
    fee: Balance<T, C>,
    tip: Balance<T, C>,
) -> Result<u128, ()> {
    let base = Balance::<T, C>::try_from(ExtrinsicBaseWeight::get()).map_err(|_| ())?;
    let almostlen: u128 = fee
        .checked_sub(&base)
        .ok_or_else(|| {
            debug!("Pow: invalid fee");
        })?
        .checked_sub(&tip)
        .ok_or_else(|| {
            debug!("Pow: tip is bigger than tip");
        })?
        .try_into()
        .map_err(|_| {
            debug!("Pow: failed: Balance => u128");
        })?;

    Ok(almostlen)
}
