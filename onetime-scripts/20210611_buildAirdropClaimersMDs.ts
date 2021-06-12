import { writeFileSync, readFileSync } from "fs"
import { encodeAddress } from "@polkadot/util-crypto"

// result:
//   https://gist.github.com/tash-2s/1c411217e9c58df2b082e46296e667e4
//   https://gist.github.com/tash-2s/2c379c014825756d50a450000c9d59f5
//   https://gist.github.com/tash-2s/030dc8f9169a96b410d65921b5a8e34e

const buildMD = (ksmAddrs: string[]) => {
  const mdLines: string[] = []

  mdLines.push("| n | substrate format address | kusama format address |")
  mdLines.push("| --- | --- | --- |")
  let n = 1
  for (const ksmAddr of ksmAddrs) {
    mdLines.push(`| ${n} | ${encodeAddress(ksmAddr)} | ${ksmAddr} |`)
    n++
  }

  return `${mdLines.join("\n")}\n`
}

;(() => {
  console.log("Gameplay")

  const addrs: string[][] = Object.values(
    JSON.parse(readFileSync("./20210519_getFirstPlayAirdropClaimedAddresses.json", "utf8"))
  )
  const ksmAddrs = addrs.map(([_sub, ksm]) => ksm)
  ksmAddrs.sort()

  console.log(`len: ${ksmAddrs.length}, uniq len: ${new Set(ksmAddrs).size}`)

  writeFileSync("./20210611_playAirdropClaimers.md", buildMD(ksmAddrs))
})()
;(() => {
  console.log("RMRK")

  const ksmAddrs: string[] = JSON.parse(
    readFileSync("./20210611_rmrkValidClaimedAddresses.json", "utf8")
  )

  writeFileSync("./20210611_rmrkAirdropClaimers.md", buildMD(ksmAddrs))
})()
;(() => {
  console.log("Unique")

  const ksmAddrs: string[] = JSON.parse(
    readFileSync("./20210611_uniqueValidClaimedAddresses.json", "utf8")
  )

  writeFileSync("./20210611_uniqueAirdropClaimers.md", buildMD(ksmAddrs))
})()
