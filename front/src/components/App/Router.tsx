import * as React from "react"

import type { Route, RouteId } from "~/misc/constants"

import { getRouteConnectionKind } from "~/misc/route"

import { Chain } from "./ConnectionProvider/Chain"
import { Contract } from "./ConnectionProvider/Contract"

import { Top } from "../pages/Top"
import { Mtc } from "../pages/Mtc"
import { EmoBases } from "../pages/EmoBases"
import { MtcTrial } from "../pages/MtcTrial"
import { Leaderboard } from "../pages/Leaderboard"
import { Dev } from "../pages/Dev"
import { MtcDebug } from "../pages/MtcDebug"
import { EmoAbilityBuilder } from "../pages/EmoAbilityBuilder"

export function Router(props: { route: Route }) {
  const kind = getRouteConnectionKind(props.route.id)
  const e = getElement(props.route.id)

  switch (kind) {
    case "chain":
      return <Chain>{e}</Chain>
    case "contract":
      return <Contract>{e}</Contract>
    case "none":
      return e
  }
}

const getElement = (routeId: RouteId): JSX.Element => {
  switch (routeId) {
    case "/":
      return <Top />
    case "/match":
      return <Mtc />
    case "/emo_bases":
      return <EmoBases />
    case "/match_trial":
      return <MtcTrial />
    case "/dev":
      return <Dev />
    case "/match_debug":
      return <MtcDebug />
    case "/emo_ability_builder":
      return <EmoAbilityBuilder />
    case "/match_contract":
      return <Mtc />
    case "/leaderboard":
      return <Leaderboard />
    case "/not_found":
      return <h1>page not found</h1>
  }
}
