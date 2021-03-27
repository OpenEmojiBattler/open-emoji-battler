import * as React from "react"

import { emo_ability_Ability, emo_Base } from "common"

import { getEmoBaseEmoji, getEmoBaseName } from "~/misc/mtcUtils"
import { EmoTypWithAll } from "~/misc/constants"
import { buildEmoAbilitiesText } from "~/misc/emo/abilityText"
import { useGlobalAsync } from "~/components/App/Frame/tasks"

import { EmoTypSelector } from "~/components/common/EmoTypSelector"

export function AllEmos(props: { bases: emo_Base[] }) {
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
            .sort((a, b) => {
              if (a.grade.toNumber() !== b.grade.toNumber()) {
                return a.grade.toNumber() - b.grade.toNumber()
              }
              return a.codepoint.toNumber() - b.codepoint.toNumber()
            })
            .map((b) => (
              <tr key={b.id.toString()}>
                <td>{b.id.toString()}</td>
                <td
                  style={{ backgroundColor: `var(--emo-color-${b.typ.toString().toLowerCase()})` }}
                >
                  {b.typ.type}
                </td>
                <td>
                  <div style={{ fontSize: "30px" }}>{getEmoBaseEmoji(b)}</div>
                  <div style={{ fontSize: "10px" }}>
                    {b.codepoint.toString(10)}
                    <br />
                    {b.codepoint.toString(16)}
                  </div>
                </td>
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
