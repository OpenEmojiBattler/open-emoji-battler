import * as React from "react"

import { mtc_Emo } from "common"

import { emoBuyCoin } from "~/misc/constants"
import { useConnection } from "~/components/App/ConnectionProvider/tasks"
import { findEmoBase, getCoinText } from "~/misc/mtcUtils"
import { EmoBase } from "~/components/common/Emo"

export function Catalog(props: {
  catalog: mtc_Emo[][]
  currentCatalogLineIndex: number
  grade: number
  selectEmoToBuy: (e: mtc_Emo | null) => void
  selectedEmoToBuy: mtc_Emo | null
  isMaxBoard: boolean
  coin: number
  unavailableToBuyMtcEmoIds: string[]
  disabled: boolean
}) {
  const isPurchasable = !props.isMaxBoard && props.coin >= emoBuyCoin
  const catalog = props.catalog.filter((_, i) => i >= props.currentCatalogLineIndex)
  const currentCatalogLine = catalog.shift()
  if (!currentCatalogLine) {
    throw new Error("Invalid state: currentCatalogLine")
  }

  const lines = catalog.map((catalogLine) => {
    return (
      <Line
        key={catalogLine.map((e) => e.id.toString()).join(":")}
        catalogLine={catalogLine}
        grade={props.grade}
        unavailableToBuyMtcEmoIds={props.unavailableToBuyMtcEmoIds}
      />
    )
  })

  return (
    <>
      <h2 className={"title is-size-4"}>
        Catalog
        {props.selectedEmoToBuy ? (
          <button
            className="button is-small"
            style={{ marginLeft: "10px" }}
            onClick={() => props.selectEmoToBuy(null)}
          >
            Unselect
          </button>
        ) : (
          <></>
        )}
      </h2>
      <div className={"block"}>
        <CurrentLine
          catalogLine={currentCatalogLine}
          grade={props.grade}
          selectEmoToBuy={props.selectEmoToBuy}
          selectedEmoToBuy={props.selectedEmoToBuy}
          isPurchasable={isPurchasable}
          unavailableToBuyMtcEmoIds={props.unavailableToBuyMtcEmoIds}
          disabled={props.disabled}
        />
        <div className={"emo-group"}>{lines}</div>
      </div>
    </>
  )
}

function CurrentLine(props: {
  catalogLine: mtc_Emo[]
  grade: number
  selectEmoToBuy: (e: mtc_Emo) => void
  selectedEmoToBuy: mtc_Emo | null
  isPurchasable: boolean
  unavailableToBuyMtcEmoIds: string[]
  disabled: boolean
}) {
  const bases = useConnection().emoBases

  const controls = []
  const emos = []

  for (const mtcEmo of props.catalogLine.sort(
    (e0, e1) =>
      findEmoBase(e0.base_id, bases).grade.toNumber() -
      findEmoBase(e1.base_id, bases).grade.toNumber()
  )) {
    const base = findEmoBase(mtcEmo.base_id, bases)
    const emoGrade = base.grade.toNumber()
    const isUnavailable = props.unavailableToBuyMtcEmoIds.includes(mtcEmo.id.toString())

    controls.push(
      <div key={mtcEmo.id.toString()}>
        <button
          className={"button is-small"}
          onClick={() => props.selectEmoToBuy(mtcEmo)}
          disabled={
            !(!props.disabled && props.isPurchasable && !isUnavailable && props.grade >= emoGrade)
          }
        >
          Buy {getCoinText(emoBuyCoin)}
        </button>
      </div>
    )

    emos.push(
      <EmoBase
        key={mtcEmo.id.toString()}
        base={base}
        isTriple={false}
        isInactive={isUnavailable || props.grade < emoGrade}
      />
    )
  }

  return (
    <div className={"emo-group emo-group-highlight"}>
      <div className={"emo-group-line emo-group-line-controls"}>{controls}</div>
      <div className={"emo-group-line"}>{emos}</div>
    </div>
  )
}

function Line(props: {
  catalogLine: mtc_Emo[]
  grade: number
  unavailableToBuyMtcEmoIds: string[]
}) {
  const bases = useConnection().emoBases

  const emos = props.catalogLine
    .map((mtcEmo) => {
      const base = findEmoBase(mtcEmo.base_id, bases)
      const emoGrade = base.grade.toNumber()
      const isUnavailable = props.unavailableToBuyMtcEmoIds.includes(mtcEmo.id.toString())
      return [
        <EmoBase
          key={mtcEmo.id.toString()}
          base={base}
          isTriple={false}
          isInactive={isUnavailable || props.grade < emoGrade}
        />,
        emoGrade,
      ] as const
    })
    .sort(([_0, g0], [_1, g1]) => g0 - g1)
    .map(([e, _]) => e)

  return (
    <div className={"emo-group-line"} style={{ marginBottom: "8px" }}>
      {emos}
    </div>
  )
}
