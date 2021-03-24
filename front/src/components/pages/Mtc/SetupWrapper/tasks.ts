import { web3Accounts, web3Enable } from "@polkadot/extension-dapp"

import { query } from "common"

import type { Account, PlayerAccount, SessionAccount } from "~/misc/types"
import { withToggleAsync } from "~/misc/utils"
import { buildAndGeneratePlayerAndSessionAccounts } from "~/components/pages/Mtc/tasks"

export const setup = (setWaiting: (b: boolean) => void, account: Account | null) =>
  withToggleAsync(setWaiting, async () => {
    const [extensions, _builtEmoBaseIds] = await Promise.all([
      web3Enable("Open Emoji Battler"),
      query((q) => q.game.deckBuiltEmoBaseIds()),
    ])

    if (extensions.length === 0) {
      return {
        kind: "ng" as const,
        message: "Please install Polkadot{.js} extension and try again",
      }
    }
    const injectedAccounts = await web3Accounts()
    if (injectedAccounts.length === 0) {
      return {
        kind: "ng" as const,
        message: "Please add at least one account on the Polkadot{.js} extension and try again",
      }
    }

    let playerAccount: PlayerAccount
    let sessionAccount: SessionAccount
    if (account && injectedAccounts.map((a) => a.address).includes(account.player.address)) {
      playerAccount = account.player
      sessionAccount = account.session
    } else {
      const accounts = await buildAndGeneratePlayerAndSessionAccounts(injectedAccounts[0].address)
      playerAccount = accounts.player
      sessionAccount = accounts.session
    }

    const builtEmoBaseIds = _builtEmoBaseIds
      .unwrap()
      .toArray()
      .map((id) => id.toString())

    return {
      kind: "ok" as const,
      account: {
        player: playerAccount,
        session: sessionAccount,
      },
      injectedAccounts,
      builtEmoBaseIds,
    }
  })
