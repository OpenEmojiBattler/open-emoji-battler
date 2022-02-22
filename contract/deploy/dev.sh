#!/bin/sh -ex

cd ../storage && cargo contract build && cd -
cd ../logic_admin && cargo contract build && cd -
cd ../logic_start_mtc && cargo contract build && cd -
cd ../logic_finish_mtc_shop && cargo contract build && cd -
cd ../forwarder && cargo contract build && cd -

yarn ts-node ./dev/deployAll.ts local

echo "{\"chainEndpoint\":\"ws://127.0.0.1:9944\",\"contract\":{\"endpoint\":\"ws://127.0.0.1:9988\",\"storageAddress\":`cat ./dev/instantiatedAddress.storage.local.json`,\"forwarderAddress\":`cat ./dev/instantiatedAddress.forwarder.local.json`}}" > ../../common/js/src/envs/local.json
