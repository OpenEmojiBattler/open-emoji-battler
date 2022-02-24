#!/bin/sh -ex

# example: ./build-all.sh --release

cd ../storage && cargo contract build $1 && cd -
cd ../logic_admin && cargo contract build $1 && cd -
cd ../logic_start_mtc && cargo contract build $1 && cd -
cd ../logic_finish_mtc_shop && cargo contract build $1 && cd -
cd ../forwarder && cargo contract build $1 && cd -
