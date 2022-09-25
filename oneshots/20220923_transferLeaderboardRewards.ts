import { readFileSync } from "fs"

import { getEnv, connect } from "common"
import { getKeyringPair } from "common/src/scriptUtils"

// result: https://shiden.subscan.io/extrinsic/2391698-2

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
  const totalReward = beneficiaries.reduce((a, b) => a + b[1], 0n)

  if (process.argv[2] === "dryrun") {
    console.log(totalReward)
    console.log(beneficiaries.map(([a, r]) => `${a}:${r}`))
    return
  }
  if (process.argv[2] !== "wetrun") {
    throw new Error()
  }

  const api = await connect(getEnv(process.argv[3]).contract.endpoint, false)
  const sender = await getKeyringPair(process.argv[4])

  const {
    data: { free },
  } = await api.query.system.account(sender.address)
  const senderBalance = free.toBigInt()

  if (senderBalance < totalReward || senderBalance > totalReward * 2n) {
    throw new Error(`invalid sender balance: ${senderBalance}`)
  }

  const txHash = await api.tx.utility
    .batchAll(beneficiaries.map(([a, r]) => api.tx.balances.transfer(a, r)))
    .signAndSend(sender)

  console.log(txHash.toString())
}

main()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
