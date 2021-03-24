import { Keyring } from "@polkadot/keyring"
import { cryptoWaitReady } from "@polkadot/util-crypto"

import { createType, query, connected, getEnv, sudo } from "common"

import emoBases from "./emoBases.json"
import availableEmoBaseIds from "./availableEmoBaseIds.json"

const main = async () => {
  const envName = process.argv[2]
  const admin = process.argv[3]

  await connected(getEnv(envName).endpoint, async () => {
    const basesMap = new Map()
    for (const m of emoBases) {
      basesMap.set(m.id, m)
    }
    const bases = createType("emo_Bases", [basesMap])

    const fixedBaseIds = availableEmoBaseIds.fixed
    const builtBaseIds = availableEmoBaseIds.built

    await cryptoWaitReady()
    const keyring = new Keyring({ ss58Format: 42, type: "sr25519" })

    if (!admin) {
      console.log("Use Alice")
    }

    const adminPair = admin ? keyring.addFromMnemonic(admin) : keyring.addFromUri("//Alice")

    const h = await sudo(
      (t) => t.game.updateEmoBases(bases, fixedBaseIds, builtBaseIds, true),
      adminPair
    )

    console.log(h.toString())

    console.log("bases", (await query((q) => q.game.emoBases())).unwrap().toJSON())
    console.log("fixed", (await query((q) => q.game.deckFixedEmoBaseIds())).unwrap().toJSON())
    console.log("built", (await query((q) => q.game.deckBuiltEmoBaseIds())).unwrap().toJSON())
  })
}

main().catch(console.error)
