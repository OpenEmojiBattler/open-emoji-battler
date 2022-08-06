1. Install cargo-contract: https://github.com/paritytech/cargo-contract
2. Install node: https://github.com/paritytech/substrate-contracts-node
3. Run node: `substrate-contracts-node --dev --base-path=./node-data -lerror,runtime::contracts=debug --ws-port 9988`
4. Deploy: `cd deploy && ./dev.sh`
