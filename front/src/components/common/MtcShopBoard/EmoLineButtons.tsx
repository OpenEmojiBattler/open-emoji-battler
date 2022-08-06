import * as React from "react"

import { mtc_Emo, range } from "common"

import { Operation } from "./tasks"

export function EmoLineButtons(props: {
  boardEmoCount: number
  setOperation: (op: Operation) => void
  disabled: boolean
  mtcEmoForSet: mtc_Emo | null
}) {
  let e

  if (props.disabled) {
    e = <></>
  } else {
    const mtcEmo = props.mtcEmoForSet
    if (mtcEmo) {
      e = range(props.boardEmoCount + 1).map((index) => {
        return (
          <div key={`set:${index}`}>
            <button
              className={"button is-small"}
              onClick={() => props.setOperation({ kind: "set", index, mtcEmo })}
            >
              Set
            </button>
          </div>
        )
      })
    } else {
      e = range(props.boardEmoCount).map((i) => {
        const style: React.CSSProperties = {
          paddingLeft: "2px",
          paddingRight: "2px",
        }
        return (
          <div key={`move-and-sell:${i}`}>
            <button
              className={"button is-small"}
              style={{ ...style, marginRight: "1px" }}
              onClick={() => props.setOperation({ kind: "move", index: i, isRight: false })}
              disabled={i === 0}
            >
              ◀
            </button>
            <button
              className={"button is-small"}
              style={style}
              onClick={() => props.setOperation({ kind: "sell", index: i })}
            >
              Sell
            </button>
            <button
              className={"button is-small"}
              style={{ ...style, marginLeft: "1px" }}
              onClick={() => props.setOperation({ kind: "move", index: i, isRight: true })}
              disabled={i + 1 === props.boardEmoCount}
            >
              ▶
            </button>
          </div>
        )
      })
    }
  }

  return <div className={"emo-group-line emo-group-line-controls"}>{e}</div>
}
