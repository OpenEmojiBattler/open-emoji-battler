import { readFileSync, writeFileSync } from "fs"

const data = JSON.parse(readFileSync("./20220922_getLeaderboard.json", "utf8"))

const mdLines: string[] = []

mdLines.push("| Rank | Account | Best EP |", "| --- | --- | --- |")

for (const l of data.leaderboard) {
  const account = l.name ? `**\`${l.name}\`** (${l.address})` : l.address
  mdLines.push(`| ${l.rank} | ${account} | ${l.ep} |`)
}

mdLines.push("", `snapshot block: ${data.block}`)

writeFileSync("./20220923_buildLeaderboardMD.md", `${mdLines.join("\n")}\n`)
