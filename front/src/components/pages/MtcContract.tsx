import * as React from "react"
import type { ApiPromise } from "@polkadot/api"
import { connect, getEnv, getStorageContract, queryContract } from "common"

export function MtcContract() {
  const [str, setStr] = React.useState("")
  const contractEnv = React.useMemo(getContractEnv, [])

  React.useEffect(() => {
    let api: ApiPromise
    ;(async () => {
      api = await connect(contractEnv.endpoint, false)
      const c = getStorageContract(api, contractEnv.storageAddress)
      const r = await queryContract(c, "getEmoBases", [])
      setStr(r.toString())
    })()

    return () => {
      if (api) {
        api.disconnect()
      }
    }
  }, [])

  return <p>{str}</p>
}

const getContractEnv = () => {
  return getEnv(process.env.OEB_ENV).contract
}
