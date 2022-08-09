import * as React from "react"

import { Connection, ConnectionContext } from "~/components/App/ConnectionProvider/tasks"

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
  const [leaderboard, setLeaderboard] = React.useState<{ ep: number; account: string }[]>([])

  React.useEffect(() => {
    let isMounted = true

    props.connection.query.leaderboard().then((l) => {
      if (isMounted) {
        setLeaderboard(l.toArray().map(([e, a]) => ({ ep: e.toNumber(), account: a.toString() })))
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div>
      {leaderboard.slice(0, 100).map((row, i) => {
        return (
          <div key={row.account}>
            {i + 1}, {row.account}, {row.ep}
          </div>
        )
      })}
    </div>
  )
}
