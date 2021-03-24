import * as React from "react"

import { GlobalAsyncContext } from "~/components/App/Frame/tasks"
import { Loading } from "~/components/common/Loading"
import { getGradeText, findEmoBaseByStringId } from "~/misc/mtcUtils"
import { EmoBase } from "../common/Emo"

export function Style() {
  const globalAsync = React.useContext(GlobalAsyncContext)

  if (!globalAsync) {
    return <Loading />
  }

  const base = findEmoBaseByStringId("1", globalAsync.emoBases)

  return (
    <section className="section">
      <div className={"container"}>
        <div className={"block"}>
          <div className={`emo-group emo-group-highlight`}>
            <div className={"emo-group-line emo-group-line-controls"}>
              {["1", "2", "3", "4", "5", "6"].map((g) => {
                return <div key={g}>{getGradeText(g)}</div>
              })}
            </div>
            <div className={"emo-group-line"}>
              {["1", "2", "3", "4", "5", "6"].map((id) => {
                const base = findEmoBaseByStringId(id, globalAsync.emoBases)
                return <EmoBase key={id} base={base} isTriple={false} isInactive={false} />
              })}
              <div>
                [STALE]
                <br />
                <button
                  className={"button is-small"}
                  style={{ marginBottom: "4px" }}
                  disabled={true}
                  onClick={() => {}}
                >
                  Selected
                </button>
                <br />
                <button disabled={false} onClick={() => {}} className={"button is-small"}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className={"block"}>
          <div className={"emo-group emo-group-highlight"}>
            <div className={"emo-group-line emo-group-line-center"}>
              <EmoBase base={base} isTriple={false} isInactive={false} />
              <EmoBase base={base} isTriple={false} isInactive={false} />
              <EmoBase base={base} isTriple={false} isInactive={false} />
              <EmoBase base={base} isTriple={false} isInactive={false} />
              <EmoBase base={base} isTriple={false} isInactive={false} />
              <EmoBase base={base} isTriple={false} isInactive={false} />
              <EmoBase base={base} isTriple={false} isInactive={false} />
            </div>
            <br />
            <div className={"emo-group-line emo-group-line-center"}>
              <EmoBase base={base} isTriple={false} isInactive={false} />
            </div>
          </div>
        </div>
        <div className={"block"}>
          <div className={"emo-group emo-group-highlight"}>
            <div className={"emo-group-line emo-group-line-controls"}>
              <div>
                <button className={"button is-small"}>Set</button>
              </div>
              <div>
                <button className={"button is-small"}>Set</button>
              </div>
            </div>
            <div className={"emo-group-line "}>
              <EmoBase base={base} isTriple={false} isInactive={false} />
              <EmoBase base={base} isTriple={false} isInactive={false} />
              <EmoBase base={base} isTriple={false} isInactive={false} />
            </div>
          </div>
        </div>
        <div className={"block"}>
          <div className={"emo-group emo-group-highlight"}>
            <div className={"emo-group-line emo-group-line-controls"}>
              <div>
                <button className={"button is-small"}>Buy</button>
              </div>
              <div>
                <button className={"button is-small"}>Buy</button>
              </div>
            </div>
            <div className={"emo-group-line "}>
              <EmoBase base={base} isTriple={false} isInactive={false} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
            </div>
          </div>
          <br />
          <div className={`emo-group`}>
            <div className={"emo-group-line"} style={{ marginBottom: "8px" }}>
              <EmoBase base={base} isTriple={false} isInactive={true} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
            </div>
            <div className={"emo-group-line"}>
              <EmoBase base={base} isTriple={false} isInactive={true} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
              <EmoBase base={base} isTriple={false} isInactive={true} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
