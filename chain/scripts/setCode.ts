// run `cargo build --release -p open-emoji-battler-runtime` to build wasm
import fs from "fs"

import { tx, query, connected } from "common"
import { getEndpointAndKeyringPair } from "common/src/scriptUtils"

const main = async () => {
  const { endpoint, keyringPair } = await getEndpointAndKeyringPair(
    process.argv[2],
    process.argv[3]
  )

  const code = fs
    .readFileSync(
      "../target/release/wbuild/open-emoji-battler-runtime/open_emoji_battler_runtime.compact.wasm"
    )
    .toString("hex")
  console.log(`Code: ${code.length / 2} bytes`)

  await connected(endpoint, async () => {
    await showSpecVersion()

    const h = await tx(
      (t) => t.sudo.sudoUncheckedWeight(t.system.setCode(`0x${code}`), 0),
      keyringPair
    )
    console.log(h.toString())
  })
}

const showSpecVersion = async () => {
  console.log((await query((q) => q.system.lastRuntimeUpgrade())).unwrap().specVersion.toString())
}

main().catch(console.error)
