import { readFileSync, writeFileSync } from "fs"

const prototypenet = JSON.parse(readFileSync("./20220520_testAndListPlayerTopEPs.json", "utf8"))
const shibuya = JSON.parse(readFileSync("./20220523_getShibuyaPlayers.json", "utf8"))

const addresses: string[] = Array.from(new Set(Object.keys(prototypenet).concat(shibuya)))

addresses.sort()

writeFileSync("./20220524_mergeTargetPlayers.json", `${JSON.stringify(addresses, null, 2)}\n`)
