#!/bin/sh -ex

# example: ./build-all.sh --release

cd ../game && cargo contract build $1 && cd -
