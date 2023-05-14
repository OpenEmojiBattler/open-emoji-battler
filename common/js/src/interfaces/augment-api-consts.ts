// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

// import type lookup before we augment - in some environments
// this is required to allow for ambient/previous definitions
import '@polkadot/api-base/types/consts';

import type { ApiTypes, AugmentedConst } from '@polkadot/api-base/types';
import type { bool, u128, u16, u32, u64, u8 } from '@polkadot/types-codec';
import type { Codec } from '@polkadot/types-codec/types';
import type { FrameSystemLimitsBlockLength, FrameSystemLimitsBlockWeights, PalletContractsSchedule, SpVersionRuntimeVersion, SpWeightsRuntimeDbWeight } from '@polkadot/types/lookup';

export type __AugmentedConst<ApiType extends ApiTypes> = AugmentedConst<ApiType>;

declare module '@polkadot/api-base/types/consts' {
  interface AugmentedConsts<ApiType extends ApiTypes> {
    assets: {
      /**
       * The amount of funds that must be reserved when creating a new approval.
       **/
      approvalDeposit: u128 & AugmentedConst<ApiType>;
      /**
       * The amount of funds that must be reserved for a non-provider asset account to be
       * maintained.
       **/
      assetAccountDeposit: u128 & AugmentedConst<ApiType>;
      /**
       * The basic amount of funds that must be reserved for an asset.
       **/
      assetDeposit: u128 & AugmentedConst<ApiType>;
      /**
       * The basic amount of funds that must be reserved when adding metadata to your asset.
       **/
      metadataDepositBase: u128 & AugmentedConst<ApiType>;
      /**
       * The additional funds that must be reserved for the number of bytes you store in your
       * metadata.
       **/
      metadataDepositPerByte: u128 & AugmentedConst<ApiType>;
      /**
       * Max number of items to destroy per `destroy_accounts` and `destroy_approvals` call.
       * 
       * Must be configured to result in a weight that makes each call fit in a block.
       **/
      removeItemsLimit: u32 & AugmentedConst<ApiType>;
      /**
       * The maximum length of a name or symbol stored on-chain.
       **/
      stringLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Generic const
       **/
      [key: string]: Codec;
    };
    balances: {
      /**
       * The minimum amount required to keep an account open. MUST BE GREATER THAN ZERO!
       * 
       * If you *really* need it to be zero, you can enable the feature `insecure_zero_ed` for
       * this pallet. However, you do so at your own risk: this will open up a major DoS vector.
       * In case you have multiple sources of provider references, you may also get unexpected
       * behaviour if you set this to zero.
       * 
       * Bottom line: Do yourself a favour and make it at least one!
       **/
      existentialDeposit: u128 & AugmentedConst<ApiType>;
      /**
       * The maximum number of individual freeze locks that can exist on an account at any time.
       **/
      maxFreezes: u32 & AugmentedConst<ApiType>;
      /**
       * The maximum number of holds that can exist on an account at any time.
       **/
      maxHolds: u32 & AugmentedConst<ApiType>;
      /**
       * The maximum number of locks that should exist on an account.
       * Not strictly enforced, but used for weight estimation.
       **/
      maxLocks: u32 & AugmentedConst<ApiType>;
      /**
       * The maximum number of named reserves that can exist on an account.
       **/
      maxReserves: u32 & AugmentedConst<ApiType>;
      /**
       * Generic const
       **/
      [key: string]: Codec;
    };
    contracts: {
      /**
       * Fallback value to limit the storage deposit if it's not being set by the caller.
       **/
      defaultDepositLimit: u128 & AugmentedConst<ApiType>;
      /**
       * The amount of balance a caller has to pay for each byte of storage.
       * 
       * # Note
       * 
       * Changing this value for an existing chain might need a storage migration.
       **/
      depositPerByte: u128 & AugmentedConst<ApiType>;
      /**
       * The amount of balance a caller has to pay for each storage item.
       * 
       * # Note
       * 
       * Changing this value for an existing chain might need a storage migration.
       **/
      depositPerItem: u128 & AugmentedConst<ApiType>;
      /**
       * The maximum length of a contract code in bytes. This limit applies to the instrumented
       * version of the code. Therefore `instantiate_with_code` can fail even when supplying
       * a wasm binary below this maximum size.
       * 
       * The value should be chosen carefully taking into the account the overall memory limit
       * your runtime has, as well as the [maximum allowed callstack
       * depth](#associatedtype.CallStack). Look into the `integrity_test()` for some insights.
       **/
      maxCodeLen: u32 & AugmentedConst<ApiType>;
      /**
       * The maximum length of the debug buffer in bytes.
       **/
      maxDebugBufferLen: u32 & AugmentedConst<ApiType>;
      /**
       * The maximum allowable length in bytes for storage keys.
       **/
      maxStorageKeyLen: u32 & AugmentedConst<ApiType>;
      /**
       * Cost schedule and limits.
       **/
      schedule: PalletContractsSchedule & AugmentedConst<ApiType>;
      /**
       * Make contract callable functions marked as `#[unstable]` available.
       * 
       * Contracts that use `#[unstable]` functions won't be able to be uploaded unless
       * this is set to `true`. This is only meant for testnets and dev nodes in order to
       * experiment with new features.
       * 
       * # Warning
       * 
       * Do **not** set to `true` on productions chains.
       **/
      unsafeUnstableInterface: bool & AugmentedConst<ApiType>;
      /**
       * Generic const
       **/
      [key: string]: Codec;
    };
    system: {
      /**
       * Maximum number of block number to block hash mappings to keep (oldest pruned first).
       **/
      blockHashCount: u32 & AugmentedConst<ApiType>;
      /**
       * The maximum length of a block (in bytes).
       **/
      blockLength: FrameSystemLimitsBlockLength & AugmentedConst<ApiType>;
      /**
       * Block & extrinsics weights: base values and limits.
       **/
      blockWeights: FrameSystemLimitsBlockWeights & AugmentedConst<ApiType>;
      /**
       * The weight of runtime database operations the runtime can invoke.
       **/
      dbWeight: SpWeightsRuntimeDbWeight & AugmentedConst<ApiType>;
      /**
       * The designated SS58 prefix of this chain.
       * 
       * This replaces the "ss58Format" property declared in the chain spec. Reason is
       * that the runtime should know about the prefix in order to make use of it as
       * an identifier of the chain.
       **/
      ss58Prefix: u16 & AugmentedConst<ApiType>;
      /**
       * Get the chain's current version.
       **/
      version: SpVersionRuntimeVersion & AugmentedConst<ApiType>;
      /**
       * Generic const
       **/
      [key: string]: Codec;
    };
    timestamp: {
      /**
       * The minimum period between blocks. Beware that this is different to the *expected*
       * period that the block production apparatus provides. Your chosen consensus system will
       * generally work with this to determine a sensible block time. e.g. For Aura, it will be
       * double this period on default settings.
       **/
      minimumPeriod: u64 & AugmentedConst<ApiType>;
      /**
       * Generic const
       **/
      [key: string]: Codec;
    };
    transactionPayment: {
      /**
       * A fee mulitplier for `Operational` extrinsics to compute "virtual tip" to boost their
       * `priority`
       * 
       * This value is multipled by the `final_fee` to obtain a "virtual tip" that is later
       * added to a tip component in regular `priority` calculations.
       * It means that a `Normal` transaction can front-run a similarly-sized `Operational`
       * extrinsic (with no tip), by including a tip value greater than the virtual tip.
       * 
       * ```rust,ignore
       * // For `Normal`
       * let priority = priority_calc(tip);
       * 
       * // For `Operational`
       * let virtual_tip = (inclusion_fee + tip) * OperationalFeeMultiplier;
       * let priority = priority_calc(tip + virtual_tip);
       * ```
       * 
       * Note that since we use `final_fee` the multiplier applies also to the regular `tip`
       * sent with the transaction. So, not only does the transaction get a priority bump based
       * on the `inclusion_fee`, but we also amplify the impact of tips applied to `Operational`
       * transactions.
       **/
      operationalFeeMultiplier: u8 & AugmentedConst<ApiType>;
      /**
       * Generic const
       **/
      [key: string]: Codec;
    };
    utility: {
      /**
       * The limit on the number of batched calls.
       **/
      batchedCallsLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Generic const
       **/
      [key: string]: Codec;
    };
  } // AugmentedConsts
} // declare module
