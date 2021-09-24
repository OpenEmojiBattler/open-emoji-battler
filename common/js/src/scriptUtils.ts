import { Keyring } from "@polkadot/keyring"
import { cryptoWaitReady } from "@polkadot/util-crypto"

import { getEnv } from "./utils"

export const getChainEndpointAndKeyringPair = async (envName: string, mnemonic: string) => {
  const endpoint = getEnv(envName).chainEndpoint
  const keyringPair = await getKeyringPair(mnemonic)

  return { endpoint, keyringPair }
}

export const getContractsEndpointAndKeyringPair = async (envName: string, mnemonic: string) => {
  const endpoint = getEnv(envName).contractsEndpoint
  const keyringPair = await getKeyringPair(mnemonic)

  return { endpoint, keyringPair }
}

const getKeyringPair = async (mnemonic: string) => {
  if (!mnemonic) {
    console.log("Use Alice")
  }

  await cryptoWaitReady()
  const keyring = new Keyring({ ss58Format: 42, type: "sr25519" })

  return mnemonic ? keyring.addFromMnemonic(mnemonic) : keyring.addFromUri("//Alice")
}
