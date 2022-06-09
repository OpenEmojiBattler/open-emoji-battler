import { connected } from "common"
import { getKeyringPair } from "common/src/scriptUtils"

const main = async () => {
  const collectionId = 3
  const targetAddress = "fill here" // Exec `set_accept_ownership` beforehand

  const sender = await getKeyringPair(process.argv[2])

  await connected(
    "wss://statemine-rpc.polkadot.io",
    async (api) => {
      const txHash = await api.tx.utility
        .batchAll([
          api.tx.uniques.setTeam(collectionId, targetAddress, targetAddress, targetAddress),
          api.tx.uniques.transferOwnership(collectionId, targetAddress),
        ])
        .signAndSend(sender)
      console.log(txHash.toString())
    },
    false
  )
}

main()
