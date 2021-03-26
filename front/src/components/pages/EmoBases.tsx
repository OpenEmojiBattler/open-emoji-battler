import * as React from "react"

import { query, emo_ability_Ability, emo_Base } from "common"

import { getEmoBaseEmoji, getEmoBaseName, getEmoTypString } from "~/misc/mtcUtils"
import { EmoTypWithAll, emoTypsWithAll, emoTyps } from "~/misc/constants"
import { EmoBase } from "../common/Emo"
import { groupBy } from "~/misc/utils"
import { buildEmoAbilitiesText } from "~/misc/emo/abilityText"
import { get_pool_emo_count_by_grade } from "~/wasm/raw"
import { GlobalAsyncContext, useGlobalAsync } from "~/components/App/Frame/tasks"
import { Loading } from "~/components/common/Loading"

const tabs = ["All EMOs", "Available EMOs By Grades"] as const
type Tab = typeof tabs[number]

export function EmoBases() {
  const globalAsync = React.useContext(GlobalAsyncContext)

  const [tab, setTab] = React.useState<Tab>("All EMOs")

  if (!globalAsync) {
    return <Loading />
  }

  const bases = Array.from(globalAsync.emoBases.codec[0].values())

  return (
    <section className="section">
      <div className={"container"}>
        <div className={"tabs"}>
          <ul>
            {tabs.map((t) => {
              return (
                <li key={t} className={t === tab ? "is-active" : ""}>
                  <a onClick={() => setTab(t)}>{t}</a>
                </li>
              )
            })}
          </ul>
        </div>
        {tab === "All EMOs" ? (
          <AllEmosList bases={bases} />
        ) : (
          <AvailableEmosByGrades bases={bases} />
        )}
      </div>
    </section>
  )
}

function AllEmosList(props: { bases: emo_Base[] }) {
  const [typ, setTyp] = React.useState<EmoTypWithAll>("All")

  return (
    <div>
      <EmoTypSelector active={typ} activate={setTyp} />

      <table className={"table"}>
        <thead>
          <tr>
            <th>id</th>
            <th>type</th>
            <th>emoji</th>
            <th>name</th>
            <th>grade</th>
            <th>attack</th>
            <th>health</th>
            <th>abilities</th>
            <th>triple abilities</th>
          </tr>
        </thead>
        <tbody>
          {props.bases
            .filter((b) => typ === "All" || typ === b.typ.toString())
            .sort((a, b) => compareGrades(a.grade.toString(), b.grade.toString()))
            .map((b) => (
              <tr key={b.id.toString()}>
                <td>{b.id.toString()}</td>
                <td
                  style={{ backgroundColor: `var(--emo-color-${b.typ.toString().toLowerCase()})` }}
                >
                  {b.typ.type}
                </td>
                <td style={{ fontSize: "30px" }}>{getEmoBaseEmoji(b)}</td>
                <td>{getEmoBaseName(b)}</td>
                <td>{b.grade.toString()}</td>
                <td>{b.attack.toString()}</td>
                <td>{b.health.toString()}</td>
                <td>
                  <AbilitiesTable abilities={b.abilities} isTriple={false} />
                </td>
                <td>
                  <AbilitiesTable abilities={b.abilities} isTriple={true} />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

function AbilitiesTable(props: { abilities: emo_ability_Ability[]; isTriple: boolean }) {
  const globalAsync = useGlobalAsync()
  if (props.abilities.length < 1) {
    return <></>
  }

  return (
    <table className={"emo-table"}>
      <thead>
        <tr>
          <th>Phase</th>
          <th>Trigger</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {buildEmoAbilitiesText(props.abilities, props.isTriple, globalAsync.emoBases).map(
          (a, i) => {
            return (
              <tr key={i}>
                <td>{a.phase}</td>
                <td>{a.trigger}</td>
                <td>{a.action}</td>
              </tr>
            )
          }
        )}
      </tbody>
    </table>
  )
}

type AvailableEmoBaseIds = { fixed: string[]; built: string[] }

function AvailableEmosByGrades(props: { bases: emo_Base[] }) {
  const [availables, setAvailables] = React.useState<AvailableEmoBaseIds>({
    fixed: [],
    built: [],
  })

  React.useEffect(() => {
    Promise.all([
      query((q) => q.game.deckFixedEmoBaseIds()),
      query((q) => q.game.deckBuiltEmoBaseIds()),
    ]).then(([fixed, built]) => {
      setAvailables({
        fixed: fixed.unwrap().map((id) => id.toString()),
        built: built.unwrap().map((id) => id.toString()),
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

function EmoTypSelector(props: { active: EmoTypWithAll; activate: (t: EmoTypWithAll) => void }) {
  return (
    <div className={"buttons"}>
      {emoTypsWithAll.map((t) => {
        return (
          <button
            key={t}
            className={`button`}
            onClick={() => props.activate(t)}
            disabled={t === props.active}
          >
            {t}
          </button>
        )
      })}
    </div>
  )
}

const compareGrades = (g0: string, g1: string) => parseInt(g0, 10) - parseInt(g1, 10)
