import type { ApiPromise } from "@polkadot/api"

import type { Account } from "~/misc/types"
import { withToggleAsync } from "~/misc/utils"
import { setupAccounts } from "~/misc/accountUtils"

export const setup = (api: ApiPromise, setWaiting: (b: boolean) => void, account: Account | null) =>
  withToggleAsync(setWaiting, async () => {
    const [accounts, _builtEmoBaseIds] = await Promise.all([
      setupAccounts(api, account),
      api.query.game.deckBuiltEmoBaseIds(),
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
