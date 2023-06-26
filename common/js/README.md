## Generate types

Only necessary when `src/interfaces/all/_definitions.json` changes.

1. Add `"type": "module",` to `package.json`
1. Uncomment the assertion in `src/interfaces/definitions.ts`
2. Run:

```sh
NODE_OPTIONS="--no-warnings=ExperimentalWarning" npx ts-node --project "./tsconfig.typegen.json" --esm node_modules/.bin/polkadot-types-from-defs --package "." --input "./src/interfaces"
git grep -I -l -e "\.js';" -- "src/interfaces/" | xargs sed -i '' -e "s/\.js';/';/g" # mac
```
