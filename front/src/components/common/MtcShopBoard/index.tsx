import * as React from "react"

import { mtc_Board, mtc_Emo } from "common"

import { operate, Operation } from "./tasks"
import { useConnection } from "~/components/App/ConnectionProvider/tasks"
import { EmoLineButtons } from "./EmoLineButtons"

export function MtcShopBoard(props: {
  board: mtc_Board
  preShopSeed: string
  onStartOperation: (op: Operation) => void
  onFinishOperation: (op: Operation, board: mtc_Board, coinDiff: number) => void
  mtcEmoForSet: mtc_Emo | null
}) {
  const bases = useConnection().emoBases
  const ref = React.useRef<HTMLDivElement>(null)

  const [operation, setOperation] = React.useState<Operation>({ kind: "pre-shop" })
  const [buttonsDisabled, setButtonsDisabled] = React.useState(false)

  React.useEffect(() => {
    // console.log(`OP: ${JSON.stringify(operation)}`)

    if (operation.kind === "none") {
      return
    }

    props.onStartOperation(operation)
    setButtonsDisabled(true)

    operate(ref.current!, props.board, operation, props.preShopSeed, bases).then(
      ({ newBoardEmos, coinDiff, operation: op }) => {
        setOperation({ kind: "none" })
        setButtonsDisabled(false)
        props.onFinishOperation(op, newBoardEmos, coinDiff)
      }
    )
  }, [JSON.stringify(operation)])

  return (
    <div className={"emo-group emo-group-highlight"}>
      <EmoLineButtons
        boardEmoCount={props.board.length}
        setOperation={setOperation}
        disabled={buttonsDisabled}
        mtcEmoForSet={props.mtcEmoForSet}
      />
      <div className={"emo-group-line emo-group-line-emo"} ref={ref} />
    </div>
  )
}
