import * as React from "react"

import { RouteId } from "../../misc/constants"
import { combineRouteIdAndParams } from "../../misc/route"

type RouteIdWithParamsObj = [RouteId, { address: string }]
const isRouteIdWithParamsObj = (arg: any): arg is RouteIdWithParamsObj => {
  return "object" === typeof arg && "object" === typeof arg[1]
}

export class InternalLink extends React.Component<{
  to: RouteId | RouteIdWithParamsObj
  className?: string
}> {
  aRef = React.createRef<HTMLAnchorElement>()

  render = () => {
    return (
      <a href={this.getPath()} onClick={this.go} className={this.props.className} ref={this.aRef}>
        {this.props.children}
      </a>
    )
  }

  getPath = (): string => {
    const to = this.props.to

    if (to === "/") {
      return to
    }

    let path: string

    if (isRouteIdWithParamsObj(to)) {
      path = combineRouteIdAndParams(to[0], to[1])
    } else {
      path = to
    }

    return `#${path}`
  }

  go = (e: React.FormEvent) => {
    e.preventDefault()
    window.location.hash = this.getPath()

    const a = this.aRef.current
    if (a) {
      a.blur()
    }
  }
}
