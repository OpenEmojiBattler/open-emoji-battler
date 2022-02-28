<div align="center">

<table><tr><td width="500">

https://user-images.githubusercontent.com/81064017/115994138-aef65980-a610-11eb-80c5-aa1d8cd67584.mp4

</tr></td></table>

[Website](https://game.open-emoji-battler.community/)
&nbsp;
•
&nbsp;
[Forum](https://forum.open-emoji-battler.community/)
&nbsp;
•
&nbsp;
[Twitter](https://twitter.com/OEB_community)

</div>

## Introduction

**Open Emoji Battler** is a decentralized blockchain game, owned by the community, running on-chain. This game is implemented in Rust, built into Wasm, and ran in blockchains and web frontend. There is no central server, and the web frontend can be hosted on [IPFS](https://github.com/ipfs/ipfs).

For the on-chain part, we initially started to build this game as an independent chain with blockchain framework [Substrate](https://github.com/paritytech/substrate), but now we also have a smart-contract implementation using [ink!](https://github.com/paritytech/ink). Both implementations share the most codebase with minor differences.

The strategic gameplay is inspired by [auto battler](https://en.wikipedia.org/wiki/Auto_battler) games, mainly Hearthstone Battlegrounds. Build your deck using emojis, and defeat other players!

## Vision

Our vision is to build a truly decentralized game.

Most blockchain games use central servers with private source code, and they make some in-game assets into NFTs and FTs on the chain. The developer companies have full control of the project.

In Open Emoji Battler, the players themselves build and own this project. Our technical architecture and independence from VC allow us to realize that. We've not achieved complete decentralization yet, but the groundwork is here.

We also put importance on game sustainability. For example, some play-to-earn games use Ponzi-ish schemes to attract players. We don't believe it works well in the long run, so we develop fun gameplay worth playing.

## Technology

The whole game mechanics are written in Rust. It allows us to implement it once and use it for the chain and its frontend, and it can improve user experiences and reduce chain work. The frontend progresses the game with minimum interactions with the chain. To prevent cheat, the chain validates game operations submitted from the frontend.

The frontend is a SPA and uses Web Animations API to show battles.

The game mechanics are designed to be executed on-chain in mind. So the game doesn't look simple, but it only has two transaction interfaces: starting a match and finishing a turn or a match.

### Chain vs. Smart Contract

There are pros and cons for each architecture.

#### Chain

Implementing a chain is more flexible because we can modify the runtime.

To make the gameplay experience smooth, we have two experimental systems:

- Feeless tx, using per-tx PoW with Web Workers API
- Implicit tx with temporary session accounts

In general, a blockchain needs a gas fee system to prevent DoS attacks that can brick the chain. But you don't need fees to play this game. Instead, your computer solves PoW using Web Worker and submits the solution. For further prevention, the chain has rate limits for transactions for each account and limits transaction sizes. Only game-related calls are allowed to use with PoW. This is still an experimental feature, and we need more research and improvements. (For instance, nodes don't have monetary incentives at this point. Also, requiring a small deposit might be necessary for additional attack prevention in the future.)

In addition, you'll create a one-time account internally during the game, which means that you only need to sign one transaction manually at the beginning of the game.

#### Smart Contract

Maintaining a decentralized chain is hard, so relying on well-established smart-contract chains is a nice approach. We can't implement chain-level features, but the UX can be improved with other technical solutions (e.g., state channel).

## Development

You need Rust and Yarn.

This is for chain development, but contract development is similar. See contract readme to learn more.

### Setup

```
yarn install
cp common/js/src/envs/local.example.json common/js/src/envs/local.json
```

### Start chain

```
cd chain
make build
make dev
```

### Update chain game data

```
cd chain/scripts
yarn seed-data:dev
```

### Serve web

(Back to the repository root, and...)

```
cd front
yarn dev
```

## Contribution

Any contributions are [welcome](https://forum.open-emoji-battler.community/t/topic/38)! We will appreciate that.

We know this isn't enough documented, so feel free to make an issue or ask us on our Discord server.
