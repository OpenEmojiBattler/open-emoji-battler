import * as React from "react"

import { ModalWithoutClose } from "./ModalWithoutClose"

export function ModalWithReload(props: { message: string }) {
  const onClick = () => window.location.replace(window.location.pathname)
  return (
    <ModalWithoutClose>
      <div style={{ textAlign: "center" }}>
        <div style={{ marginBottom: "1rem" }}>{props.message}</div>
        <button className={"button"} onClick={onClick}>
          Reload
        </button>
      </div>
    </ModalWithoutClose>
  )
}
