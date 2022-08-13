import * as React from "react"

import { getEnv } from "common"

import { getEndpoint, setEndpoint } from "../App/ConnectionProvider/Chain/tasks"
import { getOebEnv } from "~/misc/env"
import { ConnectionContext } from "~/components/App/ConnectionProvider/tasks"
import { InternalLink } from "../common/InternalLink"

export function Dev() {
  return (
    <section className="section">
      <div className="container">
        <Versions />
        <Endpoint />
        <li>
          <InternalLink to={"/match_debug"}>match debugger</InternalLink>
        </li>
        <li>
          <InternalLink to={"/emo_ability_builder"}>ability builder</InternalLink>
        </li>
      </div>
    </section>
  )
}

function Versions() {
  const connection = React.useContext(ConnectionContext)
  const [spec, setSpec] = React.useState("")

  React.useEffect(() => {
    if (connection) {
      const a = connection.api()
      setSpec(`${a.runtimeVersion.specName.toString()}/${a.runtimeVersion.specVersion.toNumber()}`)
    }
  }, [!connection])

  return (
    <>
      <li>
        <strong>front version</strong>: {process.env.GIT_VERSION}
      </li>
      <li>
        <strong>chain runtime spec</strong>: {spec}
      </li>
    </>
  )
}

function Endpoint() {
  const connection = React.useContext(ConnectionContext)
  if (!connection) {
    return <></>
  }
  return connection.kind === "chain" ? <ChainEndpoint /> : <ContractEndpoint />
}

function ChainEndpoint() {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const change = () => {
    setEndpoint(inputRef.current!.value)
    window.location.reload()
  }

  const changeTo = (envName: string) => {
    setEndpoint(getEnv(envName).chainEndpoint)
    window.location.reload()
  }

  return (
    <li>
      <label>
        <strong>chain endpoint</strong>:
      </label>{" "}
      <input ref={inputRef} type="text" size={40} defaultValue={getEndpoint()} />{" "}
      <button onClick={change}>Change</button>
      {" / "}
      <button onClick={() => changeTo("production")}>Change to production</button>
      {" / "}
      <button onClick={() => changeTo("local")}>Change to local</button>
    </li>
  )
}

function ContractEndpoint() {
  return (
    <li>
      <label>
        <strong>chain endpoint</strong>:
      </label>{" "}
      <input disabled={true} type="text" size={40} defaultValue={getOebEnv().contract.endpoint} />{" "}
      <button disabled={true}>Change</button>
    </li>
  )
}
