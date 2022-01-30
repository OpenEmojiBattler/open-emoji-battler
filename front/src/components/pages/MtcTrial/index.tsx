import * as React from "react"

import { finishBattle, MtcState, ResultState } from "~/misc/mtcUtils"
import { buildMtcState, getSeed } from "./tasks"

import { Shop } from "../../common/Mtc/Shop"
import { Battle } from "../../common/Mtc/Battle"
import { Result } from "../../common/Mtc/Result"
import { useNavSetter } from "~/components/App/Frame/tasks"
import {
  useAccountSetter,
  GlobalAsyncContext,
  GlobalAsync,
} from "~/components/App/ChainProvider/tasks"
import { Loading } from "~/components/common/Loading"

export function MtcTrial() {
  const globalAsync = React.useContext(GlobalAsyncContext)

  if (!globalAsync) {
    return <Loading />
  }

  return <Inner globalAsync={globalAsync} />
}

type Phase = "shop" | "battle" | "result"

function Inner(props: { globalAsync: GlobalAsync }) {
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
    buildMtcState(props.globalAsync).then((s) => {
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
        const r = finishBattle(mtcState, props.globalAsync.emoBases)
        setMtcState(r.mtcState)
        if (r.finalPlace) {
          setResultState({ place: r.finalPlace, ep: 1100 })
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
