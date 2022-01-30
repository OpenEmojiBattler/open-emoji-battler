// run `cargo build --release -p open-emoji-battler-runtime` to build wasm
import fs from "fs"

import { tx, connected } from "common"
import { getChainEndpointAndKeyringPair } from "common/src/scriptUtils"

const main = async () => {
  const { endpoint, keyringPair } = await getChainEndpointAndKeyringPair(
    process.argv[2],
    process.argv[3]
  )

  const code = fs
    .readFileSync(
      "../target/release/wbuild/open-emoji-battler-runtime/open_emoji_battler_runtime.compact.wasm"
    )
    .toString("hex")
  console.log(`Code: ${code.length / 2} bytes`)

  await connected(endpoint, async (api) => {
    console.log((await api.query.system.lastRuntimeUpgrade()).unwrap().specVersion.toString())

    const h = await tx(
      api,
      (t) => t.sudo.sudoUncheckedWeight(t.system.setCode(`0x${code}`), 0),
      keyringPair
    )
    console.log(h.toString())
  })
}

main().catch(console.error)
