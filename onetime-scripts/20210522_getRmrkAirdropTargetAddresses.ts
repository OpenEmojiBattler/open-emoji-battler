import { readFileSync, writeFileSync, createWriteStream } from "fs"
import { get } from "https"
import { encodeAddress } from "@polkadot/util-crypto"

const endBlockNum = 7500000 // TODO

const main = async () => {
  const rmrkDumpFilePath = "./20210522_getRmrkAirdropTargetAddresses.rmrkdump.json"
  await downloadFile("https://ipfs.io/ipns/latestdump.rmrk.app", rmrkDumpFilePath)

  const targetAddresses = new Set<string>()
  const remarkHeads = new Set<string>()

  const rmrkDump = JSON.parse(readFileSync(rmrkDumpFilePath, "utf8"))

  for (const block of rmrkDump) {
    if (block.block >= endBlockNum) {
      console.log(`break block: ${block.block}`)
      break
    }
    for (const call of block.calls) {
      if (call.call !== "system.remark") {
        console.error("invalid dump")
        return
      }
      targetAddresses.add(call.caller)
      remarkHeads.add(call.value.slice(0, 6))
    }
  }

  console.log("total addresses: ", targetAddresses.size)
  console.log("rmrk heads: ", remarkHeads)

  const targetAddressesArray = Array.from(targetAddresses)
  const targetAddressesArrayForCheck = targetAddressesArray.map((a) => encodeAddress(a, 2))
  if (!checkArraysEquality(targetAddressesArray, targetAddressesArrayForCheck)) {
    console.error("invalid address format")
    return
  }

  writeFileSync(
    "./20210522_getRmrkAirdropTargetAddresses.addresses.json",
    JSON.stringify(targetAddressesArray, null, 2)
  )
}

const downloadFile = (url: string, dest: string) => {
  const file = createWriteStream(dest)
  console.log("download start")
  return new Promise((resolve) => {
    get(url, function (response) {
      response.pipe(file)
      console.log("download end")
      file.on("finish", resolve)
    })
  })
}

const checkArraysEquality = <T>(a: T[], b: T[]) => {
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      console.error(`diff: ${a[i]}, ${b[i]}`)
      return false
    }
  }
  return true
}

main().catch(console.error).finally(process.exit)
