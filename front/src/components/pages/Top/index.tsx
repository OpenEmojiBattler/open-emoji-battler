import * as React from "react"

import { InternalLink } from "~/components/common/InternalLink"
import { ExternalLink } from "~/components/common/ExternalLink"
import { DemoMtcBattle } from "./DemoMtcBattle"

export function Top() {
  return (
    <>
      <section style={{ padding: "3rem 0rem 0rem" }}>
        <div className={"top-container"}>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            <div style={{ width: "550px", paddingRight: "1.5rem" }}>
              <div className={"block"}>
                <h1 className={"is-size-3"}>
                  <strong>Open Emoji Battler</strong>
                  <span> is a decentralized multiplayer game owned by the community.</span>
                </h1>
              </div>
              <div className={"block"}>
                <ExternalLink href="https://openemojibattler.github.io/open-emoji-battler/introduction">
                  <strong>About</strong>
                </ExternalLink>
                <span className={"mx-3"}>•</span>
                <ExternalLink href="https://openemojibattler.github.io/open-emoji-battler/how-to-play">
                  How to Play
                </ExternalLink>
                <span className={"mx-3"}>•</span>
                <ExternalLink href="https://www.youtube.com/watch?v=ah3-sWMATSM">
                  Demo Video
                </ExternalLink>
                <span className={"mx-3"}>•</span>
                <ExternalLink href="https://github.com/OpenEmojiBattler/open-emoji-battler">
                  GitHub
                </ExternalLink>
                <span className={"mx-3"}>•</span>
                <ExternalLink href="https://twitter.com/OEB_community">Twitter</ExternalLink>
              </div>
            </div>
            <div style={{ width: "550px" }}>
              <DemoMtcBattle />
            </div>
          </div>
        </div>
      </section>
      <section style={{ padding: "4rem 1.5rem 0rem" }}>
        <div className={"top-container"}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
            <div className={"buttons"}>
              <InternalLink className={"button is-medium is-strong mx-3"} to={"/match"}>
                {"Play with Polkadot{.js} extension account"}
              </InternalLink>
              <InternalLink className={"button is-medium mx-3"} to={"/match_trial"}>
                Try without account
              </InternalLink>
            </div>
          </div>
        </div>
      </section>
      <section style={{ padding: "4rem 1.5rem 3rem" }}>
        <div className={"top-container"}>
          <h1 className={"title"}>What is Open Emoji Battler?</h1>
          <div className={"content"}>
            <ul>
              <li>
                <strong>Blockchain</strong>: Open Emoji Battler is a fully on-chain, open-source
                game leveraging Wasm technology.
              </li>
              <li>
                <strong>Decentralization</strong>: The DAO owns and governs this project.
              </li>
              <li>
                <strong>Community</strong>: Open Emoji Battler is not a company but a community
                project built by contributors.
              </li>
              <li>
                <strong>Fun & Sustainable</strong>: Our auto-battler game offers strategic PvP
                battles, where players engage using their emoji units.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
