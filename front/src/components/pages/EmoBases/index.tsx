import * as React from "react"

import { GlobalAsyncContext } from "~/components/App/Frame/tasks"

import { Loading } from "~/components/common/Loading"
import { AllEmos } from "./AllEmos"
import { AvailableEmosByGrades } from "./AvailableEmosByGrades"

const tabs = ["All EMOs", "Available EMOs By Grades"] as const
type Tab = typeof tabs[number]

export function EmoBases() {
  const globalAsync = React.useContext(GlobalAsyncContext)

  const [tab, setTab] = React.useState<Tab>("All EMOs")

  if (!globalAsync) {
    return <Loading />
  }

  const bases = Array.from(globalAsync.emoBases.codec[0].values())

  return (
    <section className="section">
      <div className={"container"}>
        <div className={"tabs"}>
          <ul>
            {tabs.map((t) => {
              return (
                <li key={t} className={t === tab ? "is-active" : ""}>
                  <a onClick={() => setTab(t)}>{t}</a>
                </li>
              )
            })}
          </ul>
        </div>
        {tab === "All EMOs" ? <AllEmos bases={bases} /> : <AvailableEmosByGrades bases={bases} />}
      </div>
    </section>
  )
}
