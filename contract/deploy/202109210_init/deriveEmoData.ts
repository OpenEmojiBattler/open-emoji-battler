import { readFileSync, writeFileSync, copyFileSync } from "fs"
import { resolve } from "path"

const getPathFromFileRelativePath = (path: string) => resolve(__dirname, path)
const readJsonFile = (path: string) =>
  JSON.parse(readFileSync(getPathFromFileRelativePath(path), "utf8"))

let emoBases: { codepoint: number }[] = []

for (const emoBase of readJsonFile("../../../data/emoBases.json")) {
  // do not include unnecessary data to minimize size
  emoBases = emoBases.filter((e) => e.codepoint !== emoBase.codepoint)
  emoBases.push(emoBase)
}

writeFileSync(
  getPathFromFileRelativePath("./emoBases.json"),
  `${JSON.stringify(emoBases, null, 2)}\n`
)

copyFileSync(
  getPathFromFileRelativePath("../../../data/availableEmoBaseIds.json"),
  getPathFromFileRelativePath("./availableEmoBaseIds.json")
)
