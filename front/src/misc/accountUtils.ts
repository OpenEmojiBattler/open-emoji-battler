import { web3Accounts, web3Enable } from "@polkadot/extension-dapp"
import { mnemonicGenerate } from "@polkadot/util-crypto"

import { buildKeyringPair } from "common"

import type {
  Account,
  Connection,
  AccountChainPlayer,
  AccountChainSession,
} from "~/components/App/ConnectionProvider/tasks"

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

export const setupAccounts = async (connection: Connection, account: Account | null) => {
  const ext = await setupExtension()
  if (ext.kind === "ng") {
    return ext
  }
  const injectedAccounts = ext.injectedAccounts

  if (account) {
    if (connection.kind !== account.kind) {
      throw new Error("")
    }
  }

  let acc: Account

  if (connection.kind === "contract") {
    if (account) {
      acc = { kind: "contract", address: account.address }
    } else {
      acc = { kind: "contract", address: injectedAccounts[0].address }
    }
  } else {
    if (
      account &&
      account.kind === "chain" &&
      injectedAccounts.map((a) => a.address).includes(account.player.address)
    ) {
      acc = {
        kind: "chain",
        address: account.player.address,
        player: account.player,
        session: account.session,
      }
    } else {
      acc = await buildAndGeneratePlayerAndSessionAccounts(connection, injectedAccounts[0].address)
    }
  }

  return {
    kind: "ok" as const,
    account: acc,
    injectedAccounts,
  }
}

export const buildAndGeneratePlayerAndSessionAccounts = async (
  connection: Connection,
  playerAddress: string
): Promise<Account> => {
  if (connection.kind === "chain") {
    const accountData = await connection
      .api()
      .query.transactionPaymentPow.accountData(playerAddress)
    const playerPowCount = accountData.isSome ? accountData.unwrap()[1].toNumber() : 0

    const playerAccount: AccountChainPlayer = { address: playerAddress, powCount: playerPowCount }

    const sessionMnemonic = mnemonicGenerate()
    const sessionAccount: AccountChainSession = {
      address: buildKeyringPair(sessionMnemonic).address,
      mnemonic: sessionMnemonic,
      powCount: 0,
      isActive: false,
    }

    return { kind: "chain", address: playerAddress, player: playerAccount, session: sessionAccount }
  } else {
    return { kind: "contract", address: playerAddress }
  }
}
