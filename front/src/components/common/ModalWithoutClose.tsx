import * as React from "react"

export function ModalWithoutClose(props: { children: React.ReactNode }) {
  return (
    <div className={"modal is-active"}>
      <div className={"modal-background"} />
      <div className={"modal-content"}>
        <div>{props.children}</div>
      </div>
    </div>
  )
}
