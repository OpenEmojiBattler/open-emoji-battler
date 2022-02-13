import { Keyring } from "@polkadot/keyring"
import { cryptoWaitReady } from "@polkadot/util-crypto"

import { createType } from "./api"
import { getEnv } from "./env"

export const getChainEndpointAndKeyringPair = async (envName: string, mnemonic: string) => {
  const endpoint = getEnv(envName).chainEndpoint
  const keyringPair = await getKeyringPair(mnemonic)

  return { endpoint, keyringPair }
}

export const getContractEnvAndKeyringPair = async (envName: string, mnemonic: string) => {
  const contract = getEnv(envName).contract
  const keyringPair = await getKeyringPair(mnemonic)

  return { contract, keyringPair }
}

const getKeyringPair = async (mnemonic: string) => {
  if (!mnemonic) {
    console.log("Use Alice")
  }

  await cryptoWaitReady()
  const keyring = new Keyring({ ss58Format: 42, type: "sr25519" })

  return mnemonic ? keyring.addFromMnemonic(mnemonic) : keyring.addFromUri("//Alice")
}

export const loadEmoBases = (emoBasesJsonString: string) => {
  const emoBases = JSON.parse(emoBasesJsonString)
  const basesMap = new Map()

  const usedIds: number[] = []
  for (const m of emoBases) {
    const id = m.id

    if (usedIds.includes(id)) {
      throw new Error(`found id duplication: ${id}`)
    }
    usedIds.push(id)

    basesMap.set(id, m)
  }

  return createType("emo_Bases", [basesMap])
}
