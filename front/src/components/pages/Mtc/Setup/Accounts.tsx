import * as React from "react"

import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"

import { Identicon } from "~/components/common/Identicon"
import { AccountsDropdown } from "~/components/common/AccountsDropdown"
import { useAccount } from "~/components/App/ConnectionProvider/tasks"

export function Accounts(props: { ep: number; injectedAccounts: InjectedAccountWithMeta[] }) {
  const playerAddress = useAccount().address
  return (
    <>
      <div className={"block"}>
        <AccountsDropdown accounts={props.injectedAccounts} playerAddress={playerAddress} />
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
              <strong>{props.ep}</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
