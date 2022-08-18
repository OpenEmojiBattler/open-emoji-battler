import { u8aToString } from "@polkadot/util"
import { ApiPromise, WsProvider } from "@polkadot/api"

import { uniqueArray } from "common"
import type { Connection } from "~/components/App/ConnectionProvider/tasks"

const kusamaEndpoint = "wss://kusama-rpc.polkadot.io"

export const queryKusamaAddressNames = async (
  contractConnection: Connection,
  addresses: string[]
) => {
  if (addresses.length < 1) {
    return {}
  }

  const api = await ApiPromise.create({
    provider: new WsProvider(kusamaEndpoint),
  })

  const children = await getChildlen(contractConnection, addresses, api)
  const parents = await getParents(
    uniqueArray(addresses.concat(Object.values(children).map((o) => o.parentAddress))),
    api
  )

  const addressNames: Record<string, string> = {}

  for (const address of addresses) {
    const child = children[address]
    if (child) {
      addressNames[address] = `${parents[child.parentAddress]}/${child.name}`
    }

    const parent = parents[address]
    if (parent) {
      addressNames[address] = parent
    }
  }

  api.disconnect()

  return addressNames
}

const getChildlen = async (
  contractConnection: Connection,
  addresses: string[],
  api: ApiPromise
) => {
  const children: Record<string, { parentAddress: string; name: string }> = {}

  const result = await api.query.identity.superOf.multi(addresses)

  result.forEach((opt: any, i) => {
    if (opt.isNone) {
      return
    }

    const [accountId, data] = opt.unwrap()
    if (!data.isRaw) {
      return
    }

    children[addresses[i]] = {
      parentAddress: contractConnection.transformAddress(accountId.toString()),
      name: u8aToString(data.asRaw),
    }
  })

  return children
}

const getParents = async (addresses: string[], api: ApiPromise) => {
  const parents: Record<string, string> = {}

  const result = await api.query.identity.identityOf.multi(addresses)

  result.forEach((opt: any, i) => {
    if (opt.isNone) {
      return
    }

    const display = opt.unwrap().info.display
    if (!display.isRaw) {
      return
    }

    parents[addresses[i]] = u8aToString(display.asRaw)
  })

  return parents
}
