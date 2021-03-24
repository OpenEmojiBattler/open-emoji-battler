import * as React from "react"

import { ModalWithoutClose } from "~/components/common/ModalWithoutClose"
import { ModalWithReload } from "../common/ModalWithReload"

export class ErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true }
  }

  componentDidCatch(_error: Error, _info: any) {
    // should log error
  }

  render = () => {
    if (!this.state.hasError) {
      return this.props.children
    }

    return <ModalWithReload message={"Something went wrong."} />
  }
}
