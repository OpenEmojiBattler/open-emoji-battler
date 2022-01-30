import * as React from "react"
import BN from "bn.js"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"
import type { ApiPromise } from "@polkadot/api"

import { initialEp } from "~/misc/constants"
import { Setup } from "../Setup"
import { setup } from "./tasks"
import { useBlockMessageSetter, useWaitingSetter } from "~/components/App/Frame/tasks"
import { AccountContext, useAccountSetter } from "~/components/App/connectionProviders/Chain/tasks"
import { Loading } from "../../../common/Loading"

export function SetupWrapper(props: {
  api: ApiPromise
  startMtc: (solution: BN, deckEmoBaseIds: string[], previousEp: number) => void
}) {
  const setWaiting = useWaitingSetter()
  const account = React.useContext(AccountContext)
  const setAccount = useAccountSetter()
  const setBlockMessage = useBlockMessageSetter()

  const [injectedAccounts, setInjectedAccounts] = React.useState<InjectedAccountWithMeta[]>([])
  const [builtEmoBaseIds, setBuiltEmoBaseIds] = React.useState<string[]>([])
  const [ep, setEp] = React.useState<number | null>(null)
  const [message, setMessage] = React.useState("")

  React.useEffect(() => {
    setup(props.api, setWaiting, account).then((r) => {
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
    props.api.query.game.playerEp(account.player.address).then((e) => {
      if (isMounted) {
        const ep = e.isSome ? e.unwrap().toNumber() : initialEp
        setEp(ep)
      }
    })
    props.api.query.game.playerPool.size(account.player.address).then((p) => {
      if (isMounted && !p.isZero()) {
        setMessage(
          "The previous match didn't finish normally, and the EP might decrease a little next time."
        )
      } else {
        setMessage("")
      }
    })
    return () => {
      isMounted = false
    }
  }, [account && account.player.address])

  return injectedAccounts.length > 0 && builtEmoBaseIds.length > 0 && account && ep ? (
    <Setup
      injectedAccounts={injectedAccounts}
      builtEmoBaseIds={builtEmoBaseIds}
      startMtc={(s, ids) => props.startMtc(s, ids, ep)}
      ep={ep}
      message={message}
    />
  ) : (
    <Loading />
  )
}
