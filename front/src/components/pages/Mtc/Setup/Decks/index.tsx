import * as React from "react"

import { emo_Base } from "common"

import {
  getDefaultDeck,
  groupEmoBasesByGrades,
  getGradeText,
  findEmoBaseByStringId,
} from "~/misc/mtcUtils"
import { useAccount, useGlobalAsync } from "~/components/App/ChainProvider/tasks"
import { EmoBase } from "~/components/common/Emo"
import { Dropdown } from "~/components/common/Dropdown"
import { addDeck, deleteDeck, getDecks, selectDeckIndex } from "./tasks"

export function Decks(props: { builtEmoBaseIds: string[]; setDeck: (d: string[]) => void }) {
  const address = useAccount().player.address
  const bases = useGlobalAsync().emoBases
  const [decks, setDecks] = React.useState<string[][]>([])
  const [selectedDeckIndex, setSelectedDeckIndex] = React.useState<number | null>(null)
  const [isAddingNewDeck, setIsAddingNewDeck] = React.useState(false)

  React.useEffect(() => {
    updateDecksState()
  }, [address, props.builtEmoBaseIds.join(":")])

  const updateDecksState = () => {
    const { decks: _decks, selectedDeckIndex: _selectedDeckIndex } = getDecks(
      address,
      bases,
      props.builtEmoBaseIds
    )
    props.setDeck(_decks[_selectedDeckIndex])
    setDecks(_decks)
    setSelectedDeckIndex(_selectedDeckIndex)
  }

  return (
    <>
      <div className={"block"}>
        {decks.map((deck, i) => {
          const selected = i === selectedDeckIndex
          const isStaleDeck = !deck.every((id) => props.builtEmoBaseIds.includes(id))
          const deletable = !(i === 0 || selected)
          const _selectDeckIndex = () => {
            selectDeckIndex(address, i, bases, props.builtEmoBaseIds)
            updateDecksState()
          }
          const _deleteDeck = () => {
            deleteDeck(address, i)
            updateDecksState()
          }

          const controls = []
          const emos = []
          for (const eid of deck) {
            const base = findEmoBaseByStringId(eid, bases)
            controls.push(<div key={eid}>{getGradeText(base.grade.toString())}</div>)
            emos.push(<EmoBase key={eid} base={base} isTriple={false} isInactive={false} />)
          }

          return (
            <div key={deck.join(":")}>
              <div className={`emo-group ${selected ? "emo-group-highlight" : ""}`}>
                <div className={"emo-group-line emo-group-line-controls"}>{controls}</div>
                <div className={"emo-group-line"}>
                  {emos}
                  <div>
                    {isStaleDeck ? <div>[STALE]</div> : <></>}
                    <button
                      className={"button is-small"}
                      style={{ marginBottom: "4px" }}
                      disabled={selected || isStaleDeck}
                      onClick={_selectDeckIndex}
                    >
                      {selected ? "Selected" : "Select"}
                    </button>
                    <br />
                    {i === 0 ? (
                      "Default"
                    ) : (
                      <button
                        disabled={!deletable}
                        onClick={_deleteDeck}
                        className={"button is-small"}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className={"block"}>
        {isAddingNewDeck ? (
          <DeckBuilder
            address={address}
            builtEmoBaseIds={props.builtEmoBaseIds}
            onFinish={() => {
              setIsAddingNewDeck(false)
              updateDecksState()
            }}
          />
        ) : (
          <button className={"button"} onClick={() => setIsAddingNewDeck(true)}>
            Build New Deck
          </button>
        )}
      </div>
    </>
  )
}

function DeckBuilder(props: { address: string; builtEmoBaseIds: string[]; onFinish: () => void }) {
  const bases = useGlobalAsync().emoBases
  const basesByGrades = groupEmoBasesByGrades(bases, props.builtEmoBaseIds)
  const [selected, setSelected] = React.useState(() => getDefaultDeck(bases, props.builtEmoBaseIds))

  const save = () => {
    addDeck(props.address, selected, bases, props.builtEmoBaseIds)
    props.onFinish()
  }

  const controls: JSX.Element[] = []
  const emos: JSX.Element[] = []
  basesByGrades.forEach(([grade, ms], i) => {
    const style: React.CSSProperties = { width: "120px" }
    controls.push(
      <div key={grade} style={style}>
        {getGradeText(grade)}
      </div>
    )
    emos.push(
      <div key={grade} style={style}>
        <BasesDropdown
          bases={ms}
          selectedBaseId={selected[i]}
          onSelect={(id) => {
            const _selected = [...selected]
            _selected[i] = id
            setSelected(_selected)
          }}
        />
      </div>
    )
  })

  return (
    <div className={"emo-group"}>
      <div className={"emo-group-line emo-group-line-controls"}>{controls}</div>
      <div className={"emo-group-line"}>
        {emos}
        <div>
          <div className={"buttons"}>
            <button className={"button is-small"} onClick={save}>
              Save
            </button>
            <button className={"button is-small"} onClick={props.onFinish}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function BasesDropdown(props: {
  bases: emo_Base[]
  selectedBaseId: string
  onSelect: (id: string) => void
}) {
  const items = props.bases.map((base): [string, React.ReactNode] => {
    return [base.id.toString(), <EmoBase base={base} isTriple={false} isInactive={false} />]
  })
  return (
    <Dropdown
      items={items}
      selectedItemId={props.selectedBaseId}
      onItemSelection={props.onSelect}
      isUp={true}
      height={"111px"}
    />
  )
}
