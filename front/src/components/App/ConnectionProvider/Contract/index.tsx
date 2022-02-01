import * as React from "react"
import { ApiPromise } from "@polkadot/api"

import { connect } from "common"

import { useConnectionSetter } from "~/components/App/ConnectionProvider/tasks"
import { getContractEnv, buildConnection } from "./tasks"

export function Contract(props: { children: React.ReactNode }) {
  const setConnection = useConnectionSetter()

  React.useEffect(() => {
    const contractEnv = getContractEnv()
    let api: ApiPromise | undefined
    ;(async () => {
      api = await connect(contractEnv.endpoint, false)
      const connection = await buildConnection(api, contractEnv)
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
