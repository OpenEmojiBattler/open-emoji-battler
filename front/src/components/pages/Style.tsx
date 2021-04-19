import * as React from "react"

import { GlobalAsyncContext } from "~/components/App/Frame/tasks"
import { Loading } from "~/components/common/Loading"
import { EmoBase } from "../common/Emo"
import { findEmoBaseByStringId } from "~/misc/mtcUtils"
import { emoElementWidth, emoElementHeight } from "~/misc/emo/elementAnimations"

export function Style() {
  const globalAsync = React.useContext(GlobalAsyncContext)

  if (!globalAsync) {
    return <Loading />
  }

  const fn = () => {
    const el = document.getElementsByClassName("emo")[0] as HTMLElement
    const { left, top } = el.getBoundingClientRect()
    for (let i = 0; i < 20; i++) {
      createParticle(Math.floor(left + emoElementWidth / 2), Math.floor(top + emoElementHeight / 2))
    }
  }

  return (
    <section className="section">
      <div className={"container"}>
        <div className={"block"}>
          <button onClick={fn}>Push me!</button>
          <br />
          <br />
          <EmoBase
            base={findEmoBaseByStringId("1", globalAsync.emoBases)}
            isTriple={true}
            isInactive={false}
          />
        </div>
      </div>
    </section>
  )
}

function createParticle(x: number, y: number) {
  const particle = document.createElement("i")
  particle.classList.add("particle")
  document.body.appendChild(particle)

  const size = Math.floor(Math.random() * 10 + 5)
  particle.style.width = `${size}px`
  particle.style.height = `${size}px`
  particle.style.background = `hsl(${Math.random() * 30 + 30}, ${Math.floor(
    Math.random() * 40 + 50
  )}%, ${Math.floor(Math.random() * 40 + 50)}%)`

  const destinationX = Math.floor(x + (Math.random() - 0.5) * 2 * 100)
  const destinationY = Math.floor(y + (Math.random() - 0.5) * 2 * 100)

  particle
    .animate(
      [
        {
          transform: `translate(${Math.floor(x - size / 2)}px, ${Math.floor(y - size / 2)}px)`,
          opacity: 1,
        },
        {
          transform: `translate(${destinationX}px, ${destinationY}px)`,
          opacity: 0,
        },
      ],
      {
        duration: Math.floor(500 + Math.random() * 1000),
        easing: "ease-out",
        delay: Math.floor(Math.random() * 200),
      }
    )
    .finished.then(() => particle.remove())
}
