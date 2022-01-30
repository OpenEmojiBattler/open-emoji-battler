import * as React from "react"

import { mtc_Board, mtc_GhostBoard } from "common"

import { marchPvg } from "~/wasm"
import { useGlobalAsync } from "~/components/App/connectionProviders/Chain/tasks"
import { animate } from "./tasks"

export function MtcBattleBoards(props: {
  board: mtc_Board
  ghostBoard: mtc_GhostBoard
  seed: string
  hasReplayButton: boolean
  onFinish?: (boardGrade: number, ghostBoardGrade: number) => void
}) {
  const bases = useGlobalAsync().emoBases
  const playerBoardRef = React.useRef<HTMLDivElement>(null)
  const rivalBoardRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    let isMounted = true
    play().then(([boardGrade, ghostBoardGrade]) => {
      if (isMounted && props.onFinish) {
        props.onFinish(boardGrade, ghostBoardGrade)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const play = async () => {
    const [boardGrade, ghostBoardGrade, logs] = marchPvg(
      props.board,
      props.ghostBoard,
      props.seed,
      bases
    )
    await animate(
      playerBoardRef.current!,
      rivalBoardRef.current!,
      props.board,
      props.ghostBoard,
      logs,
      bases
    )
    return [boardGrade, ghostBoardGrade] as const
  }

  return (
    <>
      <div className={"block"} style={{ textAlign: "center" }}>
        <div className={"emo-group emo-group-highlight"}>
          <div
            className={"emo-group-line emo-group-line-center emo-group-line-emo"}
            ref={rivalBoardRef}
          />
          <br />
          <div
            className={"emo-group-line emo-group-line-center emo-group-line-emo"}
            ref={playerBoardRef}
          />
        </div>
      </div>
      {props.hasReplayButton ? (
        <div className={"block"}>
          <button className={"button"} onClick={play}>
            Replay
          </button>
        </div>
      ) : (
        <></>
      )}
    </>
  )
}
