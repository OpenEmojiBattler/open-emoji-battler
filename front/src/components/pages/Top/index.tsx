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
                  <span> is a decentralized competitive game led by the community.</span>
                </h1>
              </div>
              <div className={"block"}>
                <a
                  href="https://app.subsocial.network/@OpenEmojiBattler/what-is-open-emoji-battler-18370"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  About
                </a>
                <span className={"mx-3"}>•</span>
                <a
                  href="https://forum.open-emoji-battler.community/t/topic/17"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  How to Play
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
                <a href="https://discord.gg/fvXzW8hFQ7" target="_blank" rel="noopener noreferrer">
                  Discord
                </a>
                <br />
                <a
                  href="https://forum.open-emoji-battler.community/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Forum
                </a>
                <span className={"mx-3"}>•</span>
                <a
                  href="https://github.com/OpenEmojiBattler/open-emoji-battler"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
                <span className={"mx-3"}>•</span>
                <a
                  href="https://forum.open-emoji-battler.community/t/topic/18"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Japanese 遊び方
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
                <strong>Blockchain</strong>: This is a fully on-chain, open-source game built in the
                Polkadot ecosystem.
              </li>
              <li>
                <strong>Decentralized</strong>: The DAO governs this project. In contrast, most
                other blockchain games are centralized.
              </li>
              <li>
                <strong>Community</strong>: Open Emoji Battler is not a company. Instead,{" "}
                <a
                  href="https://forum.open-emoji-battler.community/t/topic/38"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  it's an independent community project
                </a>{" "}
                made by contributors.
              </li>
              <li>
                <strong>Fun</strong>: We have skilled gameplay! It's a browser auto-battler game
                inspired by Hearthstone Battlegrounds. Players can battle and earn in strategic PvP
                matches with emojis. 😁
              </li>
            </ul>
          </div>
          <h1 className={"title"}>Plan</h1>
          <div className={"content"}>
            <p>We already have a minimum playable prototype. So what's coming next?</p>
            <ul>
              <li>Gameplay upgrade</li>
              <li>EMO NFT</li>
              <li>DAO</li>
              <li>Play-to-Earn</li>
              <li>Tutorial</li>
              <li>and more...</li>
            </ul>
            <p>
              The detail can be found{" "}
              <a
                href="https://forum.open-emoji-battler.community/t/topic/37"
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </a>
              .
            </p>
          </div>
          <h1 className={"title"}>Partnerships</h1>
          <div className={"content"}>
            <ul>
              <li>
                Media partner (Japan):{" "}
                <a href="https://blockchaingame.jp/" target="_blank" rel="noopener noreferrer">
                  BlockchainGame Info
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
