import type { ApiPromise } from "@polkadot/api"
import type { ContractPromise } from "@polkadot/api-contract"

import {
  getEnv,
  queryContract,
  txContract,
  createType,
  EnvContract,
  getStorageContract,
  getForwarderContract,
} from "common"
import { buildEmoBases } from "~/misc/mtcUtils"
import type { Connection } from "../tasks"

export const getContractEnv = () => getEnv(process.env.OEB_ENV).contract

export const buildConnection = async (api: ApiPromise, env: EnvContract): Promise<Connection> => {
  const storageContract = getStorageContract(api, env.storageAddress)
  const forwarderContract = getForwarderContract(api, env.forwarderAddress)

  const codec = createType(
    "Option<emo_Bases>",
    (await queryContract(storageContract, "getEmoBases")).toU8a()
  ).unwrap()

  const emoBases = buildEmoBases(codec)

  return {
    kind: "contract",
    query: buildConnectionQuery(storageContract),
    tx: buildConnectionTx(forwarderContract),
    emoBases,
    api: () => {
      throw new Error("connection is not chain")
    },
  }
}

const buildConnectionQuery = (storageContract: ContractPromise): Connection["query"] => ({
  deckFixedEmoBaseIds: async () =>
    createType(
      "Option<Vec<u16>>",
      (await queryContract(storageContract, "getDeckFixedEmoBaseIds")).toU8a()
    ).unwrap(),
  deckBuiltEmoBaseIds: async () =>
    createType(
      "Option<Vec<u16>>",
      (await queryContract(storageContract, "getDeckBuiltEmoBaseIds")).toU8a()
    ).unwrap(),
  matchmakingGhosts: async (band) =>
    createType(
      "Option<Vec<(AccountId, u16, mtc_Ghost)>>",
      (await queryContract(storageContract, "getMatchmakingGhosts", [band])).toU8a()
    ),
  playerEp: async (address) =>
    createType(
      "Option<u16>",
      (await queryContract(storageContract, "getPlayerEp", [address])).toU8a()
    ),
  playerSeed: async (address) =>
    createType(
      "Option<u64>",
      (await queryContract(storageContract, "getPlayerSeed", [address])).toU8a()
    ),
  playerPool: async (address) =>
    createType(
      "Option<Vec<mtc_Emo>>",
      (await queryContract(storageContract, "getPlayerPool", [address])).toU8a()
    ),
  playerHealth: async (address) =>
    createType(
      "Option<u8>",
      (await queryContract(storageContract, "getPlayerHealth", [address])).toU8a()
    ),
  playerGradeAndBoardHistory: async (address) =>
    createType(
      "Option<Vec<mtc_GradeAndBoard>>",
      (await queryContract(storageContract, "getPlayerGradeAndBoardHistory", [address])).toU8a()
    ),
  playerGhosts: async (address) =>
    createType(
      "Option<Vec<(AccountId, u16, mtc_Ghost)>>",
      (await queryContract(storageContract, "getPlayerGhosts", [address])).toU8a()
    ),
})

const buildConnectionTx = (forwarderContract: ContractPromise): Connection["tx"] => ({
  startMtc: async (deckEmoBaseIds, account) => {
    if (account.kind !== "contract") {
      throw new Error("invalid connection kind")
    }

    await txContract(forwarderContract, "startMtc", [deckEmoBaseIds], {
      address: account.address,
      signer: account.signer,
    })
  },
  finishMtcShop: async (ops, account) => {
    if (account.kind !== "contract") {
      throw new Error("invalid connection kind")
    }

    await txContract(
      forwarderContract,
      "finishMtcShop",
      [createType("Vec<mtc_shop_PlayerOperation>", ops).toU8a()],
      {
        address: account.address,
        signer: account.signer,
      }
    )
  },
})
