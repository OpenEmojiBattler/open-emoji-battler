import type { ApiPromise } from "@polkadot/api"
import { encodeAddress } from "@polkadot/util-crypto"

import { tx, createType, buildKeyringPair } from "common"
import type { Connection } from "../tasks"
import { buildEmoBases } from "~/misc/mtcUtils"
import { getOebEnv } from "~/misc/env"

const endpointStorageKey = "endpointV4"

export const getEndpoint = () => {
  const endpoint = localStorage.getItem(endpointStorageKey)
  if (endpoint) {
    return endpoint
  }
  return getOebEnv().chainEndpoint
}

export const setEndpoint = (endpoint: string) => {
  localStorage.setItem(endpointStorageKey, endpoint)
}

export const buildConnection = async (api: ApiPromise): Promise<Connection> => {
  const codec = (await api.query.game.emoBases()).unwrap()
  const emoBases = buildEmoBases(codec)

  return {
    kind: "chain",
    query: buildConnectionQuery(api),
    tx: buildConnectionTx(api),
    emoBases,
    api: () => api,
    transformAddress: (a) => encodeAddress(a, api.registry.chainSS58),
  }
}

const buildConnectionQuery = (api: ApiPromise): Connection["query"] => ({
  deckFixedEmoBaseIds: async () => (await api.query.game.deckFixedEmoBaseIds()).unwrap(),
  deckBuiltEmoBaseIds: async () => (await api.query.game.deckBuiltEmoBaseIds()).unwrap(),
  matchmakingGhosts: (_band) => {
    throw new Error("unimplemented")
  },
  leaderboard: () => {
    throw new Error("unimplemented")
  },
  playerEp: (address) => api.query.game.playerEp(address),
  playerSeed: (address) => api.query.game.playerSeed(address),
  playerMtcImmutable: (_address) => {
    throw new Error("unimplemented")
  },
  playerMtcMutable: (_address) => {
    throw new Error("unimplemented")
  },
})

const buildConnectionTx = (api: ApiPromise): Connection["tx"] => ({
  startMtc: async (deckEmoBaseIds, account, powSolution) => {
    if (account.kind !== "chain") {
      throw new Error("invalid connection kind")
    }
    const _deckEmoBaseIds = createType("Vec<u16>", deckEmoBaseIds)

    if (account.session.isActive) {
      await tx(
        api,
        (t) => t.game.startMtcBySession(_deckEmoBaseIds),
        buildKeyringPair(account.session.mnemonic),
        powSolution
      )
    } else {
      await tx(
        api,
        (t) => t.game.startMtc(account.session.address, _deckEmoBaseIds),
        { address: account.player.address, signer: account.player.signer },
        powSolution
      )
    }
  },
  finishMtcShop: async (ops, account, powSolution) => {
    if (account.kind !== "chain") {
      throw new Error("invalid connection kind")
    }
    await tx(
      api,
      (t) => t.game.finishMtcShop(createType("Vec<mtc_shop_PlayerOperation>", ops)),
      buildKeyringPair(account.session.mnemonic),
      powSolution
    )
  },
})
