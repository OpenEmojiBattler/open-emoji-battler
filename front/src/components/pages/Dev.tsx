import * as React from "react"

import { getEnv, getRuntimeVersion } from "common"

import { getEndpoint, setEndpoint, useIsConnected } from "../App/Frame/tasks"
import { InternalLink } from "../common/InternalLink"

export function Dev() {
  return (
    <section className="section">
      <div className={"container"}>
        <Versions />
        <Endpoint />
        <div className={"content"}>
          <ul>
            <li>
              <InternalLink to={"/match_debug"}>match debugger</InternalLink>
            </li>
            <li>
              <InternalLink to={"/emo_ability_builder"}>ability builder</InternalLink>
            </li>
            <li>
              <InternalLink to={"/style"}>style</InternalLink>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

function Versions() {
  const isConnected = useIsConnected()
  const [specVersion, setSpecVersion] = React.useState("")

  React.useEffect(() => {
    if (isConnected) {
      setSpecVersion(getRuntimeVersion().specVersion.toString())
    }
  }, [isConnected])

  return (
    <div className={"content"}>
      <ul>
        <li>front version: {process.env.GIT_VERSION}</li>
        <li>chain runtime spec version: {specVersion}</li>
      </ul>
    </div>
  )
}

function Endpoint() {
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
    <div>
      <label>Endpoint</label>{" "}
      <input ref={inputRef} type="text" size={50} defaultValue={getEndpoint()} />{" "}
      <button onClick={change}>Change</button>
      {" / "}
      <button onClick={() => changeTo("production")}>Change to PrototypeNet</button>
      {" / "}
      <button onClick={() => changeTo("local")}>Change to local</button>
    </div>
  )
}
