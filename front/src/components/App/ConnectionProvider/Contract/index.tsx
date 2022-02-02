import * as React from "react"
import { ApiPromise } from "@polkadot/api"

import { connect } from "common"

import { useConnectionSetter, ConnectionContext } from "~/components/App/ConnectionProvider/tasks"
import { getContractEnv, buildConnection } from "./tasks"

export function Contract(props: { children: React.ReactNode }) {
  const connection = React.useContext(ConnectionContext)
  const setConnection = useConnectionSetter()

  React.useEffect(() => {
    const contractEnv = getContractEnv()

    let api: ApiPromise | undefined

    connect(contractEnv.endpoint, false)
      .then((a) => {
        api = a
        return buildConnection(api, contractEnv)
      })
      .then(setConnection)

    return () => {
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