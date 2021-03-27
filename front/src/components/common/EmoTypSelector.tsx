import * as React from "react"
import { EmoTypWithAll, emoTypsWithAll } from "~/misc/constants"

export function EmoTypSelector(props: {
  active: EmoTypWithAll
  activate: (t: EmoTypWithAll) => void
}) {
  return (
    <div className={"buttons"}>
      {emoTypsWithAll.map((t) => {
        return (
          <button
            key={t}
            className={`button`}
            onClick={() => props.activate(t)}
            disabled={t === props.active}
          >
            {t}
          </button>
        )
      })}
    </div>
  )
}
