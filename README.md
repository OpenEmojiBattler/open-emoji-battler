<div align="center">

**Open Emoji Battler** is an indie blockchain game, led by the community, running on-chain.

[Website](https://game.open-emoji-battler.community/)
&nbsp;
•
&nbsp;
[Forum](https://forum.open-emoji-battler.community/)
&nbsp;
•
&nbsp;
[Twitter](https://twitter.com/OEB_community)

<table><tr><td width="500">

https://user-images.githubusercontent.com/81064017/115994138-aef65980-a610-11eb-80c5-aa1d8cd67584.mp4

</table></tr></td>

</div>

## Overview

- Async PvP auto battler, inspired by Hearthstone Battlegrounds
- On-chain game building on Substrate
  - Substrate is a blockchain framework used in Polkadot and Kusama.
- The game system is coded in Rust, built into Wasm, and used in both blockchain and web frontend.
- Smooth transaction
  - Feeless, using per-tx PoW with Web Workers API (experimental)
  - Implicit tx with temporary session accounts
- The frontend is a SPA and uses Web Animations API to show battles.

## Technology

### Wasm

The game mechanics are written in Rust. It allows us to implement it once and use it for both chain and frontend, and it can make smooth user experiences and reduce chain works. Frontend progresses the game on its own, and it minimizes messages with chain. Chain validates frontend works, so no cheat happens.

### Feeless Transaction

In general, a blockchain needs a gas fee system to prevent DoS attacks that can brick the chain. But you don't need fees to play this game. Instead, your computer solves PoW using Web Worker and submits the solution. For further prevention, the chain has rate limits for transactions for each account and limits transaction sizes. Only game-related calls are allowed to use with PoW. This is still an experimental feature, and we need more research and improvements. (For instance, nodes don't have monetary incentives at this point. Also, requiring a small deposit might be needed for additional attack prevention in the future.)

In addition, you'll create a one-time account internally during the game, which means that you only need to sign one transaction manually at the beginning of the game.

## Development

You need Rust and Yarn.

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
