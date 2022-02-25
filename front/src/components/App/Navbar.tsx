import * as React from "react"

import { getEnv } from "common"

import type { RouteId } from "~/misc/constants"
import { getOebEnv } from "~/misc/env"

import { InternalLink } from "../common/InternalLink"
import { getEndpoint as getChainEndpoint } from "./ConnectionProvider/Chain/tasks"

import SymbolSVG from "~/svg/symbol.svg"
import TypeSVG from "~/svg/type.svg"
import { getRouteConnectionKind } from "~/misc/route"

export function Navbar(props: { routeId: RouteId }) {
  return (
    <nav className={"navbar"}>
      <div className={"container"}>
        <div className={"navbar-brand"}>
          <InternalLink
            className={"navbar-item logo"}
            to={"/"}
            innerHTML={`${SymbolSVG}${TypeSVG}`}
          />
          <span className={"navbar-item"}>
            <NetName routeId={props.routeId} />
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

function NetName(props: { routeId: RouteId }) {
  const productionEnv = getEnv("production")

  const currentEndpoint =
    getRouteConnectionKind(props.routeId) === "contract"
      ? getOebEnv().contract.endpoint
      : getChainEndpoint()

  if (currentEndpoint === productionEnv.chainEndpoint) {
    return <span className={"tag"}>{productionEnv.name}</span>
  } else if (currentEndpoint === productionEnv.contract.endpoint) {
    return (
      <span className={"tag"} style={{ backgroundColor: "darkgoldenrod" }}>
        {productionEnv.contract.name}
      </span>
    )
  } else {
    return (
      <span className={"tag"} style={{ backgroundColor: "navy" }}>
        {currentEndpoint}
      </span>
    )
  }
}
