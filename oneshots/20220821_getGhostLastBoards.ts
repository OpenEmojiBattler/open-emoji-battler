import { writeFileSync } from "fs"

import { connected, getEnv } from "common"
import emoBases from "../data/emoBases.json"

connected(getEnv("production").chainEndpoint, async (api) => {
  const data = (await api.query.game.matchmakingGhosts.entries()).reduce<Record<string, {}>>(
    (obj, [key, value]) => {
      obj[key.args[0].toString()] = value.unwrap().map(([_a, _e, ghost]) => {
        const gradeAndBoard = ghost.history.pop()
        if (!gradeAndBoard) {
          throw new Error()
        }
        const grade = gradeAndBoard.grade.toNumber()
        const board = gradeAndBoard.board.map((emo) => {
          const baseId = emo.base_id.toNumber()
          return {
            baseId,
            typ: emoBases.find((b) => b.id === baseId)!.typ,
            attributes: emo.attributes.toJSON(),
          }
        })
        return { grade, board }
      })
      return obj
    },
    {}
  )

  writeFileSync("./20220821_getGhostLastBoards.json", `${JSON.stringify(data, null, 2)}\n`)
})
