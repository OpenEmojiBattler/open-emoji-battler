import { readFileSync } from "fs"

import { encodeAddress } from "@polkadot/util-crypto"
import { stringToHex } from "@polkadot/util"

import { connected } from "common"
import { getKeyringPair } from "common/src/scriptUtils"

const main = async () => {
  const target = getTarget()
  const collectionId = 123
  const collectionMetadata = buildMetadata(
    "<svg xmlns='http://www.w3.org/2000/svg' style='background:black'></svg>",
    "👑"
  )

  const sender = await getKeyringPair(process.argv[2])
  console.log(`sender: ${sender.address}`)

  await connected(
    "wss://westmint-rpc.polkadot.io",
    async (api) => {
      const txs = [
        api.tx.uniques.create(collectionId, sender.address),
        api.tx.uniques.setClassMetadata(collectionId, collectionMetadata, false),
      ]

      let itemId = 0

      for (const [emoji, addresses] of target) {
        const itemMetadata = buildMetadata(
          `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 -7 9 9'><text font-size='7'>${emoji}</text></svg>`
        )
        for (const address of addresses) {
          txs.push(
            api.tx.uniques.mint(collectionId, itemId, address),
            api.tx.uniques.setMetadata(collectionId, itemId, itemMetadata, false),
            api.tx.uniques.setAttribute(
              collectionId,
              itemId,
              stringToHex("emoji"),
              stringToHex(emoji)
            )
          )
        }
      }

      const txHash = await api.tx.utility.batchAll(txs).signAndSend(sender)
      console.log(txHash.toString())
    },
    false
  )
}

const getTarget = (): Array<[string, Array<string>]> => {
  const gameplay1: Array<string> = Object.values<[string, string]>(
    JSON.parse(readFileSync("./20210519_getFirstPlayAirdropClaimedAddresses.json", "utf8"))
  ).map(([_s, k]) => k)
  const twitter = readAddresses("./20210613_twitterGiveawayWinners.json")
  const rmrk = readAddresses("./20210611_rmrkValidClaimedAddresses.json")
  const unique = readAddresses("./20210611_uniqueValidClaimedAddresses.json")
  const gameplay2 = readAddresses("./20220524_mergeTargetPlayers.json")

  return [
    ["🍭", gameplay1],
    ["🤯", rmrk],
    ["📦", unique],
    ["🦕", twitter.concat(gameplay2)],
  ]
}

const readAddresses = (path: string): Array<string> =>
  JSON.parse(readFileSync(path, "utf8")).map((a: string) => formatKusamaAddress(a))

const formatKusamaAddress = (address: string) => encodeAddress(address, 2)

const buildMetadata = (svg: string, name?: string) => {
  const image = `data:image/svg+xml,${svg}`
  return stringToHex(
    JSON.stringify(
      name
        ? {
            name,
            image,
          }
        : { image }
    )
  )
}

main()
