import { readFileSync, writeFileSync } from "fs"

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"))

const newJson = readJson("../../common/js/src/envs/local.example.json")
newJson.contract.gameAddress = readJson("./dev/instantiatedAddress.game.local.json")

writeFileSync("../../common/js/src/envs/local.json", `${JSON.stringify(newJson, null, 2)}\n`)
