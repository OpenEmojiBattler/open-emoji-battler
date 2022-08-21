import data from "./20220821_getGhostLastBoards.json"

for (const [epBand, lastBoards] of Object.entries(data)) {
  console.log(epBand)
  console.log(
    lastBoards
      .flatMap(({ board }) => board.map((e) => e.typ))
      .reduce<Record<string, number>>((obj, cur) => {
        if (obj[cur]) {
          obj[cur] += 1
        } else {
          obj[cur] = 1
        }
        return obj
      }, {})
  )
}
