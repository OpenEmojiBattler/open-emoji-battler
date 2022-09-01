import { readFileSync } from "fs"
import { resolve } from "path"

import { ContractPromise } from "@polkadot/api-contract"
import type { IKeyringPair } from "@polkadot/types/types"
import { createType, connected, range, txContract, sampleArray } from "common"
import { getEndpointAndPair } from "../utils"

const randomAddress = "5Hasqa9swLcoKGyFikR1su9bdrqkRhtitSNb3iNKEwgk5UGf"

const main = async () => {
  const { endpoint, keyringPair } = await getEndpointAndPair()
  const playerAddress = keyringPair.address

  await connected(
    endpoint,
    async (api) => {
      const contract = new ContractPromise(
        api,
        readFileFromFileRelativePath("../../game/target/ink/metadata.json"),
        JSON.parse(readFileFromFileRelativePath("./instantiatedAddress.game.production.json"))
      )

      await setup(contract, keyringPair, playerAddress)
      await start(contract, keyringPair)
      // console.log((await queryContract(contract, "getPlayerMtcImmutable", [playerAddress])).encodedLength)
      await finish(contract, keyringPair, playerAddress)
    },
    false
  )
}

const setup = async (
  contract: ContractPromise,
  keyringPair: IKeyringPair,
  playerAddress: string
) => {
  console.log("setup")

  const arr = [
    ["removePlayerEp", [playerAddress]],
    ["removePlayerMtcImmutable", [playerAddress]],
    ["removePlayerMtcMutable", [playerAddress]],
    ["removeMatchmakingGhostsInfo", [1]],
    ["removeMatchmakingGhostsInfo", [2]],
    ["removeMatchmakingGhostsInfo", [3]],
    ["insertMatchmakingGhostsInfo", [0, range(20).map(() => [0, randomAddress])]],
    ...range(20).map((i) => ["insertMatchmakingGhostByIndex", [0, i, buildGhost()]] as const),
  ] as const

  for (const [f, args] of arr) {
    const tx = await contract.tx[f]({}, ...args).signAndSend(keyringPair, { nonce: -1 })
    console.log(`tx: ${f} ${tx.toString()}`)
  }

  await txContract(contract, "updateLeaderboard", [buildLeaderboard()], keyringPair, { nonce: -1 })
}

const start = async (contract: ContractPromise, keyringPair: IKeyringPair) => {
  console.log("start")

  await txContract(contract, "startMtc", [[26, 44, 59, 48, 52, 12]], keyringPair)
}

const finish = async (
  contract: ContractPromise,
  keyringPair: IKeyringPair,
  playerAddress: string
) => {
  console.log("finish")

  const e0 = {
    mtc_emo_ids: [],
    base_id: 12,
    attributes: e0Attributes,
  }
  const e1 = {
    mtc_emo_ids: [],
    base_id: 13,
    attributes: e1Attributes,
  }
  const e2 = {
    mtc_emo_ids: [],
    base_id: 37,
    attributes: e2Attribute,
  }
  const b = { grade: 1, board: [e0, e0, e0, e0, e1, e1, e2] }

  const m = createType("mtc_storage_PlayerMutable", {
    health: 30,
    grade_and_board_history: range(20).map(() => b),
    upgrade_coin: 5,
    ghost_states: range(3).map(() => ({ active: { health: 20 } })),
    battle_ghost_index: 0,
  })

  await txContract(contract, "insertPlayerMtcMutable", [playerAddress, m], keyringPair)
  await txContract(contract, "finishMtcShop", [buildPlayerOperations()], keyringPair)
}

const buildGhost = () => {
  const e0 = {
    base_id: 12,
    attributes: e0Attributes,
  }
  const e1 = {
    base_id: 13,
    attributes: e1Attributes,
  }
  const e2 = {
    base_id: 37,
    attributes: e2Attribute,
  }
  const b = { grade: 1, board: [e0, e0, e0, e0, e1, e1, e2] }
  return createType("mtc_Ghost", { history: range(20).map(() => b) })
}

const buildLeaderboard = () =>
  createType(
    "Vec<(u16, AccountId)>",
    range(130).map(() => [1, randomAddress])
  )

const buildPlayerOperations = () => {
  // "Books" sets extra EMOs on its sell, so ignore it
  const emoObjectIds = JSON.parse(readFileFromFileRelativePath("../202109210_init/emoBases.json"))
    .filter((e: any) => e.typ === "Object" && e.id !== 41)
    .map((e: any) => e.id)

  const ops: {}[] = range(7).map(() => ({ Sell: { index: 0 } }))

  for (const _ of range(10)) {
    const baseIds = sampleArray(emoObjectIds, 7)

    for (const index of range(7)) {
      const base_id = baseIds[index]
      ops.push({ Buy: { mtc_emo_id: base_id, index } })
    }

    for (const _ of range(7)) {
      ops.push({ Sell: { index: 0 } })
    }
  }

  return createType("Vec<mtc_shop_PlayerOperation>", ops)
}

const e0Attributes = {
  attack: 70,
  health: 70,
  abilities: [
    {
      Battle: {
        General: {
          AsOneself: {
            trigger: {
              Retire: null,
            },
            action: {
              SetEmo: {
                side: "Ally",
                base_id: 4,
              },
            },
          },
        },
      },
    },
    {
      Battle: {
        General: {
          AsOneself: {
            trigger: {
              Retire: null,
            },
            action: {
              SetEmo: {
                side: "Ally",
                base_id: 10,
              },
            },
          },
        },
      },
    },
  ],
  is_triple: true,
}

const e1Attributes = {
  attack: 50,
  health: 50,
  abilities: [
    {
      Shop: {
        Peri: {
          AsAlly: {
            trigger: {
              AllySet: {
                typ_and_triple: {
                  typ_opt: "Nature",
                  is_triple_opt: null,
                },
              },
            },
            action: {
              OneselfTripleNormal: {
                IncreaseStats: {
                  target: {
                    Oneself: null,
                  },
                  attack: 50,
                  health: 50,
                },
              },
            },
          },
        },
      },
    },
    {
      Battle: {
        General: {
          AsAlly: {
            trigger: {
              AllySet: {
                typ_and_triple: {
                  typ_opt: "Nature",
                  is_triple_opt: null,
                },
              },
            },
            action: {
              OneselfTripleNormal: {
                IncreaseStats: {
                  target_or_random: {
                    Target: {
                      Oneself: null,
                    },
                  },
                  attack: 50,
                  health: 50,
                },
              },
            },
          },
        },
      },
    },
  ],
  is_triple: true,
}

const e2Attribute = {
  attack: 10,
  health: 200,
  abilities: [
    {
      Battle: {
        General: {
          AsAlly: {
            trigger: {
              AllyRetire: {
                typ_and_triple: {
                  typ_opt: null,
                  is_triple_opt: null,
                },
              },
            },
            action: {
              Custom: "TriggerRetireActions",
            },
          },
        },
      },
    },
  ],
  is_triple: true,
}

const readFileFromFileRelativePath = (path: string) =>
  readFileSync(resolve(__dirname, path), "utf8")

main().catch(console.error).finally(process.exit)
