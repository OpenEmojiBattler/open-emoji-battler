import { writeFileSync } from "fs"
import { encodeAddress } from "@polkadot/util-crypto"

import { connected, getEnv, query } from "common"

connected(getEnv("production").chainEndpoint, async () =>
  query((q) => q.firstAirdrop.playerAirdropDestinationKusamaAccountId.entries()).then((entries) => {
    const data = {} as any
    entries.forEach(([key, value]) => {
      const chainAddress = key.args[0].toString()
      const substrateAddress = value.unwrap().toString()
      const kusamaAddress = encodeAddress(substrateAddress, 2)
      data[chainAddress] = [substrateAddress, kusamaAddress]
    })

    writeFileSync(
      "./20210519_getFirstPlayAirdropClaimedAddresses.json",
      JSON.stringify(data, null, 2)
    )
  })
)
