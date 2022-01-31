import * as React from "react"

import type { Route, RouteId } from "~/misc/constants"

import { Chain } from "./connectionProviders/Chain"
import { Top } from "../pages/Top"
import { Mtc } from "../pages/Mtc"
import { EmoBases } from "../pages/EmoBases"
import { MtcTrial } from "../pages/MtcTrial"
import { Dev } from "../pages/Dev"
import { MtcDebug } from "../pages/MtcDebug"
import { EmoAbilityBuilder } from "../pages/EmoAbilityBuilder"
import { MtcContract } from "../pages/MtcContract"

export function Router(props: { route: Route }) {
  const [kind, e] = getElement(props.route.id)

  switch (kind) {
    case "chain":
      return <Chain>{e}</Chain>
    case "contract":
      return e
    case "none":
      return e
  }
}

const getElement = (routeId: RouteId): ["chain" | "contract" | "none", JSX.Element] => {
  switch (routeId) {
    case "/":
      return ["chain", <Top />]
    case "/match":
      return ["chain", <Mtc />]
    case "/emo_bases":
      return ["chain", <EmoBases />]
    case "/match_trial":
      return ["chain", <MtcTrial />]
    case "/dev":
      return ["chain", <Dev />]
    case "/match_debug":
      return ["chain", <MtcDebug />]
    case "/emo_ability_builder":
      return ["none", <EmoAbilityBuilder />]
    case "/match_contract":
      return ["contract", <MtcContract />]
    case "/not_found":
    default:
      return ["none", <h1>page not found</h1>]
  }
}
