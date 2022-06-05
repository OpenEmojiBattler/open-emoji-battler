import { readFileSync } from "fs"

import { encodeAddress } from "@polkadot/util-crypto"

const main = async () => {
  const gameplay1: Array<string> = Object.values<[string, string]>(
    JSON.parse(readFileSync("./20210519_getFirstPlayAirdropClaimedAddresses.json", "utf8"))
  ).map(([_s, k]) => k)
  const twitter = readAddresses("./20210613_twitterGiveawayWinners.json")
  const rmrk = readAddresses("./20210611_rmrkValidClaimedAddresses.json")
  const unique = readAddresses("./20210611_uniqueValidClaimedAddresses.json")
  const gameplay2 = readAddresses("./20220524_mergeTargetPlayers.json")

  const target: Array<[string, Array<string>]> = [
    ["🍭", gameplay1],
    ["🤯", rmrk],
    ["📦", unique],
    ["🦕", twitter.concat(gameplay2)],
  ]

  target.forEach(([e, a]) => {
    console.log(e)
    testAddresses(a)
  })
}

const readAddresses = (path: string): Array<string> =>
  JSON.parse(readFileSync(path, "utf8")).map((a: string) => formatKusamaAddress(a))

const formatKusamaAddress = (address: string) => encodeAddress(address, 2)

const testAddresses = (addresses: Array<string>) =>
  console.log(
    `len: ${addresses.length}, first: ${addresses[0]}, last: ${addresses[addresses.length - 1]}`
  )

main()
