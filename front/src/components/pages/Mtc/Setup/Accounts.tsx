import * as React from "react"

import {
  getPlayerFromLeaderboard,
  LeaderboardElement,
  translateLeaderboardCodec,
} from "~/misc/mtcUtils"
import { useConnection } from "~/components/App/ConnectionProvider/tasks"
import { Identicon } from "~/components/common/Identicon"
import { AccountsDropdown } from "~/components/common/AccountsDropdown"
import { useAccount } from "~/components/App/ConnectionProvider/tasks"
import { ExtensionAccount } from "~/misc/accountUtils"

export function Accounts(props: { ep: number; extensionAccounts: ExtensionAccount[] }) {
  const connection = useConnection()
  const playerAddress = useAccount().address

  const [leaderboard, setLeaderboard] = React.useState<LeaderboardElement[] | null>(null)
  const playerOnLeaderboard = leaderboard
    ? getPlayerFromLeaderboard(leaderboard, playerAddress)
    : null

  React.useEffect(() => {
    let isMounted = true

    connection.query.leaderboard().then((l) => {
      if (!isMounted) {
        return
      }
      setLeaderboard(translateLeaderboardCodec(l, connection))
    })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <>
      <div className={"block"}>
        <AccountsDropdown accounts={props.extensionAccounts} playerAddress={playerAddress} />
      </div>
      <div className={"block"}>
        <div className={"player-icon-and-text-box"}>
          <div className={"player-icon-and-text-box-main"}>
            <div>
              <Identicon address={playerAddress} size={48} />
            </div>
            <div>
              <strong>EP (Emoji Power)</strong>: {props.ep}
              {playerOnLeaderboard ? (
                <>
                  <br />
                  <strong>Best EP</strong>: {playerOnLeaderboard.ep} (Rank:{" "}
                  {playerOnLeaderboard.rank})
                </>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
