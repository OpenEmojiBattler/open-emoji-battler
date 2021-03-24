import { createContext, useContext } from "react"
import { getEnv } from "common"
import type { Account, EmoBases } from "../../../misc/types"

export const NavSetterContext = createContext<React.Dispatch<React.SetStateAction<boolean>> | null>(
  null
)
export const useNavSetter = () => {
  const setter = useContext(NavSetterContext)
  if (!setter) {
    throw new Error("NavSetterContext null")
  }
  return setter
}

export const BlockMessageSetterContext = createContext<React.Dispatch<
  React.SetStateAction<string | null>
> | null>(null)
export const useBlockMessageSetter = () => {
  const setter = useContext(BlockMessageSetterContext)
  if (!setter) {
    throw new Error("BlockMessageSetterContext null")
  }
  return setter
}

export const WaitingSetterContext = createContext<React.Dispatch<
  React.SetStateAction<boolean>
> | null>(null)
export const useWaitingSetter = () => {
  const setter = useContext(WaitingSetterContext)
  if (!setter) {
    throw new Error("WaitingSetterContext null")
  }
  return setter
}

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

export const GlobalAsyncContext = createContext<{ emoBases: EmoBases } | null>(null)
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

const endpointStorageKey = "endpointV1"

export const getEndpoint = () => {
  const endpoint = localStorage.getItem(endpointStorageKey)
  if (endpoint) {
    return endpoint
  }
  return getEnv(process.env.OEB_ENV).endpoint
}

export const setEndpoint = (endpoint: string) => {
  localStorage.setItem(endpointStorageKey, endpoint)
}
