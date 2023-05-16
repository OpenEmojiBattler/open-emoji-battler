import { web3Accounts, web3Enable } from "@polkadot/extension-dapp"
import { mnemonicGenerate } from "@polkadot/util-crypto"
import { web3FromAddress } from "@polkadot/extension-dapp"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"
import type { Option } from "@polkadot/types-codec"
import type { ITuple } from "@polkadot/types-codec/types"
import type { BlockNumber, Index } from "@polkadot/types/interfaces/runtime"

import { buildKeyringPair } from "common"

import type {
  Account,
  Connection,
  AccountChainPlayer,
  AccountChainSession,
} from "~/components/App/ConnectionProvider/tasks"

export type ExtensionAccount = { address: string; name: string | null }

export const web3EnableOEB = () => web3Enable("Open Emoji Battler")

export const buildExtensionAccounts = (
  injectedAccounts: InjectedAccountWithMeta[],
  connection: Connection
): ExtensionAccount[] =>
  injectedAccounts.map((a) => ({
    address: connection.transformAddress(a.address),
    name: a.meta.name || null,
  }))

const setupExtension = async (): Promise<
  { kind: "ok"; injectedAccounts: InjectedAccountWithMeta[] } | { kind: "ng"; message: string }
> => {
  const extensions = await web3EnableOEB()

  if (extensions.length === 0) {
    return {
      kind: "ng",
      message: "Please install Polkadot{.js} extension and try again.",
    }
  }
  const injectedAccounts = await web3Accounts()
  if (injectedAccounts.length === 0) {
    return {
      kind: "ng",
      message: "Please add at least one account on the Polkadot{.js} extension and try again.",
    }
  }

  return {
    kind: "ok",
    injectedAccounts,
  }
}

export const setupAccounts = async (connection: Connection, account: Account | null) => {
  if (account && connection.kind !== account.kind) {
    throw new Error("invalid state: kinds of connection and account are different")
  }

  const ext = await setupExtension()
  if (ext.kind === "ng") {
    return ext
  }
  const extensionAccounts = buildExtensionAccounts(ext.injectedAccounts, connection)

  let newAccount: Account

  if (account && extensionAccounts.map((a) => a.address).includes(account.address)) {
    newAccount = { ...account }
  } else {
    newAccount = await generateAccount(connection, extensionAccounts[0].address)
  }

  return {
    kind: "ok" as const,
    account: newAccount,
    extensionAccounts,
  }
}

export const generateAccount = async (
  connection: Connection,
  playerAddress: string
): Promise<Account> => {
  const signer = (await web3FromAddress(playerAddress)).signer

  if (connection.kind === "chain") {
    const accountData = (await connection
      .api()
      .query.transactionPaymentPow.accountData(playerAddress)) as Option<
      ITuple<[BlockNumber, Index]>
    >
    const playerPowCount = accountData.isSome ? accountData.unwrap()[1].toNumber() : 0

    const playerAccount: AccountChainPlayer = {
      address: playerAddress,
      powCount: playerPowCount,
      signer,
    }

    const sessionMnemonic = mnemonicGenerate()
    const sessionAccount: AccountChainSession = {
      address: buildKeyringPair(sessionMnemonic).address,
      mnemonic: sessionMnemonic,
      powCount: 0,
      isActive: false,
    }

    return { kind: "chain", address: playerAddress, player: playerAccount, session: sessionAccount }
  } else {
    return {
      kind: "contract",
      address: playerAddress,
      signer,
    }
  }
}
