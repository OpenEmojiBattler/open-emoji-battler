#!/bin/sh -e

mkdir -p ./dist
cat << EOS > ./dist/_redirects
https://open-emoji-battler.community/* https://game.open-emoji-battler.community/:splat 301!
https://open-emoji-battler.netlify.app/* https://game.open-emoji-battler.community/:splat 301!
EOS
