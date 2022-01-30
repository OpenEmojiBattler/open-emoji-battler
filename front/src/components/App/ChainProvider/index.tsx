import * as React from "react"
import { ApiPromise } from "@polkadot/api"

import { connect } from "common"

import {
  GlobalAsyncContext,
  AccountContext,
  getEndpoint,
  AccountSetterContext,
  GlobalAsync,
} from "./tasks"
import { useIsWasmReady } from "~/components/App/Frame/tasks"
import type { EmoBases, Account } from "~/misc/types"

export function ChainProvider(props: { children: React.ReactNode }) {
  const [globalAsync, setGlobalAsync] = React.useState<GlobalAsync | null>(null)
  const [account, setAccount] = React.useState<Account | null>(null)

  const isWasmReady = useIsWasmReady()

  React.useEffect(() => {
    if (!isWasmReady) {
      return
    }

    let api: ApiPromise
    ;(async () => {
      if (globalAsync) {
        await globalAsync.api.disconnect()
      }

      api = await connect(getEndpoint())
      const bases = (await api.query.game.emoBases()).unwrap()
      const emoBases: EmoBases = {
        codec: bases,
        stringKey: new Map(Array.from(bases[0].entries()).map(([k, v]) => [k.toString(), v])),
      }

      setGlobalAsync({ api, emoBases })
    })()

    return () => {
      if (api) {
        api.disconnect()
      }
    }
  }, [isWasmReady])

  return (
    <GlobalAsyncContext.Provider value={globalAsync}>
      <AccountContext.Provider value={account}>
        <AccountSetterContext.Provider value={setAccount}>
          {props.children}
        </AccountSetterContext.Provider>
      </AccountContext.Provider>
    </GlobalAsyncContext.Provider>
  )
}
