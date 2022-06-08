import { readFileSync } from "fs"

import { encodeAddress } from "@polkadot/util-crypto"
import { stringToHex } from "@polkadot/util"
import type { SubmittableExtrinsic } from "@polkadot/api/types"

import { connected, range } from "common"
import { getKeyringPair } from "common/src/scriptUtils"

const main = async () => {
  const target = getTarget()
  const collectionId = 3

  const sender = await getKeyringPair(process.argv[2])

  const step = Number(process.argv[3])
  if (![0, 1, 2, 3, 4].includes(step)) {
    throw new Error("invalid step")
  }

  console.log(`step: ${step}, sender: ${sender.address}`)

  await connected(
    "wss://statemine-rpc.polkadot.io",
    async (api) => {
      const txs: Array<SubmittableExtrinsic<"promise">> = []

      if (step === 0) {
        const collectionMetadata = buildMetadata(
          "<svg xmlns='http://www.w3.org/2000/svg' style='background:black'></svg>",
          "👑"
        )

        txs.push(
          api.tx.uniques.create(collectionId, sender.address),
          api.tx.uniques.setClassMetadata(collectionId, collectionMetadata, false)
        )
      } else {
        const targetIndex = step - 1

        let itemId = 0
        if (targetIndex !== 0) {
          itemId = range(targetIndex)
            .map((n) => target[n][1].length)
            .reduce((a, b) => a + b)
        }

        const [emoji, addresses] = target[targetIndex]
        const itemMetadata = buildMetadata(
          `<svg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -5 9 9'><text font-size='1'>${emoji}</text></svg>`
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
          itemId++
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
