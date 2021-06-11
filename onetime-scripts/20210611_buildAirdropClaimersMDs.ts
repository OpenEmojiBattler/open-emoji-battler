import { writeFileSync, readFileSync } from "fs"
import { encodeAddress } from "@polkadot/util-crypto"

const buildMD = (ksmAddrs: string[]) => {
  const mdLines: string[] = []

  mdLines.push("| substrate format address (kusama format address) |")
  mdLines.push("| --- |")
  for (const ksmAddr of ksmAddrs) {
    mdLines.push(`| ${encodeAddress(ksmAddr)} (${ksmAddr}) |`)
  }
  mdLines.push("\n")

  return mdLines.join("\n")
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
