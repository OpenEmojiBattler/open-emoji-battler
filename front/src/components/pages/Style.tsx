import * as React from "react"

import { GlobalAsyncContext } from "~/components/App/Frame/tasks"
import { Loading } from "~/components/common/Loading"

export function Style() {
  const globalAsync = React.useContext(GlobalAsyncContext)

  if (!globalAsync) {
    return <Loading />
  }

  return (
    <section className="section">
      <div className={"container"}>
        <div className={"block"}>
          <div className={"emo-group"}>
            {[10, 20, 30].map((l) => {
              return [20, 30, 40].map((s) => {
                return (
                  <div key={`${l}:${s}`} className={"emo-group-line"}>
                    <span>{s}:{l}</span>
                    {[0, 72, 144, 216, 288].map((h) => {
                      return (
                        <div key={h} className="emo">
                          <div className="emo-body-outer">
                            <div
                              className="emo-body-inner"
                              style={{
                                backgroundImage: `radial-gradient(circle closest-side, hsl(${h},${s}%,${
                                  l + 10
                                }%), hsl(${h},${s}%,${l}%))`,
                              }}
                            >
                              <div className="emo-body-inner-emoji">💸</div>
                              <div className="emo-body-inner-grade">𝟝</div>
                              <div className="emo-body-inner-specials">
                                <span className="emo-body-inner-specials-shield">▣</span>
                                <span className="emo-body-inner-specials-attractive">✪</span>
                              </div>
                              <div className="emo-body-inner-attack">60</div>
                              <div className="emo-body-inner-health">20</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
