import * as React from "react"

import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"

import { withToggleAsync } from "~/misc/utils"
import { Identicon } from "~/components/common/Identicon"
import { Dropdown } from "~/components/common/Dropdown"
import { useAccount, useAccountSetter, useWaitingSetter } from "~/components/App/Frame/tasks"
import { buildAndGeneratePlayerAndSessionAccounts } from "~/components/pages/Mtc/tasks"

export function Accounts(props: { ep: number; injectedAccounts: InjectedAccountWithMeta[] }) {
  const playerAddress = useAccount().player.address
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

function AccountsDropdown(props: { accounts: InjectedAccountWithMeta[]; playerAddress: string }) {
  const setWaiting = useWaitingSetter()
  const setAccount = useAccountSetter()

  const items = props.accounts.map((account): [string, React.ReactNode] => {
    return [
      account.address,
      <span>
        {account.meta.name || ""} {account.address}
      </span>,
    ]
  })

  const on = (address: string) => {
    if (address === props.playerAddress) {
      return
    }
    withToggleAsync(setWaiting, async () => {
      const r = await buildAndGeneratePlayerAndSessionAccounts(address)
      setAccount(r)
    })
  }

  return (
    <Dropdown
      items={items}
      selectedItemId={props.playerAddress}
      onItemSelection={on}
      isUp={false}
      height={null}
    />
  )
}
