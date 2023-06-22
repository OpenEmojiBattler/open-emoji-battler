**This chain implementation is outdated and no longer maintained. Please use [the contract implementation](../contract/README.md) instead.**

---

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

### Start chain

```
make build
make dev
```

### Update chain game data

```
cd scripts
yarn seed-data:dev
```
