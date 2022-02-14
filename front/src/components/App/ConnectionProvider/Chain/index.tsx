import * as React from "react"
import { ApiPromise } from "@polkadot/api"

import { connect } from "common"

import {
  useConnectionSetter,
  ConnectionContext,
  useAccountSetter,
} from "~/components/App/ConnectionProvider/tasks"
import { getEndpoint, buildConnection } from "./tasks"

export function Chain(props: { children: React.ReactNode }) {
  const connection = React.useContext(ConnectionContext)
  const setConnection = useConnectionSetter()
  const setAccount = useAccountSetter()

  React.useEffect(() => {
    let api: ApiPromise | undefined

    connect(getEndpoint())
      .then((a) => {
        api = a
        return buildConnection(api)
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
  if (connection && connection.kind !== "chain") {
    return <></>
  }

  return <>{props.children}</>
}
