import * as React from "react"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"

import {
  AccountContext,
  useAccountSetter,
  useBlockMessageSetter,
} from "~/components/App/Frame/tasks"
import { setupAccounts } from "~/misc/accountUtils"

import { Loading } from "~/components/common/Loading"
import { AccountsDropdown } from "~/components/common/AccountsDropdown"

export function FirstAirdrop() {
  const account = React.useContext(AccountContext)
  const setAccount = useAccountSetter()
  const setBlockMessage = useBlockMessageSetter()

  const [injectedAccounts, setInjectedAccounts] = React.useState<InjectedAccountWithMeta[]>([])
  const [isClaimable, setIsClaimable] = React.useState(false)

  React.useEffect(() => {
    setupAccounts(account).then((accounts) => {
      if (accounts.kind === "ok") {
        setAccount(accounts.account)
        setInjectedAccounts(accounts.injectedAccounts)
      } else {
        setBlockMessage(accounts.message)
      }
    })
  }, [])

  React.useEffect(() => {
    if (!account) {
      return
    }
    let isMounted = true

    // TODO: check state for account if eligible
    setIsClaimable(true)

    return () => {
      isMounted = false
    }
  }, [account && account.player.address])

  if (injectedAccounts.length === 0 || account === null) {
    return <Loading />
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Account</h1>
        <div className="block">
          <AccountsDropdown accounts={injectedAccounts} playerAddress={account.player.address} />
        </div>
        <div className="block">{isClaimable ? "claimable" : "not claimable"}</div>
        <div className="block">Claim Button</div>
      </div>
    </section>
  )
}
