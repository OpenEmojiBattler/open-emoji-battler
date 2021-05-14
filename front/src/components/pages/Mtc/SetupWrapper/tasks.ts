import { query } from "common"

import type { Account } from "~/misc/types"
import { withToggleAsync } from "~/misc/utils"
import { setupAccounts } from "~/misc/accountUtils"

export const setup = (setWaiting: (b: boolean) => void, account: Account | null) =>
  withToggleAsync(setWaiting, async () => {
    const [accounts, _builtEmoBaseIds] = await Promise.all([
      setupAccounts(account),
      query((q) => q.game.deckBuiltEmoBaseIds()),
    ])

    if (accounts.kind === "ng") {
      return accounts
    }

    const builtEmoBaseIds = _builtEmoBaseIds
      .unwrap()
      .toArray()
      .map((id) => id.toString())

    return {
      ...accounts,
      builtEmoBaseIds,
    }
  })
