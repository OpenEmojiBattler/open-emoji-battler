import path from "path"
import { instantiateContract, tx, getApiAndPair } from "../utils"

const main = async () => {
  const { api, pair } = await getApiAndPair()

  const storageContract = await instantiateContract(api, pair, buildPath("./storage"), [false])

  const logicContract = await instantiateContract(api, pair, buildPath("./logic"), [
    storageContract.address.toString(),
  ])

  await instantiateContract(api, pair, buildPath("./forwarder"), [logicContract.address.toString()])

  await tx(pair, storageContract, "allowAccount", [logicContract.address.toString()])
}

const buildPath = (relativePath: string) => path.resolve(__dirname, relativePath)

main().catch(console.error).finally(process.exit)
