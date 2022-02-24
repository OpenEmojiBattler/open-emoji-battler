import { routeIds, RouteId, Route } from "./constants"

export const convertHashToRoute = (hash: string): Route => {
  let pathname: string
  if (hash === "") {
    pathname = "/"
  } else {
    pathname = hash.slice(1) // remove '#'
  }

  let routeId: RouteId = "/not_found"
  let params: string[] = []

  routeIds
    // .filter(_routeId => routeId !== "/:address")
    .forEach((_routeId) => {
      const regExp = new RegExp(`^${_routeId.replace(/:\w+/, "\\w+")}$`)
      const p = regExp.exec(pathname)
      if (p) {
        routeId = _routeId
        params = p.slice(1) // first element is a matched path, so it's same with routeId
      }
    })

  // if (routeId === "/not_found" && pathname.slice(0, 3) === "/0x") {
  //   routeId = "/:address"
  //   params = [pathname.slice(1)]
  // }

  return { id: routeId, params: params }
}

export const combineRouteIdAndParams = (id: RouteId, obj: object) => {
  let path: string = id

  for (const [key, value] of Object.entries(obj)) {
    path = path.replace(`:${key}`, value)
  }

  return path
}

export const changeLocationHashByRouteId = (id: RouteId) => {
  window.location.hash = `#${id}`
}

type ConnectionKind = "chain" | "contract" | "none"
export const getRouteConnectionKind = (routeId: RouteId): ConnectionKind => {
  switch (routeId) {
    case "/":
      return "chain"
    case "/match":
      return "chain"
    case "/emo_bases":
      return "chain"
    case "/match_trial":
      return "chain"
    case "/match_contract":
      return "contract"
    case "/dev":
      return "chain"
    case "/match_debug":
      return "chain"
    case "/emo_ability_builder":
      return "none"
    case "/not_found":
      return "none"
  }
}
