import * as React from "react"
import BN from "bn.js"

import { getGradeText, getCoinText } from "~/misc/mtcUtils"
import { isMulliganAvailable } from "./tasks"
import { zeroAddress } from "~/misc/constants"

import { PowButton } from "~/components/common/PowButton"
import { Identicon } from "~/components/common/Identicon"
import { AccountContext, useAccount } from "~/components/App/ConnectionProvider/tasks"

export type FinishFn = { kind: "pow"; fn: (s: BN) => void } | { kind: "no-pow"; fn: () => void }

export function Nav(props: {
  health: number
  grade: number
  upgradeFn: () => void
  upgradeCoin: number | null
  nextCatalogLineFn: (() => void) | null
  finishFn: FinishFn
  coin: number
  turn: number
  nextCatalogLineCounter: number
  disabled: boolean
}) {
  const account = React.useContext(AccountContext)
  const playerAddress = account ? account.address : zeroAddress

  return (
    <nav className={"level"}>
      <div className={"level-left"}>
        <div className={"level-item mr-5"}>
          <h1 className={"title mr-3"}>Shop</h1>
          <small style={{ marginTop: "10px" }}>Turn {props.turn}</small>
        </div>
        <div className={"level-item"}>
          <Identicon address={playerAddress} size={32} />
        </div>
        <div className={"level-item mr-4"}>
          <p>
            Health <strong className={"is-size-5"}>{props.health}</strong>
          </p>
        </div>
        <div className={"level-item mr-4"}>
          <p>
            Grade{" "}
            <span className={"is-size-5"}>
              <AnimeNumber number={props.grade} numberToString={(n) => getGradeText(`${n}`)} />
            </span>
          </p>
        </div>
        <div className={"level-item mr-4"}>
          <p>
            Coin{" "}
            <strong className={"is-size-5"}>
              <AnimeNumber number={props.coin} numberToString={(n) => getCoinText(n)} />
            </strong>
          </p>
        </div>
      </div>
      <div className={"level-right"}>
        <div className={"buttons"}>
          <button
            className={"button"}
            onClick={props.nextCatalogLineFn || undefined}
            disabled={props.disabled || !props.nextCatalogLineFn}
          >
            Next Catalog Line{" "}
            {getCoinText(isMulliganAvailable(props.turn, props.nextCatalogLineCounter) ? 0 : 1)}
          </button>
          <button
            className={"button"}
            onClick={props.upgradeFn}
            disabled={
              props.disabled || props.upgradeCoin === null || props.upgradeCoin > props.coin
            }
          >
            Upgrade {props.upgradeCoin === null ? "" : getCoinText(props.upgradeCoin)}
          </button>
          {props.finishFn.kind === "pow" ? (
            <PowButtonWrapper onClick={props.finishFn.fn} disabled={props.disabled} />
          ) : (
            <button
              className={"button is-strong"}
              onClick={props.finishFn.fn}
              disabled={props.disabled}
            >
              Battle!
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

function PowButtonWrapper(props: { onClick: (solution: BN) => void; disabled: boolean }) {
  const account = useAccount()
  if (account.kind !== "chain") {
    throw new Error("not chain")
  }
  const sessionAccount = account.session
  return (
    <PowButton account={sessionAccount} onClick={props.onClick} disabled={props.disabled}>
      Battle!
    </PowButton>
  )
}

function AnimeNumber(props: { number: number; numberToString: (n: number) => string }) {
  const [prevNumber, setPrevNumber] = React.useState(props.number)

  const ref = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    if (props.number === prevNumber) {
      return
    }

    if (props.number > prevNumber) {
      ref.current!.animate({ color: ["white", "lightgreen", "white"] }, { duration: 500 })
    } else if (props.number < prevNumber) {
      ref.current!.animate({ color: ["white", "lightsalmon", "white"] }, { duration: 500 })
    }

    setPrevNumber(props.number)
  }, [props.number])

  return <span ref={ref}>{props.numberToString(props.number)}</span>
}
