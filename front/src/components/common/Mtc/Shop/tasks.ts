import { createType, mtc_Board, mtc_shop_PlayerOperation } from "common"

import type { MtcState } from "~/misc/mtcUtils"
import type { Operation } from "~/components/common/MtcShopBoard/tasks"
import { moveArrayElement } from "~/misc/utils"
import { mulliganCount } from "~/misc/constants"

export interface State {
  currentCatalogLineIndex: number
  soldMtcEmoIds: string[]
  playerOperations: mtc_shop_PlayerOperation[]
  coin: number
  nextCatalogLineCounter: number
}

export const finishShopBoardOperation = (
  boardOperation: Operation,
  board: mtc_Board,
  coinDiff: number,
  mtcState: MtcState,
  setMtcState: React.Dispatch<React.SetStateAction<MtcState>>,
  shopState: State,
  setShopState: React.Dispatch<React.SetStateAction<State>>
) => {
  let newShopState = { ...shopState }

  newShopState.coin += coinDiff

  if (boardOperation.kind === "set") {
    newShopState.playerOperations.push(
      createType("mtc_shop_PlayerOperation", {
        Buy: { mtc_emo_id: boardOperation.mtcEmo.id, index: boardOperation.index },
      })
    )
  }

  if (boardOperation.kind === "sell") {
    newShopState.soldMtcEmoIds = [
      ...newShopState.soldMtcEmoIds,
      ...mtcState.board[boardOperation.index].mtc_emo_ids.map((i) => i.toString()),
    ]
    newShopState.playerOperations.push(
      createType("mtc_shop_PlayerOperation", {
        Sell: { index: boardOperation.index },
      })
    )
  }

  if (boardOperation.kind === "move") {
    const idx = boardOperation.index
    const isRight = boardOperation.isRight
    if (!mtcState.board[idx]) {
      throw new Error("invalid board index")
    }

    let toIdx = 0
    if (isRight) {
      if (!mtcState.board[idx + 1]) {
        throw new Error("no right emoji")
      }
      toIdx = idx + 1
    } else {
      if (idx < 1) {
        throw new Error("no left emoji")
      }
      toIdx = idx - 1
    }

    const lastOp = newShopState.playerOperations[shopState.playerOperations.length - 1]
    let indexes: string[]
    if (lastOp && lastOp.isMove) {
      const newOps = [...newShopState.playerOperations]
      newOps.pop()
      newShopState.playerOperations = newOps

      indexes = Array.from(lastOp.asMove.indexes).map((i) => `${i}`)
    } else {
      indexes = new Array(mtcState.board.length).fill(0).map((_, i) => `${i}`)
    }
    moveArrayElement(indexes, idx, toIdx)

    newShopState.playerOperations.push(
      createType("mtc_shop_PlayerOperation", { Move: { indexes } })
    )
  }

  setMtcState((s) => ({ ...s, board }))
  setShopState(newShopState)
}

export const isMulliganAvailable = (turn: number, nextCatalogLineCounter: number) =>
  turn === 1 && nextCatalogLineCounter < mulliganCount

export const isNextCatalogLineAvailable = (
  catalogLineCount: number,
  currentCatalogLineIndex: number
) => catalogLineCount - 2 >= currentCatalogLineIndex
