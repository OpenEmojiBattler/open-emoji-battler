import * as React from "react"
import BN from "bn.js"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"

import { initialEp } from "~/misc/constants"
import { Setup } from "../Setup"
import { setup } from "./tasks"
import { useBlockMessageSetter, useWaitingSetter } from "~/components/App/Frame/tasks"
import {
  useConnection,
  AccountContext,
  useAccountSetter,
} from "~/components/App/ConnectionProvider/tasks"
import { Loading } from "../../../common/Loading"

export function SetupWrapper(props: {
  startMtc: (deckEmoBaseIds: string[], previousEp: number, solution?: BN) => void
}) {
  const setWaiting = useWaitingSetter()
  const account = React.useContext(AccountContext)
  const setAccount = useAccountSetter()
  const setBlockMessage = useBlockMessageSetter()
  const connection = useConnection()

  const [injectedAccounts, setInjectedAccounts] = React.useState<InjectedAccountWithMeta[]>([])
  const [builtEmoBaseIds, setBuiltEmoBaseIds] = React.useState<string[]>([])
  const [ep, setEp] = React.useState<number | null>(null)
  const [message, setMessage] = React.useState("")

  React.useEffect(() => {
    setup(connection, setWaiting, account).then((r) => {
      if (r.kind === "ok") {
        setAccount(r.account)
        setInjectedAccounts(r.injectedAccounts)
        setBuiltEmoBaseIds(r.builtEmoBaseIds)
      } else {
        setBlockMessage(r.message)
      }
    })
  }, [])

  React.useEffect(() => {
    if (!account) {
      return
    }
    let isMounted = true
    connection.query.playerEp(account.address).then((e) => {
      if (isMounted) {
        const ep = e.isSome ? e.unwrap().toNumber() : initialEp
        setEp(ep)
      }
    })
    connection.query.playerPool(account.address).then((p) => {
      if (isMounted && p.isSome) {
        setMessage(
          "The previous match didn't normally finish, so the EP might decrease a little next time."
        )
      } else {
        setMessage("")
      }
    })
    return () => {
      isMounted = false
    }
  }, [account && account.address])

  return injectedAccounts.length > 0 && builtEmoBaseIds.length > 0 && account && ep ? (
    <Setup
      injectedAccounts={injectedAccounts}
      builtEmoBaseIds={builtEmoBaseIds}
      startMtc={(ids, s) => props.startMtc(ids, ep, s)}
      ep={ep}
      message={message}
    />
  ) : (
    <Loading />
  )
}
