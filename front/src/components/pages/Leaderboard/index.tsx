import * as React from "react"
import { web3Accounts } from "@polkadot/extension-dapp"

import { Connection, ConnectionContext } from "~/components/App/ConnectionProvider/tasks"
import { web3EnableOEB, buildExtensionAccounts } from "~/misc/accountUtils"
import { translateLeaderboardCodec } from "~/misc/mtcUtils"
import { queryKusamaAddressNames } from "./tasks"
import { ExternalLink } from "~/components/common/ExternalLink"

export function Leaderboard() {
  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Leaderboard</h1>
        <div className="block">
          The players featured below are top 100 in the best EP. Only players who complete matches
          at least once are counted.
          <br />
          See{" "}
          <ExternalLink href="https://forum.open-emoji-battler.community/t/topic/63">
            this post
          </ExternalLink>{" "}
          for details about this event round.
        </div>
        <div className="block">
          <ConnectionComponent />
        </div>
      </div>
    </section>
  )
}

function ConnectionComponent() {
  const connection = React.useContext(ConnectionContext)

  if (connection) {
    return <Table connection={connection} />
  } else {
    return <p>Loading...</p>
  }
}

function Table(props: { connection: Connection }) {
  const [leaderboard, setLeaderboard] = React.useState<
    { rank: number; ep: number; address: string }[]
  >([])
  const [addressNames, setAddressNames] = React.useState<Map<string, string>>(new Map())
  const [extensionAddresses, setExtensionAddresses] = React.useState<string[]>([])

  React.useEffect(() => {
    let isMounted = true

    props.connection.query.leaderboard().then((_leaders) => {
      if (isMounted) {
        const leaders = translateLeaderboardCodec(_leaders, props.connection)
        setLeaderboard(leaders)
        queryKusamaAddressNames(
          props.connection,
          leaders.map((l) => l.address)
        ).then(setAddressNames)
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
    <table className="table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Account</th>
          <th>Best EP</th>
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
              <td>
                {addressNames.has(address) ? (
                  <>
                    <strong>{addressNames.get(address)}</strong> ({address})
                  </>
                ) : (
                  <>{address}</>
                )}
              </td>
              <td>{ep}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
