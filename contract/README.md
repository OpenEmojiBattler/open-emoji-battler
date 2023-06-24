## Local development

1. Install cargo-contract:
    - Follow https://github.com/paritytech/cargo-contract
    - `cargo install cargo-contract --force --locked --version 3.0.1`
2. Install chain:
    - Follow https://github.com/paritytech/substrate-contracts-node
    - `cargo install contracts-node --git https://github.com/paritytech/substrate-contracts-node.git --tag v0.27.0 --force --locked`
3. Run chain: `substrate-contracts-node --base-path=./node-data --rpc-port 9988`
4. Deploy contract: `cd deploy && ./dev.sh`

Now, you can interact with the contract through [the front](../front/README.md) or [the Polkadot JS Apps](https://polkadot.js.org/apps/?rpc=ws%3A%2F%2F127.0.0.1%3A9988#/explorer).

## `ink!` versions

Our current contract code uses ink! 4, but [the contract that has been deployed and is in use on Shiden Network](https://shiden.subscan.io/account/ZzTNHqvMncxcBJs9P2wQrTWoqGVTNumRtBBLZTekKnsWnS6) was built with ink! 3.

To deploy and test the ink! 3 contract locally, please follow these instructions:

1. Prepare Rust: Change `rust-toolchain.toml`'s channel to `nightly-2023-01-01`
2. Install old chain: `cargo install contracts-node --git https://github.com/paritytech/substrate-contracts-node.git --tag v0.24.0 --force --locked`
3. Run chain
    - Remove `--base-path` directory if necessary
4. Deploy pre-built contract: `cd deploy && yarn ts-node ./202109210_init/script.ts local`
5. Update environment file: Edit `/common/js/src/envs/local.json`
    - Fill in `gameAddress` and specify `ink` 3
