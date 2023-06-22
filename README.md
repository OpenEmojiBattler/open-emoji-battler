[Open Emoji Battler](https://game.open-emoji-battler.community) is a decentralized auto-battler game owned by the community. The game logic is implemented in Rust, compiled to Wasm, and runs on both the blockchain and a web frontend. The SPA frontend, which can be hosted on IPFS, only interacts with the blockchain, thereby eliminating the need for central servers. Our game provides players with fun and strategic battles where they can deploy their emoji units and challenge other players.

To learn more about this project or to refer to the player guide, please visit [our guide site](https://openemojibattler.github.io/open-emoji-battler/introduction).

<div align="center">

<table><tr><td width="500">

https://user-images.githubusercontent.com/81064017/177928297-7a75fa42-361c-48d8-b361-79a1ecad0eb1.mp4

</tr></td></table>

</div>

## Vision

We are building a decentralized, engaging multiplayer game. While most blockchain games are centralized and often prioritize monetary aspects over gameplay, we are taking a different approach with Open Emoji Battler. Here, the community is at the heart of the project. This project is open and is governed by the community to create a fun gaming experience.

## Technology

The game mechanics are coded in Rust, built into Wasm, and used for both the blockchain and frontend. It avoids the need to implement the same logic multiple times and also makes a smoother user experience. The frontend advances the game with minimal interactions with the blockchain, and then the blockchain validates the player's actions from the frontend to prevent cheating.

We use the Polkadot ecosystem for the on-chain execution. The on-chain logic was initially implemented as a standalone chain using [the Substrate framework](https://github.com/paritytech/substrate). We later developed a smart contract version with [the ink! eDSL](https://github.com/paritytech/ink), which is our current focus. Both implementations share the same codebase, but the chain implementation has a feeless transaction feature using per-transaction PoW and Web Workers. For more details, please refer to [the chain's README](./chain/README.md).

The game system is designed with on-chain execution in mind. So, despite the game's apparent complexity, it only has two transaction interfaces: starting a game and ending a turn or a game.

The frontend is a SPA and uses the Web Animations API to show battles.

## Development

Prerequisites:

- Rust
- Node.js
- Yarn

To set up your development environment, execute the following commands:

```
yarn install
cp common/js/src/envs/local.example.json common/js/src/envs/local.json
```

Then, follow the instructions for [the contract](./contract/README.md) and [the front](./front/README.md).
