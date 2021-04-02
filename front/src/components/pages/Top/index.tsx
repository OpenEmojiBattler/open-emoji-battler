import * as React from "react"

import { InternalLink } from "~/components/common/InternalLink"
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
                  <span>
                    {" "}
                    is an open-source indie blockchain game, led by the community, running on-chain.
                  </span>
                </h1>
              </div>
              <div className={"block"}>
                <a
                  href="https://forum.open-emoji-battler.community/t/topic/17"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <strong>Intro & How to Play</strong>
                </a>
                <span className={"mx-3"}>•</span>
                <a href="https://youtu.be/ah3-sWMATSM" target="_blank" rel="noopener noreferrer">
                  Demo Video
                </a>
                <span className={"mx-3"}>•</span>
                <a
                  href="https://twitter.com/OEB_community"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Twitter
                </a>
                <span className={"mx-3"}>•</span>
                <a
                  href="https://forum.open-emoji-battler.community/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Forum
                </a>
                <br />
                <a
                  href="https://github.com/OpenEmojiBattler/open-emoji-battler"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source Code
                </a>
                <span className={"mx-3"}>•</span>
                <a
                  href="https://forum.open-emoji-battler.community/t/topic/18"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Japanese プレイ方法
                </a>
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
          <h1 className={"title"}>What is this?</h1>
          <div className={"content"}>
            <ul>
              <li>
                async PvP auto battler
                <ul>
                  <li>strategic intense battles</li>
                </ul>
              </li>
              <li>with your favorite emojis (EMOs) 😁</li>
              <li>forum-driven development</li>
              <li>
                on-chain game building on Substrate
                <ul>
                  <li>Substrate is a blockchain framework used in Polkadot</li>
                </ul>
              </li>
              <li>
                smooth UX
                <ul>
                  <li>feeless transactions, using per-tx PoW (experimental)</li>
                  <li>
                    you only need to sign one transaction on the popup manually at the beginning of
                    the game
                  </li>
                </ul>
              </li>
              <li>fully open-sourced</li>
              <li>no VC funding</li>
            </ul>
          </div>
          <h1 className={"title"}>Future</h1>
          <div className={"content"}>
            <ul>
              <li>introduce more fun game, new features</li>
              <li>distribute NFTs</li>
              <li>use DOT or KSM</li>
              <li>become a decentralized sustainable project</li>
              <li>and more...</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
