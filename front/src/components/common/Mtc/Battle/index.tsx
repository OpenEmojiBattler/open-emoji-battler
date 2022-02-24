import * as React from "react"

import { MtcState, getGradeText, getHealthFromState, getShortAddress } from "~/misc/mtcUtils"
import { getGradeAndGhostBoard } from "~/wasm"
import { isDevelopment } from "~/misc/env"
import { zeroAddress } from "~/misc/constants"
import { AccountContext } from "~/components/App/ConnectionProvider/tasks"
import { animateFinish } from "./tasks"

import { MtcBattleBoards } from "~/components/common/MtcBattleBoards"
import { Identicon } from "~/components/common/Identicon"

export function Battle(props: { mtcState: MtcState; finish: () => void }) {
  const account = React.useContext(AccountContext)

  const playerAddress = account ? account.address : zeroAddress
  const gradeAndBoardGhost = getGradeAndGhostBoard(
    props.mtcState.ghosts[props.mtcState.battleGhostIndex].history,
    props.mtcState.ghostStates[props.mtcState.battleGhostIndex],
    props.mtcState.turn
  )

  const rivalAddress = props.mtcState.ghostAddressesAndEps[props.mtcState.battleGhostIndex].address
  const rivalHealth = getHealthFromState(
    props.mtcState.ghostStates[props.mtcState.battleGhostIndex]
  )

  return (
    <section className={"section"}>
      <div className={"container"}>
        <nav className={"level"}>
          <div className={"level-left"}>
            <div className={"level-item"}>
              <h1 className={"title"}>Battle</h1>
            </div>
          </div>
          <div className={"level-right"}>
            <div className={"level-item"}>
              <button className={"button is-strong"} onClick={props.finish}>
                Next
              </button>
            </div>
          </div>
        </nav>
        <div id={"mtc-battle"} style={{ textAlign: "center" }}>
          <PlayerBox
            address={rivalAddress}
            name={null}
            health={rivalHealth}
            grade={gradeAndBoardGhost.grade.toString()}
            isPlayer={false}
          />
          <MtcBattleBoards
            board={props.mtcState.board}
            ghostBoard={gradeAndBoardGhost.board}
            seed={props.mtcState.seed}
            hasReplayButton={isDevelopment}
            onFinish={(playerBoardGrade: number, rivalBoardGrade: number) =>
              animateFinish(
                props.mtcState.grade,
                gradeAndBoardGhost.grade.toNumber(),
                playerBoardGrade,
                rivalBoardGrade,
                props.mtcState.health,
                rivalHealth
              )
            }
          />
          <PlayerBox
            address={playerAddress}
            name={"You"}
            health={props.mtcState.health}
            grade={`${props.mtcState.grade}`}
            isPlayer={true}
          />
        </div>
      </div>
    </section>
  )
}

function PlayerBox(props: {
  address: string
  name: string | null
  health: number
  grade: string
  isPlayer: boolean
}) {
  return (
    <div className={"block"}>
      <div
        id={`mtc-battle-${props.isPlayer ? "player" : "rival"}-box`}
        className={"player-icon-and-text-box"}
      >
        <div className={"player-icon-and-text-box-main"}>
          <div>
            <Identicon address={props.address} size={48} />
          </div>
          <div>
            <strong>{props.name ? props.name : getShortAddress(props.address)}</strong>
            <br />
            Health <strong className={"mtc-battle-player-box-health"}>{props.health}</strong>, Grade{" "}
            <span className={"mtc-battle-player-box-grade"}>{getGradeText(props.grade)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
