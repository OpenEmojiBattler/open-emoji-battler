import { readFileSync } from "fs"

// import { getEnv, connect, getGameContract } from "common"
// import { getKeyringPair } from "common/src/scriptUtils"

const SDN = 1_000_000_000_000_000_000n

const leaderboard: { rank: number; address: string }[] = JSON.parse(
  readFileSync("./20220922_getLeaderboard.json", "utf8")
).leaderboard

const rewards: { rank: number; reward: number }[] = JSON.parse(
  readFileSync("./20220923_leaderboardRewards.json", "utf8")
)

const beneficiaries = leaderboard.map((l) => {
  const reward = rewards.find((r) => r.rank === l.rank)
  if (!reward) {
    throw new Error()
  }
  return [l.address, BigInt(reward.reward) * SDN] as const
})

const main = async () => {
  console.log(beneficiaries)
  // const sender = await getKeyringPair(process.argv[3])
  // const api = await connect(getEnv(process.argv[2]).contract.endpoint, false)
}

main()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
