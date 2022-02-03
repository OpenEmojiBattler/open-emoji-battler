import * as React from "react"

import { emo_Base } from "common"

import { getEmoTypString } from "~/misc/mtcUtils"
import { EmoTypWithAll, emoTyps } from "~/misc/constants"
import { groupBy } from "~/misc/utils"
import { get_pool_emo_count_by_grade } from "~/wasm/raw"
import { useConnection } from "~/components/App/ConnectionProvider/tasks"

import { EmoBase } from "~/components/common/Emo"
import { EmoTypSelector } from "~/components/common/EmoTypSelector"

type AvailableEmoBaseIds = { fixed: string[]; built: string[] }

export function AvailableEmosByGrades(props: { bases: emo_Base[] }) {
  const connection = useConnection()
  const [availables, setAvailables] = React.useState<AvailableEmoBaseIds>({
    fixed: [],
    built: [],
  })

  React.useEffect(() => {
    Promise.all([
      connection.query.deckFixedEmoBaseIds(),
      connection.query.deckBuiltEmoBaseIds(),
    ]).then(([fixed, built]) => {
      setAvailables({
        fixed: fixed.map((id) => id.toString()),
        built: built.map((id) => id.toString()),
      })
    })
  }, [])

  const [typ, setTyp] = React.useState<EmoTypWithAll>("All")

  if (availables.fixed.length < 1) {
    return <p>loading or no data</p>
  }

  const bases = props.bases
    .filter((m) => typ === "All" || typ === m.typ.toString())
    .filter(
      (m) =>
        availables.fixed.includes(m.id.toString()) || availables.built.includes(m.id.toString())
    )
    .map(
      (m) =>
        [
          m,
          get_pool_emo_count_by_grade(m.grade.toNumber()),
          availables.fixed.includes(m.id.toString()) ? "fixed" : "built",
        ] as const
    )

  const total = bases.reduce((acc, [, n]) => acc + n, 0)

  return (
    <div>
      <EmoTypSelector active={typ} activate={setTyp} />

      <p>
        EMOs: {bases.length} (fixed: {bases.filter(([, , t]) => t === "fixed").length}, built:{" "}
        {bases.filter(([, , t]) => t === "built").length})
        <br />
        match EMOs: {total} (fixed:{" "}
        {bases.filter(([, , t]) => t === "fixed").reduce((acc, [, n]) => acc + n, 0)}, built:{" "}
        {bases.filter(([, , t]) => t === "built").reduce((acc, [, n]) => acc + n, 0)})
      </p>
      {typ === "All" ? (
        <p>
          {groupBy(bases, ([base]) => getEmoTypString(base.typ))
            .sort(([a], [b]) => emoTyps.indexOf(a) - emoTyps.indexOf(b))
            .map(
              ([typ, bases]) =>
                `${typ}: ${Math.round((bases.reduce((acc, [, n]) => acc + n, 0) / total) * 100)}%`
            )
            .join(", ")}
        </p>
      ) : (
        <></>
      )}

      <table className={"table"}>
        <thead>
          <tr>
            <th>grade</th>
            <th>EMOs</th>
            <th>total match EMOs</th>
          </tr>
        </thead>
        <tbody>
          {groupBy(bases, ([base]) => base.grade.toString())
            .sort(([g0], [g1]) => compareGrades(g0, g1))
            .map(([grade, bases]) => {
              const gradeTotal = bases.reduce((acc, [, n]) => acc + n, 0)
              return (
                <tr key={grade}>
                  <td>{grade}</td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                      {bases
                        .sort(([a, , at], [b, , bt]) => {
                          if (a.typ !== b.typ) {
                            return (
                              emoTyps.indexOf(getEmoTypString(a.typ)) -
                              emoTyps.indexOf(getEmoTypString(b.typ))
                            )
                          }
                          if (at !== bt) {
                            return at === "built" ? 1 : -1
                          }
                          return 0
                        })
                        .map(([base, , t]) => {
                          return (
                            <div key={base.id.toString()} style={{ margin: "0px 3px" }}>
                              <span>{t}</span>
                              <EmoBase base={base} isTriple={false} isInactive={false} />
                            </div>
                          )
                        })}
                    </div>
                  </td>
                  <td>
                    {bases.length} * {get_pool_emo_count_by_grade(parseInt(grade, 10))} ={" "}
                    {gradeTotal}
                    <br />({Math.round((gradeTotal / total) * 100)}%)
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}

const compareGrades = (g0: string, g1: string) => parseInt(g0, 10) - parseInt(g1, 10)
