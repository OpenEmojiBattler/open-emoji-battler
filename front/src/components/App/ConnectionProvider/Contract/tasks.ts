import type { ApiPromise } from "@polkadot/api"
import type { ContractPromise } from "@polkadot/api-contract"
import { encodeAddress } from "@polkadot/util-crypto"

import { queryContract, txContract, createType, EnvContract, getGameContract } from "common"
import { buildEmoBases } from "~/misc/mtcUtils"
import type { Connection } from "../tasks"

export const buildConnection = async (api: ApiPromise, env: EnvContract): Promise<Connection> => {
  const gameContract = getGameContract(api, env.gameAddress, env.ink)

  const emoBases = buildEmoBases(
    (await query(gameContract, env.ink, "Option<emo_Bases>", "getEmoBases")).unwrap()
  )

  return {
    kind: "contract",
    query: buildConnectionQuery(gameContract, env.ink),
    tx: buildConnectionTx(gameContract),
    emoBases,
    api: () => api,
    transformAddress: (a) => encodeAddress(a, api.registry.chainSS58),
  }
}

const query = async (
  contract: ContractPromise,
  inkVersion: number,
  type: string,
  fnName: string,
  fnArgs: any[] = []
) => {
  const response = (await queryContract(contract, fnName, fnArgs)).toU8a()

  switch (inkVersion) {
    case 3:
      return createType(type, response)
    case 4:
      return (createType(`Result<${type}, ()>`, response) as any).asOk
    default:
      throw new Error(`undefined ink version: ${inkVersion}`)
  }
}

const buildConnectionQuery = (
  gameContract: ContractPromise,
  inkVersion: number
): Connection["query"] => ({
  deckFixedEmoBaseIds: async () =>
    (await query(gameContract, inkVersion, "Option<Vec<u16>>", "getDeckFixedEmoBaseIds")).unwrap(),
  deckBuiltEmoBaseIds: async () =>
    (await query(gameContract, inkVersion, "Option<Vec<u16>>", "getDeckBuiltEmoBaseIds")).unwrap(),
  matchmakingGhostsInfo: (band) =>
    query(
      gameContract,
      inkVersion,
      "Option<Vec<(BlockNumber, AccountId)>>",
      "getMatchmakingGhostsInfo",
      [band]
    ),
  matchmakingGhostByIndex: (band, index) =>
    query(gameContract, inkVersion, "Option<mtc_Ghost>", "getMatchmakingGhostByIndex", [
      band,
      index,
    ]),
  leaderboard: () => query(gameContract, inkVersion, "Vec<(u16, AccountId)>", "getLeaderboard"),
  playerEp: (address) => query(gameContract, inkVersion, "Option<u16>", "getPlayerEp", [address]),
  playerSeed: (address) =>
    query(gameContract, inkVersion, "Option<u64>", "getPlayerSeed", [address]),
  playerMtcImmutable: async (address) => {
    const codec = (
      await query(
        gameContract,
        inkVersion,
        `Option<(Vec<mtc_Emo>, Vec<${inkVersion === 4 ? "Option<" : ""}(AccountId, mtc_Ghost)${
          inkVersion === 4 ? ">" : ""
        }>)>`,
        "getPlayerMtcImmutable",
        [address]
      )
    ).unwrap()

    return [
      codec[0],
      codec[1].toArray().map((x: any) => {
        const t = inkVersion === 4 ? x.unwrapOrDefault() : x
        return [t[0], t[1]]
      }),
    ]
  },
  playerMtcMutable: (address) =>
    query(gameContract, inkVersion, "Option<mtc_storage_PlayerMutable>", "getPlayerMtcMutable", [
      address,
    ]),
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
