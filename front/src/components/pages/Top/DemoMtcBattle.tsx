import { createType, mtc_Board, mtc_GhostBoard } from "common"
import * as React from "react"

import { GlobalAsync, GlobalAsyncContext } from "~/components/App/connectionProviders/Chain/tasks"
import { MtcBattleBoards } from "~/components/common/MtcBattleBoards"
import { buildEmoAttributesWithBase, findEmoBase } from "~/misc/mtcUtils"
import { shuffleArray } from "~/misc/utils"

export function DemoMtcBattle() {
  const globalAsync = React.useContext(GlobalAsyncContext)

  if (!globalAsync) {
    return <></>
  }

  return <Inner globalAsync={globalAsync} />
}

function Inner(props: { globalAsync: GlobalAsync }) {
  const [seed, setSeed] = React.useState<string | null>(null)
  const [board, setBoard] = React.useState<mtc_Board | null>(null)
  const [ghostBoard, setGhostBoard] = React.useState<mtc_GhostBoard | null>(null)

  React.useEffect(() => {
    let isMounted = true

    props.globalAsync.api.query.game.deckFixedEmoBaseIds().then((idsOpt) => {
      if (idsOpt.isNone) {
        return
      }
      const ids = idsOpt.unwrap().toArray()
      shuffleArray(ids)

      const _board = []
      const _ghostBoard = []

      for (const id of ids) {
        const base = findEmoBase(id, props.globalAsync.emoBases)

        if (base.grade.toNumber() > 2) {
          if (_board.length < 7) {
            _board.push(
              createType("mtc_BoardEmo", {
                mtc_emo_ids: [],
                base_id: id,
                attributes: buildEmoAttributesWithBase(base),
              })
            )
            continue
          }

          if (_ghostBoard.length < 7) {
            _ghostBoard.push(
              createType("mtc_GhostBoardEmo", {
                base_id: id,
                attributes: buildEmoAttributesWithBase(base),
              })
            )
            continue
          }

          break
        }
      }

      if (isMounted) {
        setSeed(`${Math.round(Math.random() * 10000)}`)
        setBoard(createType("mtc_Board", _board))
        setGhostBoard(createType("mtc_GhostBoard", _ghostBoard))
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  if (seed === null || board === null || ghostBoard === null) {
    return <></>
  }

  return (
    <MtcBattleBoards board={board} ghostBoard={ghostBoard} seed={seed} hasReplayButton={false} />
  )
}
