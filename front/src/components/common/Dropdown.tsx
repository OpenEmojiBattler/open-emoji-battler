import * as React from "react"

export function Dropdown<T extends number | string>(props: {
  items: Array<[T, React.ReactNode]> // [id, element]
  selectedItemId: T
  onItemSelection: (id: T) => void
  isUp: boolean
  height: string | null
}) {
  if (props.items.length < 1) {
    return (
      <div className="dropdown">
        <div className="dropdown-trigger">
          <button className="button"></button>
        </div>
      </div>
    )
  }

  const selectedItem = props.items.find(([id, _]) => id === props.selectedItemId)
  if (!selectedItem) {
    throw new Error("invalid dropdown state")
  }

  return (
    <div className={`dropdown is-hoverable ${props.isUp ? "is-up" : ""}`}>
      <div className="dropdown-trigger">
        <button className="button" style={props.height ? { height: props.height } : {}}>
          {selectedItem[1]}
          <span style={{ marginLeft: "5px" }}>{props.isUp ? "▲" : "▼"}</span>
        </button>
      </div>
      <div className="dropdown-menu">
        <div className="dropdown-content">
          {props.items.map(([id, element]) => {
            return (
              <a
                key={id}
                onClick={() => props.onItemSelection(id)}
                className={`dropdown-item ${id === props.selectedItemId ? "is-active" : ""}`}
              >
                {element}
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
