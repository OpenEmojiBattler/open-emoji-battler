#!/bin/sh -ex

./build-all.sh --release

npx ts-node ./dev/deployAll.ts local
npx ts-node ./dev/setLocalEnv.ts
