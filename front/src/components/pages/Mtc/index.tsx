import * as React from "react"
import BN from "bn.js"

import { Shop } from "../../common/Mtc/Shop"
import { Battle } from "../../common/Mtc/Battle"
import { Result } from "../../common/Mtc/Result"
import { tx, createType, buildKeyringPair, mtc_shop_PlayerOperation } from "common"
import {
  AccountContext,
  useAccountUpdater,
  useNavSetter,
  useWaitingSetter,
} from "~/components/App/Frame/tasks"
import { withToggleAsync } from "~/misc/utils"
import { GlobalAsyncContext } from "~/components/App/Frame/tasks"
import { Loading } from "../../common/Loading"
import { getSeed, start, finishBattleAndBuildState } from "./tasks"
import { SetupWrapper } from "./SetupWrapper"
import { MtcState, ResultState } from "~/misc/mtcUtils"

type Phase = "setup" | "shop" | "battle" | "result"

export function Mtc() {
  const setNav = useNavSetter()
  const setWaiting = useWaitingSetter()
  const account = React.useContext(AccountContext)
  const updateAccount = useAccountUpdater()
  const globalAsync = React.useContext(GlobalAsyncContext)

  const [phase, setPhase] = React.useState<Phase>("setup")
  const [mtcState, setMtcState] = React.useState<MtcState | null>(null)
  const [resultState, setResultState] = React.useState<ResultState | null>(null)

  React.useEffect(() => () => setNav(true), [])

  if (!globalAsync) {
    return <Loading />
  }

  switch (phase) {
    case "setup":
      const startMtc = async (solution: BN, deckEmoBaseIds: string[], previousEp: number) => {
        if (!account) {
          throw new Error("account null")
        }
        setMtcState(
          await start(
            account.player,
            account.session,
            account.session.isActive,
            solution,
            deckEmoBaseIds,
            setWaiting,
            previousEp
          )
        )
        updateAccount((a) => ({
          ...a,
          session: { ...a.session, isActive: true },
        }))
        setNav(false)
        setPhase("shop")
      }
      return <SetupWrapper startMtc={startMtc} />
    case "shop":
      if (!mtcState) {
        throw new Error("invalid state mtc")
      }
      const startBattle = (ops: mtc_shop_PlayerOperation[], solution: BN) => {
        if (!account) {
          throw new Error("accounts null")
        }
        withToggleAsync(setWaiting, async () => {
          await tx(
            (t) => t.game.finishMtcShop(createType("Vec<mtc_shop_PlayerOperation>", ops)),
            buildKeyringPair(account.session.mnemonic),
            solution
          )

          const seed = await getSeed(account.player)
          setMtcState({ ...mtcState, seed })
          setPhase("battle")
        })
      }
      return (
        <Shop
          mtcState={mtcState}
          setMtcState={setMtcState as any}
          startBattle={{ kind: "pow", fn: startBattle }}
        />
      )
    case "battle":
      if (!mtcState) {
        throw new Error("invalid state mtc")
      }
      const finish = async () => {
        if (!account) {
          throw new Error("invalid state: playerAccount null")
        }

        const r = finishBattleAndBuildState(account.player, mtcState, globalAsync.emoBases)
        setMtcState(r.mtcState)

        const _resultState = r.resultState
        if (_resultState) {
          const rs = await withToggleAsync(setWaiting, () => _resultState)
          setResultState(rs)
          setPhase("result")
          setNav(true)
        } else {
          setPhase("shop")
        }
      }
      return <Battle mtcState={mtcState} finish={finish} />
    case "result":
      if (!(mtcState && resultState)) {
        throw new Error("invalid state: resut state null")
      }
      const startAgain = () => {
        setPhase("setup")
        setMtcState(null)
        setResultState(null)
      }
      return <Result mtcState={mtcState} resultState={resultState} startAgain={startAgain} />
  }
}
