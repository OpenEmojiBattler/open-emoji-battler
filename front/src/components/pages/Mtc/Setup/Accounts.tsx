import * as React from "react"

import { getPlayerFromLeaderboardCodec } from "~/misc/mtcUtils"
import { useConnection } from "~/components/App/ConnectionProvider/tasks"
import { Identicon } from "~/components/common/Identicon"
import { AccountsDropdown } from "~/components/common/AccountsDropdown"
import { useAccount } from "~/components/App/ConnectionProvider/tasks"
import { ExtensionAccount } from "~/misc/accountUtils"

type BestEpAndRank = { bestEp: number; rank: number }

export function Accounts(props: { ep: number; extensionAccounts: ExtensionAccount[] }) {
  const connection = useConnection()
  const playerAddress = useAccount().address
  const [bestEpAndRank, setBestEpAndRank] = React.useState<BestEpAndRank | null>(null)

  React.useEffect(() => {
    let isMounted = true
    connection.query.leaderboard().then((l) => {
      if (!isMounted) {
        return
      }
      const playerOnLeaderboard = getPlayerFromLeaderboardCodec(l, playerAddress)
      if (playerOnLeaderboard) {
        setBestEpAndRank({ bestEp: playerOnLeaderboard.ep, rank: playerOnLeaderboard.rank })
      }
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
              {bestEpAndRank ? (
                <>
                  <br />
                  <strong>Best EP</strong>: {bestEpAndRank.bestEp} (Rank: {bestEpAndRank.rank})
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
