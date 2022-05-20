import { writeFileSync, readFileSync } from "fs"

import { connected, getEnv } from "common"

type Data = { blockNumber: { start: number; end: number }; bestEP: Record<string, number> }

const dataFilePath = "./20220512_listPlayerBestEPs.json"

const data: Data = JSON.parse(readFileSync(dataFilePath, "utf8"))
const dump = data.bestEP

connected(getEnv("production").chainEndpoint, async (api) => {
  const current = (await api.query.game.playerEp.entries()).reduce<Record<string, number>>(
    (obj, [key, value]) => {
      obj[key.args[0].toString()] = value.unwrap().toNumber()
      return obj
    },
    {}
  )

  for (const [addr, ep] of Object.entries(dump)) {
    if (current[addr] > ep) {
      throw new Error(`data diff: ${addr}`)
    }
  }

  const sortedDump = Object.fromEntries(Object.entries(dump).sort(([, a], [, b]) => a - b))

  writeFileSync(
    "./20220520_testAndListPlayerTopEPs.json",
    `${JSON.stringify(sortedDump, null, 2)}\n`
  )
})
