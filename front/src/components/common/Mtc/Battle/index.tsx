import * as React from "react"

import { MtcState, getGradeText, getHealthFromState, getShortAddress } from "~/misc/mtcUtils"
import { getGradeAndGhostBoard } from "~/wasm"
import { isDevelopment } from "~/misc/utils"
import { zeroAddress } from "~/misc/constants"
import { AccountContext } from "~/components/App/Frame/tasks"

import { MtcBattleBoards } from "~/components/common/MtcBattleBoards"
import { Identicon } from "~/components/common/Identicon"

export function Battle(props: { mtcState: MtcState; finish: () => void }) {
  const account = React.useContext(AccountContext)
  const [playerHealthDamage, setPlayerHealthDamage] = React.useState(0)
  const [rivalHealthDamage, setRivalHealthDamage] = React.useState(0)

  const playerAddress = account ? account.player.address : zeroAddress
  const gradeAndBoardGhost = getGradeAndGhostBoard(
    props.mtcState.ghosts[props.mtcState.battleGhostIndex].history,
    props.mtcState.ghostStates[props.mtcState.battleGhostIndex],
    props.mtcState.turn
  )

  const rivalAddress = props.mtcState.ghostAddressesAndEps[props.mtcState.battleGhostIndex].address
  const rivalHealth = getHealthFromState(
    props.mtcState.ghostStates[props.mtcState.battleGhostIndex]
  )

  const onBoardsFinish = (playerBoardGrade: number, rivalBoardGrade: number) => {
    if (playerBoardGrade !== 0) {
      setRivalHealthDamage(playerBoardGrade)
    }
    if (rivalBoardGrade !== 0) {
      setPlayerHealthDamage(rivalBoardGrade)
    }
  }

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
        <div style={{ textAlign: "center" }}>
          <PlayerBox
            address={rivalAddress}
            name={null}
            health={rivalHealth}
            healthDamage={rivalHealthDamage}
            grade={gradeAndBoardGhost.grade.toString()}
          />
          <MtcBattleBoards
            board={props.mtcState.board}
            ghostBoard={gradeAndBoardGhost.board}
            seed={props.mtcState.seed}
            hasReplayButton={isDevelopment}
            onFinish={onBoardsFinish}
          />
          <PlayerBox
            address={playerAddress}
            name={"Me"}
            health={props.mtcState.health}
            healthDamage={playerHealthDamage}
            grade={`${props.mtcState.grade}`}
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
  healthDamage: number
  grade: string
}) {
  return (
    <div className={"block"}>
      <div className={"player-icon-and-text-box"}>
        <div>
          <div>
            <Identicon address={props.address} size={48} />
          </div>
          <div>
            <strong>{props.name ? props.name : getShortAddress(props.address)}</strong>
            <br />
            Health{" "}
            <strong>
              {props.healthDamage === 0 ? (
                props.health
              ) : (
                <span style={{ color: "lightsalmon" }}>
                  {Math.max(props.health - props.healthDamage, 0)} (-{props.healthDamage})
                </span>
              )}
            </strong>
            , Grade <span>{getGradeText(props.grade)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
