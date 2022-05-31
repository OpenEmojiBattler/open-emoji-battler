import { writeFileSync, readFileSync } from "fs"
import { encodeAddress } from "@polkadot/util-crypto"

// result: https://gist.github.com/tash-2s/dd92117bd6588d9c0ffd3804eae5bd6f

const addresses = JSON.parse(readFileSync("./20220524_mergeTargetPlayers.json", "utf8"))

const mdLines: string[] = []
let n = 1

mdLines.push("| | Address (Substrate/Kusama/Shibuya format) |")
mdLines.push("| --- | --- |")

for (const addr of addresses) {
  mdLines.push(
    `| ${n} | ${encodeAddress(addr)}<br />${encodeAddress(addr, 2)}<br />${encodeAddress(
      addr,
      5
    )} |`
  )
  n++
}

writeFileSync("./20220531_buildTargetPlayersMD.md", `${mdLines.join("\n")}\n`)
