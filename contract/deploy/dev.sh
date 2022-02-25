#!/bin/sh -ex

./build-all.sh

yarn ts-node ./dev/deployAll.ts local
yarn ts-node ./dev/setLocalEnv.ts
