import * as React from "react"

import { finishBattle, MtcState, ResultState } from "~/misc/mtcUtils"
import { buildMtcState, getSeed } from "./tasks"

import { useIsWasmReady } from "~/components/App/Frame/tasks"
import { Shop } from "../../common/Mtc/Shop"
import { Battle } from "../../common/Mtc/Battle"
import { Result } from "../../common/Mtc/Result"
import { useNavSetter } from "~/components/App/Frame/tasks"
import {
  useAccountSetter,
  ConnectionContext,
  Connection,
} from "~/components/App/ConnectionProvider/tasks"
import { Loading } from "~/components/common/Loading"
import { initialEp } from "~/misc/constants"

export function MtcTrial() {
  const isWasmReady = useIsWasmReady()
  const connection = React.useContext(ConnectionContext)

  if (!isWasmReady || !connection) {
    return <Loading />
  }

  return <Inner connection={connection} />
}

type Phase = "shop" | "battle" | "result"

function Inner(props: { connection: Connection }) {
  const setAcccount = useAccountSetter()
  const setNav = useNavSetter()

  const [phase, setPhase] = React.useState<Phase | null>(null)
  const [mtcState, setMtcState] = React.useState<MtcState | null>(null)
  const [resultState, setResultState] = React.useState<ResultState | null>(null)

  React.useEffect(() => {
    setup()
    return () => setNav(true)
  }, [])

  const setup = () => {
    buildMtcState(props.connection).then((s) => {
      setMtcState(s)
      setAcccount(null)
      setNav(false)
      setPhase("shop")
    })
  }

  if (!phase || !mtcState) {
    return <Loading />
  }

  switch (phase) {
    case "shop":
      const startBattle = () => {
        setMtcState({ ...mtcState, seed: getSeed() })
        setPhase("battle")
      }
      return (
        <Shop
          mtcState={mtcState}
          setMtcState={setMtcState as any}
          startBattle={{ kind: "no-pow", fn: startBattle }}
        />
      )
    case "battle":
      const finish = () => {
        const r = finishBattle(mtcState, props.connection.emoBases)
        setMtcState(r.mtcState)
        if (r.finalPlace) {
          setResultState({ place: r.finalPlace, ep: initialEp + 50 })
          setNav(true)
          setPhase("result")
        } else {
          setPhase("shop")
        }
      }
      return <Battle mtcState={mtcState} finish={finish} />
    case "result":
      if (!resultState) {
        throw new Error("invalid state: result state null")
      }
      const startAgain = () => {
        setPhase(null)
        setMtcState(null)
        setResultState(null)
        setup()
      }
      return <Result mtcState={mtcState} resultState={resultState} startAgain={startAgain} />
  }
}
