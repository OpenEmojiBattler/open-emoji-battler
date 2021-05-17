.PHONY: init
init:
	./scripts/init.sh

.PHONY: check
check:
	SKIP_WASM_BUILD=1 cargo check

.PHONY: test
test:
	SKIP_WASM_BUILD=1 cargo test --all

.PHONY: build
build:
	cargo build --release

.PHONY: rbuild
rbuild:
	cargo build --release -p open-emoji-battler-runtime

.PHONY: dev
dev:
	./target/release/open-emoji-battler --dev --base-path=./data

.PHONY: dev-with-log
dev-with-log:
	RUST_BACKTRACE=1 ./target/release/open-emoji-battler -lpallet_transaction_payment_pow=debug -lpallet_game=debug --dev --base-path=./data

.PHONY: purge-dev
purge-dev:
	./target/release/open-emoji-battler purge-chain --dev --base-path=./data -y
