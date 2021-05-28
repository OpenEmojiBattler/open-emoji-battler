import { readFileSync } from "fs"
import { encodeAddress } from "@polkadot/util-crypto"

// result:
//   https://gist.github.com/tash-2s/0cb08b68906451f9d7788d4ce303d94a
//   https://gist.github.com/tash-2s/1b029cb2658a10a73a0acb8fc124aec3

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
