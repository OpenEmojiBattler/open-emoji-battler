import { readFileSync } from "fs"
import path from "path"

import { txContract, connected } from "common"
import { loadEmoBases } from "common/src/scriptUtils"
import { instantiateContract, getEndpointAndPair } from "../utils"

import availableEmoBaseIds from "../../../data/availableEmoBaseIds.json"

const main = async () => {
  const { envName, endpoint, keyringPair } = await getEndpointAndPair()

  await connected(
    endpoint,
    async (api) => {
      const storageContract = await instantiateContract(
        api,
        keyringPair,
        "storage",
        [],
        __dirname,
        envName,
        "../../target/ink/storage/storage.contract"
      )

      const logicAdminContract = await instantiateContract(
        api,
        keyringPair,
        "logic_admin",
        [storageContract.address.toString()],
        __dirname,
        envName,
        "../../target/ink/logic_admin/logic_admin.contract"
      )
      const logicStartMtcContract = await instantiateContract(
        api,
        keyringPair,
        "logic_start_mtc",
        [storageContract.address.toString()],
        __dirname,
        envName,
        "../../target/ink/logic_start_mtc/logic_start_mtc.contract"
      )
      const logicFinishMtcShopContract = await instantiateContract(
        api,
        keyringPair,
        "logic_finish_mtc_shop",
        [storageContract.address.toString()],
        __dirname,
        envName,
        "../../target/ink/logic_finish_mtc_shop/logic_finish_mtc_shop.contract"
      )

      const forwarderContract = await instantiateContract(
        api,
        keyringPair,
        "forwarder",
        [logicStartMtcContract.address.toString(), logicFinishMtcShopContract.address.toString()],
        __dirname,
        envName,
        "../../target/ink/forwarder/forwarder.contract"
      )

      await txContract(
        storageContract,
        "allowAccount",
        [logicAdminContract.address.toString()],
        keyringPair
      )
      await txContract(
        storageContract,
        "allowAccount",
        [logicStartMtcContract.address.toString()],
        keyringPair
      )
      await txContract(
        storageContract,
        "allowAccount",
        [logicFinishMtcShopContract.address.toString()],
        keyringPair
      )

      await txContract(
        logicStartMtcContract,
        "allowAccount",
        [forwarderContract.address.toString()],
        keyringPair
      )
      await txContract(
        logicFinishMtcShopContract,
        "allowAccount",
        [forwarderContract.address.toString()],
        keyringPair
      )

      await txContract(
        logicAdminContract,
        "updateEmoBases",
        [
          loadEmoBases(
            readFileSync(path.resolve(__dirname, "../../../data/emoBases.json"), "utf8")
          ).toU8a(),
          availableEmoBaseIds.fixed,
          availableEmoBaseIds.built,
          true,
        ],
        keyringPair
      )
    },
    false
  )
}

main().catch(console.error).finally(process.exit)
