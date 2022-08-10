import * as React from "react"
import { web3Accounts } from "@polkadot/extension-dapp"

import { Connection, ConnectionContext } from "~/components/App/ConnectionProvider/tasks"
import { web3EnableOEB, buildExtensionAccounts } from "~/misc/accountUtils"
import { translateLeaderboardCodec } from "~/misc/mtcUtils"

export function Leaderboard() {
  return (
    <section className="section">
      <div className="container">
        leaderboard
        <br />
        <Con />
      </div>
    </section>
  )
}

function Con() {
  const connection = React.useContext(ConnectionContext)

  if (connection) {
    return <Inner connection={connection} />
  } else {
    return <p>Loading...</p>
  }
}

function Inner(props: { connection: Connection }) {
  const [leaderboard, setLeaderboard] = React.useState<
    { rank: number; ep: number; address: string }[]
  >([])
  const [extensionAddresses, setExtensionAddresses] = React.useState<string[]>([])

  React.useEffect(() => {
    let isMounted = true

    props.connection.query.leaderboard().then((l) => {
      if (isMounted) {
        setLeaderboard(translateLeaderboardCodec(l))
      }
    })

    web3EnableOEB().then((exts) => {
      if (exts.length > 0) {
        web3Accounts().then((injectedAccounts) => {
          if (isMounted) {
            setExtensionAddresses(
              buildExtensionAccounts(injectedAccounts, props.connection).map(
                ({ address }) => address
              )
            )
          }
        })
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div>
      <div>Rank, Account, EP</div>
      {leaderboard.map((row) => {
        return (
          <div
            key={row.address}
            style={extensionAddresses.includes(row.address) ? { backgroundColor: "navy" } : {}}
          >
            {row.rank}, {row.address}, {row.ep}
          </div>
        )
      })}
    </div>
  )
}
