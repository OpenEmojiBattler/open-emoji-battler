import { readFileSync } from "fs"

import { encodeAddress } from "@polkadot/util-crypto"

const main = async () => {
  const gameplay1: Array<string> = Object.values<[string, string]>(
    JSON.parse(readFileSync("./20210519_getFirstPlayAirdropClaimedAddresses.json", "utf8"))
  ).map(([_s, k]) => k)
  const rmrk = readAddresses("./20210611_rmrkValidClaimedAddresses.json")
  const unique = readAddresses("./20210611_uniqueValidClaimedAddresses.json")
  const twitter = readAddresses("./20210613_twitterGiveawayWinners.json")
  const gameplay2 = readAddresses("./20220524_mergeTargetPlayers.json")

  testAddresses(gameplay1)
  testAddresses(rmrk)
  testAddresses(unique)
  testAddresses(twitter)
  testAddresses(gameplay2)
}

const readAddresses = (path: string): Array<string> =>
  JSON.parse(readFileSync(path, "utf8")).map((a: string) => formatKusamaAddress(a))

const formatKusamaAddress = (address: string) => encodeAddress(address, 2)

const testAddresses = (addresses: Array<string>) =>
  console.log(
    `len: ${addresses.length}, first: ${addresses[0]}, last: ${addresses[addresses.length - 1]}`
  )

main()
