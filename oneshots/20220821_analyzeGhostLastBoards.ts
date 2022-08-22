import data from "./20220821_getGhostLastBoards.json"

const countStrings = (strArr: string[]) =>
  Object.fromEntries(
    strArr
      .reduce<[string, number][]>((arr, cur) => {
        const f = arr.find((o) => o[0] === cur)
        if (f) {
          f[1] += 1
        } else {
          arr.push([cur, 1])
        }
        return arr
      }, [])
      .sort(([_a, a], [_b, b]) => b - a)
  )

for (const [epBand, lastBoards] of Object.entries(data)) {
  console.log(epBand)

  console.log(countStrings(lastBoards.flatMap(({ board }) => board.map((e) => e.typ))))

  console.log(lastBoards.map(({ board }) => countStrings(board.map((e) => e.typ))))

  console.log(lastBoards.map(({ grade }) => grade))
}
