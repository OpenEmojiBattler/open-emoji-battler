import * as React from "react"

import {
  BlockMessageSetterContext,
  ErrorModalMessageSetterContext,
  IsWasmReadyContext,
  NavSetterContext,
  WaitingSetterContext,
} from "./tasks"
import { Route } from "~/misc/constants"
import { init } from "~/wasm/raw"

import { Navbar } from "../Navbar"
import { Router } from "~/components/App/Router"
import { Footer } from "../Footer"
import { ModalWithoutClose } from "~/components/common/ModalWithoutClose"
import { ModalWithReload } from "~/components/common/ModalWithReload"
import { ConnectionProvider } from "../ConnectionProvider"

export function Frame(props: { route: Route }) {
  const [hasNav, setHasNav] = React.useState(true)
  const [blockMessage, setBlockMessage] = React.useState<string | null>(null)
  const [isWaiting, setIsWaiting] = React.useState(false)
  const [errorModalMessage, setErrorModalMessage] = React.useState<string | null>(null)
  const [isWasmReady, setIsWasmReady] = React.useState(false)

  React.useEffect(() => {
    init().then(() => {
      setIsWasmReady(true)
    })
  }, [])

  return (
    <>
      {hasNav ? <Navbar routeId={props.route.id} /> : <></>}
      {blockMessage ? (
        <ModalWithReload message={blockMessage} />
      ) : (
        <NavSetterContext.Provider value={setHasNav}>
          <BlockMessageSetterContext.Provider value={setBlockMessage}>
            <WaitingSetterContext.Provider value={setIsWaiting}>
              <ErrorModalMessageSetterContext.Provider value={setErrorModalMessage}>
                <IsWasmReadyContext.Provider value={isWasmReady}>
                  <ConnectionProvider>
                    <Router route={props.route} />
                  </ConnectionProvider>
                </IsWasmReadyContext.Provider>
              </ErrorModalMessageSetterContext.Provider>
            </WaitingSetterContext.Provider>
          </BlockMessageSetterContext.Provider>
        </NavSetterContext.Provider>
      )}
      <Footer />
      {isWaiting ? <WaitingModal /> : <></>}
      {errorModalMessage ? <ErrorModal message={errorModalMessage} /> : <></>}
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

function ErrorModal(props: { message: string }) {
  return (
    <ModalWithoutClose>
      <div style={{ textAlign: "center" }}>
        Error occurred:
        <br />
        {props.message}
      </div>
    </ModalWithoutClose>
  )
}
