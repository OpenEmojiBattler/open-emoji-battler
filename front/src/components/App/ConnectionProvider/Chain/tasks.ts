import type { ApiPromise } from "@polkadot/api"
import { encodeAddress } from "@polkadot/util-crypto"

import { tx, createType, buildKeyringPair, type emo_Bases } from "common"
import type { Connection } from "../tasks"
import { buildEmoBases } from "~/misc/mtcUtils"
import { getOebEnv } from "~/misc/env"
import type { Option, Vec, u16, u64 } from '@polkadot/types-codec'

const endpointStorageKey = "endpointV5"

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
  const codec = ((await api.query.game.emoBases()) as Option<emo_Bases>).unwrap()
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
  deckFixedEmoBaseIds: async () => ((await api.query.game.deckFixedEmoBaseIds()) as Option<Vec<u16>>).unwrap(),
  deckBuiltEmoBaseIds: async () => ((await api.query.game.deckBuiltEmoBaseIds()) as Option<Vec<u16>>).unwrap(),
  matchmakingGhostsInfo: () => {
    throw new Error("unimplemented")
  },
  matchmakingGhostByIndex: () => {
    throw new Error("unimplemented")
  },
  leaderboard: () => {
    throw new Error("unimplemented")
  },
  playerEp: (address) => api.query.game.playerEp(address) as Promise<Option<u16>>,
  playerSeed: (address) => api.query.game.playerSeed(address) as Promise<Option<u64>>,
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
