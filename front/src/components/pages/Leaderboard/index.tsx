import * as React from "react"
import { web3Accounts } from "@polkadot/extension-dapp"

import { Connection, ConnectionContext } from "~/components/App/ConnectionProvider/tasks"
import { web3EnableOEB, buildExtensionAccounts } from "~/misc/accountUtils"
import { translateLeaderboardCodec } from "~/misc/mtcUtils"

export function Leaderboard() {
  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Leaderboard</h1>
        <div className="block">TODO: text.</div>
        <div className="block">
          <Con />
        </div>
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
    <table className={"table"}>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Account</th>
          <th>EP</th>
        </tr>
      </thead>
      <tbody>
        {leaderboard.map(({ rank, ep, address }) => {
          return (
            <tr
              key={address}
              style={extensionAddresses.includes(address) ? { backgroundColor: "#222" } : {}}
            >
              <td>{rank}</td>
              <td>{address}</td>
              <td>{ep}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
