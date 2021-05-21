import * as React from "react"

import type { Route } from "~/misc/constants"

import { Top } from "../pages/Top"
import { Mtc } from "../pages/Mtc"
import { EmoBases } from "../pages/EmoBases"
import { MtcTrial } from "../pages/MtcTrial"
import { Dev } from "../pages/Dev"
import { MtcDebug } from "../pages/MtcDebug"
import { EmoAbilityBuilder } from "../pages/EmoAbilityBuilder"
import { Style } from "../pages/Style"
import { FirstAirdrop } from "../pages/FirstAirdrop"

export function Router(props: { route: Route }) {
  switch (props.route.id) {
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
    case "/style":
      return <Style />
    case "/first_airdrop":
      return <FirstAirdrop />
    case "/not_found":
    default:
      return <h1>page not found</h1>
  }
}
