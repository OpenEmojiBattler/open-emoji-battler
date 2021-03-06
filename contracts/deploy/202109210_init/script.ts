import { instantiateContract, tx, getApiAndPair } from "../utils"

const main = async () => {
  const { envName, api, keyringPair } = await getApiAndPair()

  const storageContract = await instantiateContract(
    api,
    keyringPair,
    "storage",
    [false],
    __dirname,
    envName
  )

  const logicContract = await instantiateContract(
    api,
    keyringPair,
    "logic",
    [storageContract.address.toString()],
    __dirname,
    envName
  )

  await instantiateContract(
    api,
    keyringPair,
    "forwarder",
    [logicContract.address.toString()],
    __dirname,
    envName
  )

  await tx(keyringPair, storageContract, "allowAccount", [logicContract.address.toString()])
}

main().catch(console.error).finally(process.exit)
