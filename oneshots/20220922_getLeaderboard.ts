import { writeFileSync } from "fs"
import { encodeAddress } from "@polkadot/util-crypto"

import { getEnv, connect, getGameContract, queryContract } from "common"

const contractEnv = getEnv("production").contract

const main = async () => {
  const api = await connect(contractEnv.endpoint, false)

  const contract = getGameContract(api, contractEnv.gameAddress)
  const leaderboardCodec = (await queryContract(contract, "getLeaderboard")) as unknown as any[]

  const leaderboard = leaderboardCodec.map(([ep, account], i) => ({
    rank: i + 1,
    ep: ep.toNumber(),
    address: encodeAddress(account.toString(), 5),
  }))

  writeFileSync("./20220922_getLeaderboard.json", `${JSON.stringify(leaderboard, null, 2)}\n`)
}

main()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
