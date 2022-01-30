import { web3Accounts, web3Enable } from "@polkadot/extension-dapp"
import { mnemonicGenerate } from "@polkadot/util-crypto"
import type { ApiPromise } from "@polkadot/api"

import { buildKeyringPair } from "common"

import type { Account, PlayerAccount, SessionAccount } from "~/misc/types"

export const setupExtension = async () => {
  const extensions = await web3Enable("Open Emoji Battler")

  if (extensions.length === 0) {
    return {
      kind: "ng" as const,
      message: "Please install Polkadot{.js} extension and try again.",
    }
  }
  const injectedAccounts = await web3Accounts()
  if (injectedAccounts.length === 0) {
    return {
      kind: "ng" as const,
      message: "Please add at least one account on the Polkadot{.js} extension and try again.",
    }
  }

  return {
    kind: "ok" as const,
    injectedAccounts,
  }
}

export const setupAccounts = async (api: ApiPromise, account: Account | null) => {
  const ext = await setupExtension()
  if (ext.kind === "ng") {
    return ext
  }
  const injectedAccounts = ext.injectedAccounts

  let playerAccount: PlayerAccount
  let sessionAccount: SessionAccount
  if (account && injectedAccounts.map((a) => a.address).includes(account.player.address)) {
    playerAccount = account.player
    sessionAccount = account.session
  } else {
    const accounts = await buildAndGeneratePlayerAndSessionAccounts(
      api,
      injectedAccounts[0].address
    )
    playerAccount = accounts.player
    sessionAccount = accounts.session
  }

  return {
    kind: "ok" as const,
    account: {
      player: playerAccount,
      session: sessionAccount,
    },
    injectedAccounts,
  }
}

export const buildAndGeneratePlayerAndSessionAccounts = async (
  api: ApiPromise,
  playerAddress: string
) => {
  const accountData = await api.query.transactionPaymentPow.accountData(playerAddress)
  const playerPowCount = accountData.isSome ? accountData.unwrap()[1].toNumber() : 0
  const playerAccount: PlayerAccount = { address: playerAddress, powCount: playerPowCount }

  const sessionMnemonic = mnemonicGenerate()
  const sessionAccount: SessionAccount = {
    address: buildKeyringPair(sessionMnemonic).address,
    mnemonic: sessionMnemonic,
    powCount: 0,
    isActive: false,
  }

  return { player: playerAccount, session: sessionAccount }
}
