import { createContext, useContext } from "react"
import type BN from "bn.js"
import type { Vec, Option, u16, u64 } from "@polkadot/types-codec"
import type { ITuple } from "@polkadot/types-codec/types"
import type { AccountId, BlockNumber } from "@polkadot/types/interfaces/runtime"
import type { ApiPromise } from "@polkadot/api"
import type { Signer } from "@polkadot/api/types"

import type {
  mtc_Emo,
  mtc_Ghost,
  mtc_shop_PlayerOperation,
  mtc_storage_PlayerMutable,
} from "common"
import type { EmoBases } from "~/misc/types"

import type { ConnectionKind } from "~/misc/constants"

export interface Connection {
  kind: ConnectionKind
  query: {
    deckFixedEmoBaseIds: () => Promise<Vec<u16>>
    deckBuiltEmoBaseIds: () => Promise<Vec<u16>>
    matchmakingGhostsInfo: (band: number) => Promise<Option<Vec<ITuple<[BlockNumber, AccountId]>>>>
    matchmakingGhostByIndex: (band: number, index: number) => Promise<Option<mtc_Ghost>>
    leaderboard: () => Promise<Vec<ITuple<[u16, AccountId]>>>
    playerEp: (address: string) => Promise<Option<u16>>
    playerSeed: (address: string) => Promise<Option<u64>>
    playerMtcImmutable: (
      address: string
    ) => Promise<Option<ITuple<[Vec<mtc_Emo>, Vec<ITuple<[AccountId, mtc_Ghost]>>]>>>
    playerMtcMutable: (address: string) => Promise<Option<mtc_storage_PlayerMutable>>
  }
  tx: {
    startMtc: (deckEmoBaseIds: string[], account: Account, powSolution?: BN) => Promise<void>
    finishMtcShop: (
      ops: mtc_shop_PlayerOperation[],
      account: Account,
      powSolution?: BN
    ) => Promise<void>
  }
  emoBases: EmoBases
  api: () => ApiPromise
  transformAddress: (address: string) => string
}

export type Account =
  | { kind: "chain"; address: string; player: AccountChainPlayer; session: AccountChainSession }
  | { kind: "contract"; address: string; signer: Signer }

export interface AccountChainPlayer {
  address: string
  powCount: number
  signer: Signer
}

export interface AccountChainSession {
  address: string
  mnemonic: string
  powCount: number
  isActive: boolean
}

export const ConnectionContext = createContext<Connection | null>(null)
export const useConnection = () => {
  const connection = useContext(ConnectionContext)
  if (!connection) {
    throw new Error("ConnectionContext not provided")
  }
  return connection
}

export const ConnectionSetterContext = createContext<React.Dispatch<
  React.SetStateAction<Connection | null>
> | null>(null)
export const useConnectionSetter = () => {
  const setter = useContext(ConnectionSetterContext)
  if (!setter) {
    throw new Error("ConnectionSetterContext not provided")
  }
  return setter
}

export const AccountContext = createContext<Account | null>(null)
export const useAccount = () => {
  const account = useContext(AccountContext)
  if (!account) {
    throw new Error("AccountContext not provided")
  }
  return account
}

export const AccountSetterContext = createContext<React.Dispatch<
  React.SetStateAction<Account | null>
> | null>(null)
export const useAccountSetter = () => {
  const setter = useContext(AccountSetterContext)
  if (!setter) {
    throw new Error("AccountSetterContext not provided")
  }
  return setter
}

export const useAccountUpdater = () => {
  const setter = useAccountSetter()
  return (f: (a: Account) => Account) =>
    setter((a) => {
      if (!a) {
        throw new Error("invalid account state")
      }
      return f(a)
    })
}
