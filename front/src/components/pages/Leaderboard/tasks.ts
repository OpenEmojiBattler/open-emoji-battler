import { queryAddressNames } from "common"
import type { Connection } from "~/components/App/ConnectionProvider/tasks"

export const queryKusamaAddressNames = async (
  contractConnection: Connection,
  addresses: string[]
) => queryAddressNames(addresses, contractConnection.transformAddress)
