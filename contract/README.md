1. Install node: https://github.com/paritytech/substrate-contracts-node
2. Run node: `substrate-contracts-node --dev --base-path=./node-data -lerror,runtime::contracts=debug --ws-port 9988`
3. Deploy: `cd deploy && ./dev.sh`