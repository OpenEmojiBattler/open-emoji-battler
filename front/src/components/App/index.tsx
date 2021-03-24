import * as React from "react"

import { convertHashToRoute } from "~/misc/route"
import { ErrorBoundary } from "./ErrorBoundary"
import { Frame } from "./Frame"

export function App() {
  const [route, setRoute] = React.useState(() => convertHashToRoute(window.location.hash))

  React.useEffect(() => {
    window.onhashchange = () => setRoute(convertHashToRoute(window.location.hash))
  }, [])

  return (
    <React.StrictMode>
      <ErrorBoundary>
        <Frame route={route} />
      </ErrorBoundary>
    </React.StrictMode>
  )
}
