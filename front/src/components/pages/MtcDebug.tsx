import * as React from "react"

import { createType, emo_Base, mtc_Board, mtc_GhostBoard } from "common"

import { boardSize } from "~/misc/constants"

import { EmoBase } from "~/components/common/Emo"
import { MtcShopBoard } from "~/components/common/MtcShopBoard"
import { MtcBattleBoards } from "~/components/common/MtcBattleBoards"
import { GlobalAsyncContext, useGlobalAsync } from "~/components/App/Frame/tasks"
import { Loading } from "~/components/common/Loading"

export function MtcDebug() {
  const globalAsync = React.useContext(GlobalAsyncContext)
  const [phase, setPhase] = React.useState<"shop" | "battle">("shop")
  const [board, setBoard] = React.useState<mtc_Board>(() => createType("mtc_Board", []))
  const [ghostBoard, setGhostBoard] = React.useState<mtc_GhostBoard>(() =>
    createType("mtc_GhostBoard", [])
  )

  if (!globalAsync) {
    return <Loading />
  }

  const finishBattle = () => {
    setPhase("shop")
  }

  return (
    <section className="section">
      <div className={"container"}>
        {phase === "shop" ? (
          <Shop
            startBattle={() => setPhase("battle")}
            board={board}
            setBoard={setBoard}
            ghostBoard={ghostBoard}
            setGhostBoard={setGhostBoard}
          />
        ) : (
          <Battle board={board} ghostBoard={ghostBoard} finishBattle={finishBattle} />
        )}
      </div>
    </section>
  )
}

let mtcEmoIdGenerator = 1

function Shop(props: {
  startBattle: () => void
  board: mtc_Board
  setBoard: (board: mtc_Board) => void
  ghostBoard: mtc_GhostBoard
  setGhostBoard: (board: mtc_GhostBoard) => void
}) {
  const emoBases = useGlobalAsync().emoBases.codec[0]
  const [selectedBase, setSelectedBase] = React.useState<emo_Base | null>(null)
  const [isBoardOperating, setIsBoardOperating] = React.useState(false)

  if (emoBases.size < 1) {
    return <></>
  }

  return (
    <>
      <div className={"block"}>
        <Bases
          selectBase={setSelectedBase}
          disabled={isBoardOperating || props.board.length >= boardSize}
        />
      </div>
      <div className={"block"}>
        <MtcShopBoard
          board={props.board}
          preShopSeed={`${Math.round(Math.random() * 10000)}`}
          onStartOperation={(op) => {
            setIsBoardOperating(true)
            if (op.kind === "set") {
              setSelectedBase(null)
            }
          }}
          onFinishOperation={(_, board) => {
            setIsBoardOperating(false)
            props.setBoard(board)
          }}
          mtcEmoForSet={
            selectedBase
              ? createType("mtc_Emo", { id: `${mtcEmoIdGenerator++}`, base_id: selectedBase.id })
              : null
          }
        />
        <div style={{ display: "inline-block", width: "10px" }} />
        <MtcShopBoard
          board={ghostBoardToBoard(props.ghostBoard)}
          preShopSeed={`${Math.round(Math.random() * 10000)}`}
          onStartOperation={(op) => {
            setIsBoardOperating(true)
            if (op.kind === "set") {
              setSelectedBase(null)
            }
          }}
          onFinishOperation={(_, board) => {
            setIsBoardOperating(false)
            props.setGhostBoard(boardToGhostBoard(board))
          }}
          mtcEmoForSet={
            selectedBase
              ? createType("mtc_Emo", { id: `${mtcEmoIdGenerator++}`, base_id: selectedBase.id })
              : null
          }
        />
      </div>
      <div className={"block"}>
        <div className={"buttons"}>
          <button
            className={"button"}
            disabled={isBoardOperating || !selectedBase}
            onClick={() => setSelectedBase(null)}
          >
            Unselect Base
          </button>
          <button
            className={"button is-strong"}
            onClick={props.startBattle}
            disabled={isBoardOperating}
          >
            Start Battle
          </button>
        </div>
      </div>
    </>
  )
}

function Bases(props: { selectBase: (m: emo_Base) => void; disabled: boolean }) {
  const bases = Array.from(useGlobalAsync().emoBases.codec[0].values())

  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {bases
        .sort((a, b) => a.grade.toNumber() - b.grade.toNumber())
        .map((m) => (
          <div key={m.id.toString()} style={{ padding: "2px" }}>
            <button
              className={"button is-small"}
              disabled={props.disabled}
              onClick={() => props.selectBase(m)}
            >
              Buy
            </button>
            <EmoBase base={m} isTriple={false} isInactive={false} />
          </div>
        ))}
    </div>
  )
}

function Battle(props: { board: mtc_Board; ghostBoard: mtc_GhostBoard; finishBattle: () => void }) {
  const seed = `${Math.round(Math.random() * 10000)}`

  return (
    <>
      <div className={"block"}>
        <button className={"button"} onClick={props.finishBattle}>
          Next
        </button>
      </div>
      <div className={"block"}>
        <MtcBattleBoards
          board={props.board}
          ghostBoard={props.ghostBoard}
          seed={seed}
          hasReplayButton={true}
        />
      </div>
    </>
  )
}

const boardToGhostBoard = (board: mtc_Board) =>
  createType(
    "mtc_GhostBoard",
    board.map((e) => ({
      base_id: e.base_id,
      attributes: e.attributes,
    }))
  )

const ghostBoardToBoard = (ghostBoard: mtc_GhostBoard) =>
  createType(
    "mtc_Board",
    ghostBoard.map((e) => ({
      mtc_emo_ids: [],
      base_id: e.base_id,
      attributes: e.attributes,
    }))
  )
