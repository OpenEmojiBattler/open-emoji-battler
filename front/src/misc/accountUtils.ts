import { web3Accounts, web3Enable } from "@polkadot/extension-dapp"
import { mnemonicGenerate } from "@polkadot/util-crypto"
import { web3FromAddress } from "@polkadot/extension-dapp"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"

import { buildKeyringPair } from "common"

import type {
  Account,
  Connection,
  AccountChainPlayer,
  AccountChainSession,
} from "~/components/App/ConnectionProvider/tasks"

export const setupExtension = async (): Promise<
  { kind: "ok"; injectedAccounts: InjectedAccountWithMeta[] } | { kind: "ng"; message: string }
> => {
  const extensions = await web3Enable("Open Emoji Battler")

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
  const injectedAccounts = ext.injectedAccounts

  let newAccount: Account

  if (connection.kind === "chain") {
    if (
      account &&
      account.kind === "chain" &&
      injectedAccounts.map((a) => a.address).includes(account.address)
    ) {
      newAccount = { ...account }
    } else {
      newAccount = await buildAndGeneratePlayerAndSessionAccounts(
        connection,
        injectedAccounts[0].address
      )
    }
  } else {
    if (account) {
      newAccount = { ...account }
    } else {
      newAccount = await getAddressContract(injectedAccounts[0].address)
    }
  }

  return {
    kind: "ok" as const,
    account: newAccount,
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

    const playerAccount: AccountChainPlayer = {
      address: playerAddress,
      powCount: playerPowCount,
      signer: (await web3FromAddress(playerAddress)).signer,
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
    return getAddressContract(playerAddress)
  }
}

const getAddressContract = async (addr: string): Promise<Account> => ({
  kind: "contract",
  address: addr,
  signer: (await web3FromAddress(addr)).signer,
})
