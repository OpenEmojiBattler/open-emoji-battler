**This chain implementation is outdated and no longer maintained. Please use [the contract implementation](../contract/README.md) instead.**

---

## Comparison between Chain and Smart Contract

Each architecture, the chain and the smart contract, has its own set of advantages and disadvantages.

### Chain

The chain implementation provides more power and flexibility, allowing us to add chain-level features. For a smoother gameplay experience, we have developed two experimental features.

The first one is a feeless transaction feature using per-transaction PoW and Web Workers API. Generally, a blockchain requires a gas fee system to prevent DoS attacks. However, on this chain, fees are not required to play the game. Instead, your computer solves PoW using Web Worker and submits the solution. Additionally, the chain has rate limits for each account's transactions and restricts the transaction sizes. Only specific calls are allowed to use the PoW payment. This feature is still experimental, and further research and improvements are needed. For instance, currently, nodes don't have monetary incentives. Additionally, requiring a small deposit might become necessary for further attack prevention.

The second one is an implicit transaction feature using temporary session accounts. You only need to sign one transaction manually at the beginning of a match because you are given an internal account to use throughout the match.

### Smart Contract

Developing and maintaining a decentralized chain is challenging. Therefore, developing smart contracts and deploying them on other well-established smart-contract chains is beneficial. Although we can't implement chain-level features, the user experience can be enhanced with other technical solutions, such as state channels.

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
