import { sleep } from "~/misc/utils"
import { animateIndefinitely } from "~/misc/elementHelpers"

export const animateFinish = async (
  playerGrade: number,
  rivalGrade: number,
  playerBoardGrade: number,
  rivalBoardGrade: number,
  playerHealth: number,
  rivalHealth: number
) => {
  for (const gradeEl of querySelectorAll("#mtc-battle .emo-body-inner-grade")) {
    gradeEl.style.color = "yellow"
    await sleep(200)
  }

  if (playerBoardGrade !== 0) {
    await animateBox("player", playerGrade, playerBoardGrade, rivalHealth)
  } else if (rivalBoardGrade !== 0) {
    await animateBox("rival", rivalGrade, rivalBoardGrade, playerHealth)
  }
}

type PlayerOrRival = "player" | "rival"

const animateBox = async (
  wonSide: PlayerOrRival,
  wonSideGrade: number,
  wonSideBoardGrade: number,
  lostSideHealth: number
) => {
  const lostSide: PlayerOrRival = wonSide === "player" ? "rival" : "player"
  const damage = wonSideBoardGrade + wonSideGrade

  const wonBoxEl = querySelector(`#mtc-battle-${wonSide}-box`)
  if (!wonBoxEl) {
    return
  }
  const lostBoxEl = querySelector(`#mtc-battle-${lostSide}-box`)
  if (!lostBoxEl) {
    return
  }

  await Promise.all(
    [wonBoxEl, lostBoxEl].map((e) =>
      animateIndefinitely(e, { transform: "scale(1.1)" }, { duration: 200 })
    )
  )

  // highlight box grade
  const gradeEl = querySelector(`#mtc-battle-${wonSide}-box .mtc-battle-player-box-grade`)
  if (!gradeEl) {
    return
  }
  gradeEl.style.color = "yellow"
  await sleep(500)

  // animate boxes
  wonBoxEl.style.zIndex = "1"
  await Promise.all([
    wonBoxEl.animate(
      {
        transform: [
          "translateY(0px)",
          `translateY(${wonSide === "player" ? "-" : ""}30px)`,
          "translateY(0px)",
        ],
      },
      { duration: 700, composite: "add", easing: "ease" }
    ).finished,
    sleep(500).then(
      () =>
        lostBoxEl.animate(
          {
            transform: ["rotate(0deg)", "rotate(-5deg)", "rotate(5deg)", "rotate(0deg)"],
          },
          { duration: 200, composite: "add" }
        ).finished
    ),
  ])
  await sleep(200)

  // show damage
  const rivalBoxEl = querySelector(`#mtc-battle-${lostSide}-box`)
  if (!rivalBoxEl) {
    return
  }
  const damageEl = document.createElement("div")
  damageEl.classList.add("player-icon-and-text-box-damage")
  damageEl.textContent = `${damage}`
  damageEl.style.opacity = "0"
  damageEl.style.transform = "translateY(4px)"
  rivalBoxEl.appendChild(damageEl)
  await Promise.all([
    damageEl
      .animate(
        [
          {
            opacity: "0",
            transform: "translateY(4px)",
          },
          {
            opacity: "1",
            transform: "translateY(0px)",
            offset: 0.1,
          },
          {
            opacity: "1",
            transform: "translateY(0px)",
            offset: 0.9,
          },
          {
            opacity: "0",
            transform: "translateY(4px)",
          },
        ],
        { duration: 1500 }
      )
      .finished.then(() => damageEl.remove()),
    sleep(300).then(() => {
      // update health
      const lostHealthEl = querySelector(
        `#mtc-battle-${lostSide}-box .mtc-battle-player-box-health`
      )
      if (!lostHealthEl) {
        return
      }
      lostHealthEl.textContent = `${lostSideHealth - damage}`
      lostHealthEl.classList.add("oeb-negative")
    }),
  ])
  await sleep(200)

  await Promise.all(
    [wonBoxEl, lostBoxEl].map((e) =>
      animateIndefinitely(e, { transform: "scale(1)" }, { duration: 200 })
    )
  )
}

const querySelectorAll = (selectors: string) =>
  Array.from(document.querySelectorAll(selectors)).map((e) => e as HTMLElement)

const querySelector = (selectors: string) => {
  const e = document.querySelector(selectors)
  if (e) {
    return e as HTMLElement
  } else {
    return null
  }
}
