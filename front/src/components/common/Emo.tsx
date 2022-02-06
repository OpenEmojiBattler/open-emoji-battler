import * as React from "react"

import { createEmo } from "~/misc/emo/element"
import { createType, emo_Attributes, emo_Base, emo_Typ } from "common"
import { removeAllChildren } from "~/misc/elementHelpers"
import { useConnection } from "~/components/App/ConnectionProvider/tasks"
import { getEmoBaseEmoji } from "~/misc/mtcUtils"

export function EmoBase(props: {
  base: emo_Base
  isTriple: boolean
  isInactive: boolean
  className?: string
}) {
  return (
    <Emo
      emoji={getEmoBaseEmoji(props.base)}
      typ={props.base.typ}
      grade={props.base.grade.toString()}
      attributes={createType("emo_Attributes", {
        attack: props.base.attack,
        health: props.base.health,
        abilities: props.base.abilities,
        is_triple: false,
      })}
      isInactive={props.isInactive}
      className={props.className}
    />
  )
}

export function Emo(props: {
  emoji: string
  typ: emo_Typ
  grade: string
  attributes: emo_Attributes
  isInactive: boolean
  className?: string
}) {
  const bases = useConnection().emoBases
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const container = ref.current
    if (!container) {
      throw new Error("ref element not found")
    }
    const emoElement = createEmo(
      props.emoji,
      props.typ,
      props.grade,
      props.attributes,
      props.isInactive,
      bases
    )
    container.appendChild(emoElement)

    return () => removeAllChildren(container)
  }, [props.emoji, props.typ, props.grade, props.attributes.is_triple.isTrue, props.isInactive])

  return <div ref={ref} className={props.className} />
}
