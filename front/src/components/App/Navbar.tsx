import * as React from "react"

import { getEnv } from "common"

import { InternalLink } from "../common/InternalLink"
import { getEndpoint } from "./Frame/tasks"

export function Navbar() {
  return (
    <nav className={"navbar"}>
      <div className={"container"}>
        <div className={"navbar-brand"}>
          <InternalLink className={"navbar-item"} to={"/"}>
            <strong className={"is-size-5"}>Open Emoji Battler</strong>
          </InternalLink>
          <span className={"navbar-item"}>
            <NetName />
          </span>
        </div>
        <div className={"navbar-menu"}>
          <div className={"navbar-start"}>
            <InternalLink className={"navbar-item"} to={"/emo_bases"}>
              EMOs
            </InternalLink>
            <InternalLink className={"navbar-item"} to={"/dev"}>
              Dev
            </InternalLink>
          </div>
        </div>
      </div>
    </nav>
  )
}

function NetName() {
  const endpoint = getEndpoint()

  if (endpoint === getEnv("production").endpoint) {
    return <span className={"tag"}>PrototypeNet</span>
  } else {
    return (
      <span className={"tag"} style={{ backgroundColor: "navy" }}>
        {endpoint}
      </span>
    )
  }
}
