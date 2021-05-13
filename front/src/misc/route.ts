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

  routeIds.forEach((_routeId) => {
    const p = new RegExp(`^${_routeId}$`).exec(pathname)
    if (p) {
      routeId = _routeId
      params = p.slice(1) // first element is a matched path, so it's same with routeId
    }
  })

  return { id: routeId, params: params }
}

export const combineRouteIdAndParams = (id: RouteId, obj: object) => {
  let path: string = id

  for (const [key, value] of Object.entries(obj)) {
    path = path.replace(`:${key}`, value)
  }

  return path
}
