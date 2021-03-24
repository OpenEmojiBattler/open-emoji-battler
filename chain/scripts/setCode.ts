// run `cargo build --release -p open-emoji-battler-runtime` to build wasm
import fs from "fs"

import { cryptoWaitReady } from "@polkadot/util-crypto"
import { Keyring } from "@polkadot/keyring"

import { tx, query, connected, getEnv } from "common"

const main = async () => {
  const envName = process.argv[2]
  const adminMnemonic = process.argv[3]

  await cryptoWaitReady()

  const keyring = new Keyring({ ss58Format: 42, type: "sr25519" })

  const adminPair = adminMnemonic
    ? keyring.addFromMnemonic(adminMnemonic)
    : keyring.addFromUri("//Alice")

  const code = fs
    .readFileSync(
      "../target/release/wbuild/open-emoji-battler-runtime/open_emoji_battler_runtime.compact.wasm"
    )
    .toString("hex")
  console.log(`Code: ${code.length / 2} bytes`)

  await connected(getEnv(envName).endpoint, async () => {
    await showSpecVersion()

    const h = await tx(
      (t) => t.sudo.sudoUncheckedWeight(t.system.setCode(`0x${code}`), 0),
      adminPair
    )
    console.log(h.toString())
  })
}

const showSpecVersion = async () => {
  console.log((await query((q) => q.system.lastRuntimeUpgrade())).unwrap().specVersion.toString())
}

main().catch(console.error)
