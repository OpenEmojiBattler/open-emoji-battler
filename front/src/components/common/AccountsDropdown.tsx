import * as React from "react"

import { withToggleAsync } from "~/misc/utils"
import { Dropdown } from "~/components/common/Dropdown"
import { useWaitingSetter } from "~/components/App/Frame/tasks"
import { useAccountSetter, useConnection } from "~/components/App/ConnectionProvider/tasks"
import { ExtensionAccount, generateAccount } from "~/misc/accountUtils"

export function AccountsDropdown(props: { accounts: ExtensionAccount[]; playerAddress: string }) {
  const connection = useConnection()
  const setWaiting = useWaitingSetter()
  const setAccount = useAccountSetter()

  const items = props.accounts.map((account): [string, React.ReactNode] => {
    return [
      account.address,
      <span>
        {account.name || ""} {account.address}
      </span>,
    ]
  })

  const on = (address: string) => {
    if (address === props.playerAddress) {
      return
    }
    withToggleAsync(setWaiting, async () => {
      const r = await generateAccount(connection, address)
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
