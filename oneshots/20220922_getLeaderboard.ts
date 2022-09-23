import { writeFileSync } from "fs"
import { encodeAddress } from "@polkadot/util-crypto"

import { getEnv, connect, getGameContract, queryContract, queryAddressNames } from "common"

const contractEnv = getEnv(process.argv[2]).contract

const main = async () => {
  const api = await connect(contractEnv.endpoint, false)

  const contract = getGameContract(api, contractEnv.gameAddress)
  const [header, leaderboardCodec] = await Promise.all([
    api.rpc.chain.getHeader(),
    queryContract(contract, "getLeaderboard"),
  ])

  const estimateBlockNumber = header.number.unwrap().toNumber()
  const leaderboard = (leaderboardCodec as unknown as any[]).map(([ep, account], i) => ({
    rank: i + 1,
    ep: ep.toNumber(),
    address: encodeAddress(account.toString(), 5),
  }))

  const names = await queryAddressNames(
    leaderboard.map((l) => l.address),
    (a: string) => encodeAddress(a, 5)
  )
  const leaderboardWithNames = leaderboard.map((l) => ({
    ...l,
    name: names.get(l.address) || null,
  }))

  writeFileSync(
    "./20220922_getLeaderboard.json",
    `${JSON.stringify(
      { block: estimateBlockNumber, leaderboard: leaderboardWithNames },
      null,
      2
    )}\n`
  )
}

main()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
