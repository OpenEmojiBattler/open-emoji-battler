import { u8aToString } from "@polkadot/util"
import { ApiPromise, WsProvider } from "@polkadot/api"

import { uniqueArray } from "./utils"

export const queryAddressNames = async (
  addresses: string[],
  transformAddress: (a: string) => string,
  endpoint = "wss://kusama-rpc.polkadot.io"
) => {
  const addressNames: Map<string, string> = new Map()

  if (addresses.length < 1) {
    return addressNames
  }

  const api = await ApiPromise.create({
    provider: new WsProvider(endpoint),
  })

  const children = await getChildlen(addresses, transformAddress, api)
  const parents = await getParents(
    uniqueArray(addresses.concat(Array.from(children.values()).map((o) => o.parentAddress))),
    api
  )

  for (const address of addresses) {
    const child = children.get(address)
    if (child) {
      addressNames.set(address, `${parents.get(child.parentAddress)} / ${child.name}`)
    }

    const parent = parents.get(address)
    if (parent) {
      addressNames.set(address, parent)
    }
  }

  api.disconnect()

  return addressNames
}

const getChildlen = async (
  addresses: string[],
  transformAddress: (a: string) => string,
  api: ApiPromise
) => {
  const children: Map<string, { parentAddress: string; name: string }> = new Map()

  const result = await api.query.identity.superOf.multi(addresses)

  result.forEach((opt: any, i) => {
    if (opt.isNone) {
      return
    }

    const [accountId, data] = opt.unwrap()
    if (!data.isRaw) {
      return
    }

    children.set(addresses[i], {
      parentAddress: transformAddress(accountId.toString()),
      name: u8aToString(data.asRaw),
    })
  })

  return children
}

const getParents = async (addresses: string[], api: ApiPromise) => {
  const parents: Map<string, string> = new Map()

  const result = await api.query.identity.identityOf.multi(addresses)

  result.forEach((opt: any, i) => {
    if (opt.isNone) {
      return
    }

    const display = opt.unwrap().info.display
    if (!display.isRaw) {
      return
    }

    parents.set(addresses[i], u8aToString(display.asRaw))
  })

  return parents
}
