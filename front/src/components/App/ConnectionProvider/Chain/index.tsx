import * as React from "react"
import { ApiPromise } from "@polkadot/api"

import { connect } from "common"

import { useConnectionSetter } from "~/components/App/ConnectionProvider/tasks"
import { getEndpoint, buildConnection } from "./tasks"

export function Chain(props: { children: React.ReactNode }) {
  const setConnection = useConnectionSetter()

  React.useEffect(() => {
    let api: ApiPromise | undefined
    ;(async () => {
      api = await connect(getEndpoint())
      const connection = await buildConnection(api)
      setConnection(connection)
    })()

    return () => {
      if (api) {
        api.disconnect()
      }
      setConnection(null)
    }
  }, [])

  return <>{props.children}</>
}
