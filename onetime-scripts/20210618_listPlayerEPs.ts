import { writeFileSync } from "fs"

import { connected, getEnv, query } from "common"

connected(getEnv("production").endpoint, async () =>
  query((q) => q.game.playerEp.entries()).then((entries) => {
    const data: [string, number][] = []

    for (const [key, value] of entries) {
      const addr = key.args[0].toString()
      const ep = value.unwrap().toNumber()
      data.push([addr, ep])
    }

    data.sort((a, b) => a[1] - b[1])

    writeFileSync("./20210618_getEpLeaders.json", `${JSON.stringify(data, null, 2)}\n`)
  })
)
