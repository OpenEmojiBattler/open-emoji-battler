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
        <div className={"block"}></div>
      </div>
    </section>
  )
}
