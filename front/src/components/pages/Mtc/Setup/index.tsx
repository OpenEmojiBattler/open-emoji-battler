import * as React from "react"
import BN from "bn.js"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"

import { Decks } from "./Decks"
import { PowButton } from "~/components/common/PowButton"
import { useAccount } from "~/components/App/Frame/tasks"
import { Accounts } from "./Accounts"

export function Setup(props: {
  injectedAccounts: InjectedAccountWithMeta[]
  builtEmoBaseIds: string[]
  startMtc: (solution: BN, deckEmoBaseIds: string[]) => void
  ep: number
  message: string
}) {
  const account = useAccount()
  const [hasPowButton, setHasPowButton] = React.useState(true)
  const [deck, setDeck] = React.useState<string[]>([])

  const startMtc = async (solution: BN) => {
    setHasPowButton(false)
    props.startMtc(solution, deck)
  }

  return (
    <section className="section">
      <div className={"container"}>
        <nav className={"level"} style={{ alignItems: "flex-start" }}>
          <div className={"level-left"}></div>
          <div className={"level-right"}>
            <div className={"level-item"}>
              <div style={{ width: "270px", marginRight: "8px" }}>
                <small>
                  No fee required but you are going to see a PoW solution on the tip field of the
                  popup.
                </small>
              </div>
              <div>
                {hasPowButton ? (
                  <PowButton
                    account={account.session.isActive ? account.session : account.player}
                    onClick={startMtc}
                  >
                    Start
                  </PowButton>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
        </nav>
        <h1 className={"title"}>Account</h1>
        <Accounts ep={props.ep} injectedAccounts={props.injectedAccounts} />
        <div className={"block"}>
          <small>{props.message}</small>
        </div>
        <h1 className={"title"}>Deck</h1>
        <Decks builtEmoBaseIds={props.builtEmoBaseIds} setDeck={setDeck} />
      </div>
    </section>
  )
}
