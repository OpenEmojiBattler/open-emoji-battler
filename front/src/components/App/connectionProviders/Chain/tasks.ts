import { createContext, useContext } from "react"
import type { ApiPromise } from "@polkadot/api"

import { getEnv } from "common"

import type { Account, EmoBases } from "~/misc/types"

export const AccountContext = createContext<Account | null>(null)
export const useAccount = () => {
  const account = useContext(AccountContext)
  if (!account) {
    throw new Error("AccountContext null")
  }
  return account
}

export const AccountSetterContext = createContext<React.Dispatch<
  React.SetStateAction<Account | null>
> | null>(null)
export const useAccountSetter = () => {
  const setter = useContext(AccountSetterContext)
  if (!setter) {
    throw new Error("AccountSetterContext null")
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

export type GlobalAsync = {
  api: ApiPromise
  emoBases: EmoBases
}
export const GlobalAsyncContext = createContext<GlobalAsync | null>(null)
export const useGlobalAsync = () => {
  const globalAsync = useContext(GlobalAsyncContext)
  if (!globalAsync) {
    throw new Error("GlobalAsyncContext not loaded")
  }
  return globalAsync
}

export const useIsConnected = () => {
  const globalAsync = useContext(GlobalAsyncContext)
  return !!globalAsync
}

const endpointStorageKey = "endpointV4"

export const getEndpoint = () => {
  const endpoint = localStorage.getItem(endpointStorageKey)
  if (endpoint) {
    return endpoint
  }
  return getEnv(process.env.OEB_ENV).chainEndpoint
}

export const setEndpoint = (endpoint: string) => {
  localStorage.setItem(endpointStorageKey, endpoint)
}
