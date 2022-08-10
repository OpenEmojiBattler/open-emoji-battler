import * as React from "react"

import { Identicon } from "~/components/common/Identicon"
import { AccountsDropdown } from "~/components/common/AccountsDropdown"
import { useAccount } from "~/components/App/ConnectionProvider/tasks"
import { ExtensionAccount } from "~/misc/accountUtils"

export function Accounts(props: {
  ep: number
  rank: number | null
  extensionAccounts: ExtensionAccount[]
}) {
  const playerAddress = useAccount().address
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
              EP (Emoji Power)
              <br />
              <strong>{props.ep}</strong> {props.rank ? <span>(Rank: {props.rank})</span> : <></>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
