import { writeFileSync, readFileSync } from "fs"

import { connected, getEnv } from "common"

type Data = { blockNumber: number; bestEP: Record<string, number> }

const dataFilePath = "./20220512_listPlayerBestEPs.json"

const main = async () => {
  const data: Data = JSON.parse(readFileSync(dataFilePath, "utf8"))
  if (data.blockNumber < 1) {
    throw new Error("unexpected data")
  }
  data.blockNumber -= 1

  console.log(`start: ${data.blockNumber}, ${new Date().toISOString()}`)

  await connected("ws://127.0.0.1:9944", async (api) => {
    let blockHash = await api.rpc.chain.getBlockHash(data.blockNumber)

    while (data.blockNumber > 0) {
      const block = (await api.rpc.chain.getBlock(blockHash)).block

      if (data.blockNumber !== block.header.number.unwrap().toNumber()) {
        throw new Error("unexpected data")
      }

      const sessionAddresses = block.extrinsics
        .toArray()
        .filter(
          (e) => e.isSigned && e.method.section === "game" && e.method.method === "finishMtcShop"
        )
        .map((e) => e.signer.toString())

      if (sessionAddresses.length > 0) {
        const apiAt = await api.at(blockHash)

        const mainAddresses = (
          await apiAt.query.game.playerSessionToMain.multi(sessionAddresses)
        ).map((opt) => opt.unwrap().toString())

        const eps = (await apiAt.query.game.playerEp.multi(mainAddresses)).map((ep) =>
          ep.unwrap().toNumber()
        )

        mainAddresses.forEach((address, index) => {
          const ep = eps[index]
          if (!ep) {
            throw new Error("unexpected data")
          }
          if (!data.bestEP[address] || data.bestEP[address] < ep) {
            data.bestEP[address] = ep
          }
        })
      }

      if (data.blockNumber % 2000 === 0) {
        saveData(data)
        console.log(`progress: ${data.blockNumber}, ${new Date().toISOString()}`)
      }

      data.blockNumber -= 1
      blockHash = block.header.parentHash
    }
  })

  saveData(data)

  console.log(`finish: ${new Date().toISOString()}`)
}

const saveData = (data: Data) => {
  data.bestEP = Object.keys(data.bestEP)
    .sort()
    .reduce<Record<string, number>>((obj, key) => {
      obj[key] = data.bestEP[key]
      return obj
    }, {})

  writeFileSync(dataFilePath, `${JSON.stringify(data, null, 2)}\n`)
}

main()
