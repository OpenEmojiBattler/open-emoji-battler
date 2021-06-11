import { readFileSync, writeFileSync } from "fs"
import { encodeAddress } from "@polkadot/util-crypto"

const rmrkClaimableAddresses: string[] = JSON.parse(
  readFileSync("../front/src/components/pages/RmrkAirdrop/targetAddresses.json", "utf8")
)
const uniqueClaimableAddresses: string[] = JSON.parse(
  readFileSync("../front/src/components/pages/UniqueAirdrop/targetAddresses.json", "utf8")
).map((a: string) => encodeAddress(a, 2))

const rmrkClaimedAddresses: string[] = JSON.parse(
  readFileSync("./20210611_rmrkClaimedAddresses.json", "utf8")
)
const uniqueClaimedAddresses: string[] = JSON.parse(
  readFileSync("./20210611_uniqueClaimedAddresses.json", "utf8")
)

const rmrkValidClaimers: string[] = []
for (const claimedAddr of rmrkClaimedAddresses) {
  if (rmrkClaimableAddresses.includes(claimedAddr)) {
    rmrkValidClaimers.push(claimedAddr)
  } else {
    console.log(`rmrk invalid addr: ${claimedAddr}`)
  }
}

const uniqueValidClaimers: string[] = []
for (const claimedAddr of uniqueClaimedAddresses) {
  if (uniqueClaimableAddresses.includes(claimedAddr)) {
    uniqueValidClaimers.push(claimedAddr)
  } else {
    console.log(`unique invalid addr: ${claimedAddr}`)
  }
}

writeFileSync(
  "./20210611_rmrkValidClaimedAddresses.json",
  JSON.stringify(rmrkValidClaimers, null, 2)
)

writeFileSync(
  "./20210611_uniqueValidClaimedAddresses.json",
  JSON.stringify(uniqueValidClaimers, null, 2)
)
