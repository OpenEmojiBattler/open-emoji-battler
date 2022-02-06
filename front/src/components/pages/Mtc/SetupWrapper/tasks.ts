import { withToggleAsync } from "~/misc/utils"
import { setupAccounts } from "~/misc/accountUtils"
import type { Account, Connection } from "~/components/App/ConnectionProvider/tasks"

export const setup = (
  connection: Connection,
  setWaiting: (b: boolean) => void,
  account: Account | null
) =>
  withToggleAsync(setWaiting, async () => {
    const [accounts, _builtEmoBaseIds] = await Promise.all([
      setupAccounts(connection, account),
      connection.query.deckBuiltEmoBaseIds(),
    ])

    if (accounts.kind === "ng") {
      return accounts
    }

    const builtEmoBaseIds = _builtEmoBaseIds.toArray().map((id) => id.toString())

    return {
      ...accounts,
      builtEmoBaseIds,
    }
  })
