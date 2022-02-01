import { web3FromAddress } from "@polkadot/extension-dapp"
import type { ApiPromise } from "@polkadot/api"

import { getEnv, tx, createType, buildKeyringPair } from "common"
import type { Connection } from "../tasks"
import { buildEmoBases } from "~/misc/mtcUtils"

const endpointStorageKey = "endpointV4"

export const getEndpoint = () => {
  const endpoint = localStorage.getItem(endpointStorageKey)
  if (endpoint) {
    return endpoint
  }
  return getEnv(process.env.OEB_ENV).chainEndpoint
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
  }
}

const buildConnectionQuery = (api: ApiPromise): Connection["query"] => ({
  deckFixedEmoBaseIds: async () => (await api.query.game.deckFixedEmoBaseIds()).unwrap(),
  deckBuiltEmoBaseIds: async () => (await api.query.game.deckBuiltEmoBaseIds()).unwrap(),
  matchmakingGhosts: (band) => api.query.game.matchmakingGhosts(band),
  playerEp: (address) => api.query.game.playerEp(address),
  playerSeed: (address) => api.query.game.playerSeed(address),
  playerPool: (address) => api.query.game.playerPool(address),
  playerHealth: (address) => api.query.game.playerHealth(address),
  playerGradeAndBoardHistory: (address) => api.query.game.playerGradeAndBoardHistory(address),
  playerGhosts: (address) => api.query.game.playerGhosts(address),
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
      const signer = (await web3FromAddress(account.player.address)).signer

      await tx(
        api,
        (t) => t.game.startMtc(account.session.address, _deckEmoBaseIds),
        { address: account.player.address, signer },
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
