import { connected, range } from "common"
import { getKeyringPair } from "common/src/scriptUtils"

const main = async () => {
  const collectionId = 3
  const itemIds = range(1306)

  const sender = await getKeyringPair(process.argv[2])

  // console.log(sender.address, itemIds)
  // return

  await connected(
    "wss://statemine-rpc.polkadot.io",
    async (api) => {
      const txHash = await api.tx.uniques.redeposit(collectionId, itemIds).signAndSend(sender)
      console.log(txHash.toString())
    },
    false
  )
}

main()
