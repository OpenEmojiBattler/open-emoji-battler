import { Keyring } from "@polkadot/keyring"
import { cryptoWaitReady } from "@polkadot/util-crypto"

import { getEnv } from "./utils"

export const getEndpointAndKeyringPair = async (envName: string, mnemonic: string) => {
  const endpoint = getEnv(envName).chainEndpoint

  if (!mnemonic) {
    console.log("Use Alice")
  }

  await cryptoWaitReady()
  const keyring = new Keyring({ ss58Format: 42, type: "sr25519" })

  const keyringPair = mnemonic ? keyring.addFromMnemonic(mnemonic) : keyring.addFromUri("//Alice")

  return { endpoint, keyringPair }
}
