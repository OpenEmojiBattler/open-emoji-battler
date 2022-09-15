import type { ApiPromise } from "@polkadot/api"
import type { ContractPromise } from "@polkadot/api-contract"
import { encodeAddress } from "@polkadot/util-crypto"

import { queryContract, txContract, createType, EnvContract, getGameContract } from "common"
import { buildEmoBases } from "~/misc/mtcUtils"
import type { Connection } from "../tasks"

export const buildConnection = async (api: ApiPromise, env: EnvContract): Promise<Connection> => {
  const gameContract = getGameContract(api, env.gameAddress)

  const codec = createType(
    "Option<emo_Bases>",
    (await queryContract(gameContract, "getEmoBases")).toU8a()
  ).unwrap()

  const emoBases = buildEmoBases(codec)

  return {
    kind: "contract",
    query: buildConnectionQuery(gameContract),
    tx: buildConnectionTx(gameContract),
    emoBases,
    api: () => api,
    transformAddress: (a) => encodeAddress(a, api.registry.chainSS58),
  }
}

const buildConnectionQuery = (gameContract: ContractPromise): Connection["query"] => ({
  deckFixedEmoBaseIds: async () =>
    createType(
      "Option<Vec<u16>>",
      (await queryContract(gameContract, "getDeckFixedEmoBaseIds")).toU8a()
    ).unwrap(),
  deckBuiltEmoBaseIds: async () =>
    createType(
      "Option<Vec<u16>>",
      (await queryContract(gameContract, "getDeckBuiltEmoBaseIds")).toU8a()
    ).unwrap(),
  matchmakingGhostsInfo: async (band) =>
    createType(
      "Option<Vec<(BlockNumber, AccountId)>>",
      (await queryContract(gameContract, "getMatchmakingGhostsInfo", [band])).toU8a()
    ),
  matchmakingGhostByIndex: async (band, index) =>
    createType(
      "Option<mtc_Ghost>",
      (await queryContract(gameContract, "getMatchmakingGhostByIndex", [band, index])).toU8a()
    ),
  leaderboard: async () =>
    createType(
      "Vec<(u16, AccountId)>",
      (await queryContract(gameContract, "getLeaderboard")).toU8a()
    ),
  playerEp: async (address) =>
    createType(
      "Option<u16>",
      (await queryContract(gameContract, "getPlayerEp", [address])).toU8a()
    ),
  playerSeed: async (address) =>
    createType(
      "Option<u64>",
      (await queryContract(gameContract, "getPlayerSeed", [address])).toU8a()
    ),
  playerMtcImmutable: async (address) =>
    createType(
      "Option<(Vec<mtc_Emo>, Vec<(AccountId, mtc_Ghost)>)>",
      (await queryContract(gameContract, "getPlayerMtcImmutable", [address])).toU8a()
    ),
  playerMtcMutable: async (address) =>
    createType(
      "Option<mtc_storage_PlayerMutable>",
      (await queryContract(gameContract, "getPlayerMtcMutable", [address])).toU8a()
    ),
})

const buildConnectionTx = (gameContract: ContractPromise): Connection["tx"] => ({
  startMtc: async (deckEmoBaseIds, account) => {
    if (account.kind !== "contract") {
      throw new Error("invalid connection kind")
    }

    await txContract(gameContract, "startMtc", [deckEmoBaseIds], {
      address: account.address,
      signer: account.signer,
    })
  },
  finishMtcShop: async (ops, account) => {
    if (account.kind !== "contract") {
      throw new Error("invalid connection kind")
    }

    await txContract(
      gameContract,
      "finishMtcShop",
      [createType("Vec<mtc_shop_PlayerOperation>", ops).toU8a()],
      {
        address: account.address,
        signer: account.signer,
      }
    )
  },
})
