import { writeFileSync } from "fs"
import { connected, getEnv, getStorageContract, queryContract, createType } from "common"

// Get shibuya players who got 3rd place or greater.
// The assumption here is that the number of ghosts is small, so there is no ghost data rotation.

const contractEnv = getEnv("production").contract

connected(
  contractEnv.endpoint,
  async (api) => {
    const storage = getStorageContract(api, contractEnv.storageAddress)

    const addresses: string[] = []

    for (let i = 0; i <= 30; i++) {
      const result = createType(
        "Option<Vec<(AccountId, u16, mtc_Ghost)>>",
        (await queryContract(storage, "getMatchmakingGhosts", [i])).toU8a()
      )

      if (result.isNone) {
        console.log(`[ep_band: ${i}] no data`)
        continue
      }

      for (const [account, ep, _g] of result.unwrap().toArray()) {
        const addr = account.toString()
        console.log(`[ep_band: ${i}] ${addr}: ${ep.toNumber()}`)
        if (!addresses.includes(addr)) {
          addresses.push(addr)
        }
      }
    }

    writeFileSync("./20220523_getShibuyaPlayers.json", `${JSON.stringify(addresses, null, 2)}\n`)
  },
  false
)
