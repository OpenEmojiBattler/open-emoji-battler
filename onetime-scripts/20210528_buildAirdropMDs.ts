import { readFileSync } from "fs"
import { encodeAddress } from "@polkadot/util-crypto"

const mdLines: string[] = []

// RMRK
mdLines.push("| n | substrate format address | kusama format address |")
mdLines.push("| --- | --- | --- |")
const rmrkAddresses: string[] = JSON.parse(
  readFileSync("./20210522_getRmrkAirdropTargetAddresses.addresses.json", "utf8")
)
rmrkAddresses.forEach((address, i) => {
  mdLines.push(`| ${i + 1} | ${encodeAddress(address)} | ${address} |`)
})
mdLines.push("\n")

// Unique
mdLines.push("| n | substrate format address | kusama format address |")
mdLines.push("| --- | --- | --- |")
const uniqueAddresses: string[] = JSON.parse(
  readFileSync("./20210525_getUniqueAirdropTargetAddresses.addresses.json", "utf8")
)
uniqueAddresses.forEach((address, i) => {
  mdLines.push(`| ${i + 1} | ${address} | ${encodeAddress(address, 2)} |`)
})
mdLines.push("\n")

console.log(mdLines.join("\n"))
