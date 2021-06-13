import { writeFileSync, readFileSync } from "fs"
import { encodeAddress } from "@polkadot/util-crypto"

// result: https://gist.github.com/tash-2s/64b782fa474f7051367bf3890a02800c

const addresses = JSON.parse(readFileSync("./20210613_twitterGiveawayWinners.json", "utf8"))

const mdLines: string[] = []
let n = 1

mdLines.push("| n | substrate format address | kusama format address |")
mdLines.push("| --- | --- | --- |")

for (const addr of addresses) {
  mdLines.push(`| ${n} | ${encodeAddress(addr)} | ${encodeAddress(addr, 2)} |`)
  n++
}

writeFileSync("./20210613_twitterGiveawayWinners.md", `${mdLines.join("\n")}\n`)
