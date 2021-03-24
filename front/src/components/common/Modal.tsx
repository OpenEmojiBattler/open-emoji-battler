import * as React from "react"

export function Modal(props: { close: () => void; message: string }) {
  return (
    <div className={"modal is-active"}>
      <div className={"modal-background"} onClick={props.close} />
      <div className={"modal-content"}>
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: "1rem" }}>{props.message}</div>
          <button className={"button"} onClick={props.close}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
