import * as React from "react"
import BN from "bn.js"

import {
  mtc_GhostState,
  mtc_Emo,
  mtc_Ghost,
  mtc_GhostBoard,
  mtc_shop_PlayerOperation,
  createType,
} from "common"

import { boardSize, nextCatalogLineCoin } from "~/misc/constants"
import {
  getGradeText,
  getShortAddress,
  getHealthFromState,
  getEmoBaseEmoji,
  findEmoBase,
  MtcState,
  GhostAddressAndEp,
} from "~/misc/mtcUtils"
import { get_initial_coin_by_turn, get_upgrade_coin } from "~/wasm/raw"
import { getCatalog, getGradeAndGhostBoard } from "~/wasm"
import { useConnection } from "~/components/App/ConnectionProvider/tasks"
import {
  State,
  finishShopBoardOperation,
  isMulliganAvailable,
  isNextCatalogLineAvailable,
} from "./tasks"

import { Nav, FinishFn } from "./Nav"
import { Catalog } from "./Catalog"
import { Emo } from "~/components/common/Emo"
import { MtcShopBoard } from "~/components/common/MtcShopBoard"
import { Identicon } from "~/components/common/Identicon"

type StartBattle = { kind: "pow" | "no-pow"; fn: (ops: mtc_shop_PlayerOperation[], s?: BN) => void }

export function Shop(props: {
  mtcState: MtcState
  setMtcState: React.Dispatch<React.SetStateAction<MtcState>>
  startBattle: StartBattle
}) {
  const catalog = React.useMemo(
    () => getCatalog(props.mtcState.pool, props.mtcState.board, props.mtcState.seed),
    []
  )
  const [shopState, setShopState] = React.useState<State>(() => ({
    currentCatalogLineIndex: 0,
    soldMtcEmoIds: [],
    playerOperations: [],
    coin: get_initial_coin_by_turn(props.mtcState.turn),
    nextCatalogLineCounter: 0,
  }))

  const preShopSeed = props.mtcState.seed
  if (!preShopSeed) {
    throw new Error("seed null, invalid state")
  }

  const [selectedCatalogLineEmo, setSelectedCatalogLineEmo] = React.useState<mtc_Emo | null>(null)
  const [selectedRivalIndex, setSelectedRivalIndex] = React.useState(
    props.mtcState.battleGhostIndex
  )
  const [isBoardOperating, setIsBoardOperating] = React.useState(false)

  const unselectCatalogLineEmo = () => {
    setSelectedCatalogLineEmo(null)
  }

  const isM = isMulliganAvailable(props.mtcState.turn, shopState.nextCatalogLineCounter)
  const nextCatalogLineFn =
    (shopState.coin >= nextCatalogLineCoin || isM) &&
    isNextCatalogLineAvailable(catalog.length, shopState.currentCatalogLineIndex)
      ? () => {
          unselectCatalogLineEmo()
          setShopState((s) => ({
            ...s,
            coin: isM ? s.coin : s.coin - nextCatalogLineCoin,
            currentCatalogLineIndex: s.currentCatalogLineIndex + 1,
            nextCatalogLineCounter: s.nextCatalogLineCounter + 1,
            playerOperations: [
              ...s.playerOperations,
              createType("mtc_shop_PlayerOperation", "NextCatalogLine"),
            ],
          }))
        }
      : null

  const finishFn: FinishFn =
    props.startBattle.kind === "pow"
      ? {
          kind: "pow",
          fn: (solution: BN) => props.startBattle.fn(shopState.playerOperations, solution),
        }
      : { kind: "no-pow", fn: () => props.startBattle.fn(shopState.playerOperations) }

  const _ids = [
    ...Array.from(
      new Set(props.mtcState.board.map((e) => e.mtc_emo_ids.map((i) => i.toString())).flat())
    ),
    ...shopState.soldMtcEmoIds,
  ]
  const ids = React.useMemo(() => _ids, [JSON.stringify(_ids)])

  const ctx = props.mtcState.ghosts

  const currentGhostBoard = React.useMemo(
    () =>
      getGradeAndGhostBoard(
        ctx[selectedRivalIndex].history,
        props.mtcState.ghostStates[selectedRivalIndex],
        props.mtcState.turn
      ).board,
    [selectedRivalIndex, props.mtcState.turn]
  )
  const finalGhostBoard = React.useMemo(
    () =>
      getGradeAndGhostBoard(
        ctx[selectedRivalIndex].history,
        props.mtcState.ghostStates[selectedRivalIndex],
        255
      ).board,
    [selectedRivalIndex]
  )

  const [isRivalBoardCurrent, setIsRivalBoardCurrent] = React.useState(true)

  return (
    <section className={"section"}>
      <div className={"container"}>
        <Nav
          health={props.mtcState.health}
          grade={props.mtcState.grade}
          upgradeFn={() => {
            const upgradeCoin = props.mtcState.upgradeCoin
            if (upgradeCoin === null) {
              throw new Error("invalid state: upgradeCoin null")
            }
            setShopState((s) => ({
              ...s,
              playerOperations: [
                ...s.playerOperations,
                createType("mtc_shop_PlayerOperation", "Upgrade"),
              ],
              coin: s.coin - upgradeCoin,
            }))
            props.setMtcState((s) => ({
              ...s,
              grade: s.grade + 1,
              upgradeCoin: get_upgrade_coin(s.grade + 2) || null,
            }))
          }}
          upgradeCoin={props.mtcState.upgradeCoin}
          nextCatalogLineFn={nextCatalogLineFn}
          finishFn={finishFn}
          coin={shopState.coin}
          turn={props.mtcState.turn}
          nextCatalogLineCounter={shopState.nextCatalogLineCounter}
          disabled={isBoardOperating}
        />
        <div style={{ display: "flex" }}>
          <div style={{ width: "50%" }}>
            <Catalog
              catalog={catalog}
              currentCatalogLineIndex={shopState.currentCatalogLineIndex}
              grade={props.mtcState.grade}
              selectEmoToBuy={setSelectedCatalogLineEmo}
              selectedEmoToBuy={selectedCatalogLineEmo}
              isMaxBoard={props.mtcState.board.length >= boardSize}
              coin={shopState.coin}
              unavailableToBuyMtcEmoIds={ids}
              disabled={isBoardOperating}
            />
          </div>
          <div style={{ width: "50%" }}>
            <h2 className={"title is-size-4"}>Your Board</h2>
            <div className={"block"}>
              <MtcShopBoard
                board={props.mtcState.board}
                preShopSeed={preShopSeed}
                onStartOperation={(op) => {
                  setIsBoardOperating(true)
                  if (op.kind === "set") {
                    unselectCatalogLineEmo()
                  }
                }}
                onFinishOperation={(op, board, coinDiff) => {
                  setIsBoardOperating(false)
                  finishShopBoardOperation(
                    op,
                    board,
                    coinDiff,
                    props.mtcState,
                    props.setMtcState,
                    shopState,
                    setShopState
                  )
                }}
                mtcEmoForSet={selectedCatalogLineEmo}
              />
            </div>
            <h2 className={"title is-size-4"}>Rivals</h2>
            <div className={"block"}>
              <RivalsToggle
                ghosts={props.mtcState.ghosts}
                ghostAddressesAndEps={props.mtcState.ghostAddressesAndEps}
                ghostStates={props.mtcState.ghostStates}
                battleGhostIndex={props.mtcState.battleGhostIndex}
                selectedGhostIndex={selectedRivalIndex}
                selectGhost={setSelectedRivalIndex}
                turn={props.mtcState.turn}
              />
            </div>
            <h3 className={"subtitle is-size-6"}>Rival's Board</h3>
            <div className={"block"}>
              <div className={"buttons"}>
                <button
                  className={"button is-small"}
                  disabled={isRivalBoardCurrent}
                  onClick={() => setIsRivalBoardCurrent(true)}
                >
                  Current
                </button>
                <button
                  className={"button is-small"}
                  disabled={!isRivalBoardCurrent}
                  onClick={() => setIsRivalBoardCurrent(false)}
                >
                  Final
                </button>
              </div>
              <RivalBoardMemo
                ghostBoardEmos={isRivalBoardCurrent ? currentGhostBoard : finalGhostBoard}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function RivalsToggle(props: {
  ghosts: mtc_Ghost[]
  ghostAddressesAndEps: GhostAddressAndEp[]
  ghostStates: mtc_GhostState[]
  battleGhostIndex: number
  selectedGhostIndex: number
  selectGhost: (index: number) => void
  turn: number
}) {
  const divs = props.ghosts.map((ghost, i) => {
    const onClick = i === props.selectedGhostIndex ? () => {} : () => props.selectGhost(i)
    const state = props.ghostStates[i]
    const grade = getGradeAndGhostBoard(ghost.history, state, props.turn).grade.toString()

    const health = getHealthFromState(state)
    const addr = props.ghostAddressesAndEps[i].address

    return (
      <div
        key={i}
        className={`${i === props.selectedGhostIndex ? "rivals-toggle-active" : ""}`}
        onClick={onClick}
      >
        <div>
          <Identicon address={addr} size={32} />
        </div>
        <div>
          <strong>{getShortAddress(addr)}</strong>
          <br />
          Health <strong style={health === 0 ? { color: "lightsalmon" } : {}}>{health}</strong>,
          Grade <span>{getGradeText(grade)}</span>
          <br />
          {i === props.battleGhostIndex ? <strong>Next Battle</strong> : <></>}
        </div>
      </div>
    )
  })
  return <div className={"rivals-toggle"}>{divs}</div>
}

let counterForKey = 1 // not good for performance...

const RivalBoardMemo = React.memo(RivalBoard)

function RivalBoard(props: { ghostBoardEmos: mtc_GhostBoard }) {
  const bases = useConnection().emoBases

  const emos = props.ghostBoardEmos.map((emo) => {
    const base = findEmoBase(emo.base_id, bases)
    return (
      <Emo
        key={counterForKey++}
        emoji={getEmoBaseEmoji(base)}
        typ={base.typ}
        grade={base.grade.toString()}
        attributes={emo.attributes}
        isInactive={false}
      />
    )
  })

  return (
    <div className={"emo-group emo-group-highlight"}>
      <div className={"emo-group-line"}>{emos}</div>
    </div>
  )
}
