import * as React from "react"

import { EmoBase } from "~/components/common/Emo"
import { MtcShopBoard } from "../common/MtcShopBoard"
import { MtcBattleBoards } from "../common/MtcBattleBoards"
import { GlobalAsyncContext, useGlobalAsync } from "~/components/App/Frame/tasks"
import { Loading } from "../common/Loading"
import { createType, emo_Base, mtc_Board } from "common"

export function MtcDebug() {
  const globalAsync = React.useContext(GlobalAsyncContext)
  const [phase, setPhase] = React.useState<"shop" | "battle">("shop")
  const [board, setBoardEmos] = React.useState<mtc_Board>(() => createType("mtc_Board", []))

  if (!globalAsync) {
    return <Loading />
  }

  const finishBattle = () => {
    setPhase("shop")
  }

  let e
  if (phase === "shop") {
    e = <Shop startBattle={() => setPhase("battle")} board={board} updateBoardEmos={setBoardEmos} />
  } else {
    e = <Battle board={board} finishBattle={finishBattle} />
  }

  return (
    <section className="section">
      <div className={"container"}>{e}</div>
    </section>
  )
}

let mtcEmoIdGenerator = 1

function Shop(props: {
  startBattle: () => void
  board: mtc_Board
  updateBoardEmos: (board: mtc_Board) => void
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
        <BasesMemo
          selectBase={setSelectedBase}
          // disabled={isBoardOperating}
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
            props.updateBoardEmos(board)
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

const BasesMemo = React.memo(Bases)

function Bases(props: {
  selectBase: (m: emo_Base) => void
  // disabled: boolean
}) {
  const bases = Array.from(useGlobalAsync().emoBases.codec[0].values())

  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {bases
        .sort((a, b) => a.grade.toNumber() - b.grade.toNumber())
        .map((m) => (
          <div key={m.id.toString()} style={{ padding: "2px" }}>
            <button
              className={"button is-small"}
              // disabled={props.disabled}
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

function Battle(props: { board: mtc_Board; finishBattle: () => void }) {
  const ghostBoardEmos = createType(
    "mtc_GhostBoard",
    props.board.map((e) => ({
      base_id: e.base_id,
      attributes: e.attributes,
    }))
  )
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
          ghostBoard={ghostBoardEmos}
          seed={seed}
          hasReplayButton={true}
        />
      </div>
    </>
  )
}
