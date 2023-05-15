import * as React from "react"

import { ConnectionContext } from "~/components/App/ConnectionProvider/tasks"

import { Loading } from "~/components/common/Loading"
import { AllEmos } from "./AllEmos"
import { AvailableEmosByGrades } from "./AvailableEmosByGrades"

const tabs = ["All EMOs", "Available EMOs By Grades"] as const
type Tab = (typeof tabs)[number]

export function EmoBases() {
  const connection = React.useContext(ConnectionContext)

  const [tab, setTab] = React.useState<Tab>("All EMOs")

  if (!connection) {
    return <Loading />
  }

  const bases = Array.from(connection.emoBases.codec[0].values())

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
