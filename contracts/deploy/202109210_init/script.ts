import { instantiateContract, tx, getApiAndPair } from "../utils"

const main = async () => {
  const { api, pair } = await getApiAndPair()

  const storageContract = await instantiateContract(
    api,
    pair,
    "../../storage/target/ink/storage.contract",
    [false]
  )

  const logicContract = await instantiateContract(
    api,
    pair,
    "../../logic/target/ink/logic.contract",
    [storageContract.address.toString()]
  )

  await instantiateContract(api, pair, "../../forwarder/target/ink/forwarder.contract", [
    logicContract.address.toString(),
  ])

  await tx(pair, storageContract, "allowAccount", [logicContract.address.toString()])
}

main().catch(console.error).finally(process.exit)
