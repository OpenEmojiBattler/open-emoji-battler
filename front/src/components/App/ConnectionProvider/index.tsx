import * as React from "react"

import {
  ConnectionContext,
  ConnectionSetterContext,
  AccountContext,
  AccountSetterContext,
} from "./tasks"
import type { Connection, Account } from "./tasks"

export function ConnectionProvider(props: { children: React.ReactNode }) {
  const [connection, setConnection] = React.useState<Connection | null>(null)
  const [account, setAccount] = React.useState<Account | null>(null)

  return (
    <ConnectionContext.Provider value={connection}>
      <ConnectionSetterContext.Provider value={setConnection}>
        <AccountContext.Provider value={account}>
          <AccountSetterContext.Provider value={setAccount}>
            {props.children}
          </AccountSetterContext.Provider>
        </AccountContext.Provider>
      </ConnectionSetterContext.Provider>
    </ConnectionContext.Provider>
  )
}
