import { createContext, useContext } from "react"

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

export const IsWasmReadyContext = createContext(false)
export const useIsWasmReady = () => useContext(IsWasmReadyContext)
