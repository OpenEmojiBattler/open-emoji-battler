import * as React from "react"
import BN from "bn.js"

import { useAccountUpdater } from "~/components/App/ChainProvider/tasks"
import { solvePow } from "~/misc/pow"
import type { PlayerAccount, SessionAccount } from "~/misc/types"

export function PowButton(props: {
  account: PlayerAccount | SessionAccount
  onClick: (solution: BN) => void
  disabled?: boolean
  children: React.ReactNode
}) {
  const updateAccount = useAccountUpdater()
  const [solution, setSolution] = React.useState<BN | null>(null)

  const disabled = props.disabled === undefined ? false : props.disabled

  React.useEffect(() => {
    setSolution(null)
    let isSubscribed = true

    solvePow(props.account.address, props.account.powCount).then((s) => {
      if (isSubscribed) {
        setSolution(s)
      }
    })

    return () => {
      isSubscribed = false
    }
  }, [props.account.address])

  const onClick = (s: BN) => {
    const account = props.account
    if ("mnemonic" in account) {
      updateAccount((a) => ({
        ...a,
        session: { ...account, powCount: account.powCount + 1 },
      }))
    } else {
      updateAccount((a) => ({
        ...a,
        player: { ...account, powCount: account.powCount + 1 },
      }))
    }
    props.onClick(s)
  }

  return solution ? (
    <button
      className={"button is-strong has-check"}
      onClick={() => onClick(solution)}
      disabled={disabled}
    >
      {props.children}
    </button>
  ) : (
    <button className={"button is-strong has-clock"} disabled={true}>
      {props.children}
    </button>
  )
}
