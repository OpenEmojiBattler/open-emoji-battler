# Open Emoji Battler

Open Emoji Battler is an open-source indie blockchain game, led by the community, running on-chain.

- [Website](https://game.open-emoji-battler.community/)
- [Forum](https://forum.open-emoji-battler.community/)
- [Twitter](https://twitter.com/OEB_community)

## Overview

- Async PvP auto battler
- On-chain game building on Substrate
- The game system is coded in Rust, built into Wasm, and used in both blockchain and web frontend
- Smooth transactions
  - Feeless, using per-tx PoW (experimental)
    - Web Workers
  - Implicit tx with temporary session accounts
- The frontend is a SPA and uses Web Animations API to show battles

## Development

You need Rust and Yarn.

### Start chain

```
cd chain
make init
make build
make dev
```

### Update chain game data

```
cd data
yarn install
yarn seed:dev
```

### Serve web

(Back to the repository root, and...)

```
cd front
yarn install
yarn dev
```
