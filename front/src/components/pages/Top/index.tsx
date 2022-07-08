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
                  <span> is a decentralized competitive game led by the community.</span>
                </h1>
              </div>
              <div className={"block"}>
                <ExternalLink href="https://forum.open-emoji-battler.community/t/topic/60">
                  <strong>About</strong>
                </ExternalLink>
                <span className={"mx-3"}>•</span>
                <ExternalLink href="https://forum.open-emoji-battler.community/t/topic/17">
                  How to Play
                </ExternalLink>
                <span className={"mx-3"}>•</span>
                <ExternalLink href="https://youtu.be/ah3-sWMATSM">Demo Video</ExternalLink>
                <span className={"mx-3"}>•</span>
                <ExternalLink href="https://twitter.com/OEB_community">Twitter</ExternalLink>
                <span className={"mx-3"}>•</span>
                <ExternalLink href="https://discord.gg/fvXzW8hFQ7">Discord</ExternalLink>
                <br />
                <ExternalLink href="https://forum.open-emoji-battler.community/">
                  Forum
                </ExternalLink>
                <span className={"mx-3"}>•</span>
                <ExternalLink href="https://github.com/OpenEmojiBattler/open-emoji-battler">
                  GitHub
                </ExternalLink>
                <span className={"mx-3"}>•</span>
                <ExternalLink href="https://forum.open-emoji-battler.community/t/topic/18">
                  Japanese 遊び方
                </ExternalLink>
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
                <ExternalLink href="https://forum.open-emoji-battler.community/t/topic/38">
                  it's an independent community project
                </ExternalLink>{" "}
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
              <ExternalLink href="https://forum.open-emoji-battler.community/t/topic/37">
                here
              </ExternalLink>
              .
            </p>
          </div>
          <h1 className={"title"}>Partnerships</h1>
          <div className={"content"}>
            <ul>
              <li>
                Media partner (Japan):{" "}
                <ExternalLink href="https://blockchaingame.jp/">BlockchainGame Info</ExternalLink>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
