import * as React from "react"

import { connect, query } from "common"

import {
  GlobalAsyncContext,
  AccountContext,
  BlockMessageSetterContext,
  getEndpoint,
  AccountSetterContext,
  NavSetterContext,
  WaitingSetterContext,
} from "./tasks"
import { Route } from "~/misc/constants"
import { init } from "~/wasm/raw"
import type { EmoBases, Account } from "~/misc/types"

import { Navbar } from "../Navbar"
import { Router } from "~/components/App/Router"
import { Footer } from "../Footer"
import { ModalWithoutClose } from "~/components/common/ModalWithoutClose"
import { ModalWithReload } from "~/components/common/ModalWithReload"

export function Frame(props: { route: Route }) {
  const [hasNav, setHasNav] = React.useState(true)
  const [blockMessage, setBlockMessage] = React.useState<string | null>(null)
  const [isWaiting, setIsWaiting] = React.useState(false)
  const [account, setAccount] = React.useState<Account | null>(null)
  const [globalAsync, setGlobalAsync] = React.useState<{ emoBases: EmoBases } | null>(null)

  React.useEffect(() => {
    Promise.all([connect(getEndpoint()).then(() => query((q) => q.game.emoBases())), init()]).then(
      ([_bases, _]) => {
        const bases = _bases.unwrap()
        const emoBases: EmoBases = {
          codec: bases,
          stringKey: new Map(Array.from(bases[0].entries()).map(([k, v]) => [k.toString(), v])),
        }
        setGlobalAsync((s) => ({ ...s, emoBases }))
      }
    )
  }, [])

  return (
    <>
      {hasNav ? <Navbar /> : <></>}
      {blockMessage ? (
        <ModalWithReload message={blockMessage} />
      ) : (
        <NavSetterContext.Provider value={setHasNav}>
          <BlockMessageSetterContext.Provider value={setBlockMessage}>
            <WaitingSetterContext.Provider value={setIsWaiting}>
              <AccountContext.Provider value={account}>
                <AccountSetterContext.Provider value={setAccount}>
                  <GlobalAsyncContext.Provider value={globalAsync}>
                    <Router route={props.route} />
                  </GlobalAsyncContext.Provider>
                </AccountSetterContext.Provider>
              </AccountContext.Provider>
            </WaitingSetterContext.Provider>
          </BlockMessageSetterContext.Provider>
        </NavSetterContext.Provider>
      )}
      <Footer />
      {isWaiting ? <WaitingModal /> : <></>}
    </>
  )
}

function WaitingModal() {
  return (
    <ModalWithoutClose>
      <div style={{ textAlign: "center" }}>
        <span className={"has-moon"}>
          Waiting...
          <br />
        </span>
      </div>
    </ModalWithoutClose>
  )
}
