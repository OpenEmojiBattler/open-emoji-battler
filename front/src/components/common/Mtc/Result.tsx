import * as React from "react"

import { ResultState, MtcState, findEmoBase, getEmoBaseEmoji } from "~/misc/mtcUtils"
import { Emo } from "~/components/common/Emo"
import { useGlobalAsync } from "~/components/App/ChainProvider/tasks"

export function Result(props: {
  mtcState: MtcState
  resultState: ResultState
  startAgain: () => void
}) {
  const emoBases = useGlobalAsync().emoBases

  return (
    <section className={"section"}>
      <div className={"container"}>
        <nav className={"level"}>
          <div className={"level-left"}>
            <div className={"level-item"}>
              <h1 className={"title"}>Result</h1>
            </div>
          </div>
          <div className={"level-right"}>
            <div className={"level-item"}>
              <button className={"button is-strong"} onClick={props.startAgain}>
                Play Again
              </button>
            </div>
          </div>
        </nav>
        <div style={{ textAlign: "center" }}>
          <h2 className={"title"}>
            <Ranking place={props.resultState.place} />
          </h2>
          <Ep previousEp={props.mtcState.previousEp} newEp={props.resultState.ep} />
          <div className={"block"}>
            <div className={"emo-group emo-group-highlight"}>
              <div className={"emo-group-line emo-group-line-center emo-group-line-emo"}>
                {props.mtcState.board.map((e, i) => {
                  const base = findEmoBase(e.base_id, emoBases)
                  return (
                    <Emo
                      key={i}
                      emoji={getEmoBaseEmoji(base)}
                      typ={base.typ}
                      grade={base.grade.toString()}
                      attributes={e.attributes}
                      isInactive={false}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Ranking(props: { place: number }) {
  let cssClass = ""
  if (props.place === 1) {
    cssClass = "first-place-text"
  }
  if (props.place === 2) {
    cssClass = "second-place-text"
  }

  return <span className={cssClass}>{getRankingString(props.place)}</span>
}

function Ep(props: { previousEp: number; newEp: number }) {
  const epDiffText =
    props.newEp >= props.previousEp
      ? `+${props.newEp - props.previousEp}`
      : `-${props.previousEp - props.newEp}`

  return (
    <div className={"block"}>
      EP (Emoji Power) {epDiffText}
      <br />
      <strong>{props.newEp}</strong>
    </div>
  )
}

const getRankingString = (n: number) => {
  switch (n) {
    case 1:
      return "1st Place!!"
    case 2:
      return "2nd Place!"
    case 3:
      return "3rd Place"
    case 4:
      return "4th Place"
    default:
      throw new Error("not implemented")
  }
}
