import { connected } from "common"

const target = new Date("2022-05-20")

console.log(`target: ${target.toISOString()}`)

connected("ws://127.0.0.1:9944", async (api) => {
  let block = (await api.rpc.chain.getBlock()).block

  while (true) {
    const timestampSet = block.extrinsics
      .toArray()
      .find((e) => e.method.section === "timestamp" && e.method.method === "set")

    if (!timestampSet) {
      throw new Error("invalid block")
    }

    if (new Date((timestampSet.args[0] as any).toNumber()) <= target) {
      break
    }

    block = (await api.rpc.chain.getBlock(block.header.parentHash)).block
  }

  console.log(`hash: ${block.hash.toString()} num: ${block.header.number.unwrap().toNumber()}`)
})
