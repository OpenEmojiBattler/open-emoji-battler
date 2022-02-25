import * as React from "react"
import { ApiPromise } from "@polkadot/api"

import { connect } from "common"

import { getOebEnv } from "~/misc/env"
import {
  useConnectionSetter,
  ConnectionContext,
  useAccountSetter,
} from "~/components/App/ConnectionProvider/tasks"
import { buildConnection } from "./tasks"

export function Contract(props: { children: React.ReactNode }) {
  const connection = React.useContext(ConnectionContext)
  const setConnection = useConnectionSetter()
  const setAccount = useAccountSetter()

  React.useEffect(() => {
    const contractEnv = getOebEnv().contract

    let api: ApiPromise | undefined

    connect(contractEnv.endpoint, false)
      .then((a) => {
        api = a
        return buildConnection(api, contractEnv)
      })
      .then(setConnection)
      .catch(console.error)

    return () => {
      setAccount(null)
      setConnection(null)
      if (api) {
        api.disconnect()
      }
    }
  }, [])

  // wait for cleanup
  if (connection && connection.kind !== "contract") {
    return <></>
  }

  return <>{props.children}</>
}
