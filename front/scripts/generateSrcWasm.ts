const fs = require("fs")

const main = () => {
  writeBase64File()
  writeIndexFile()
  writeIndexTypeFile()
}

const writeBase64File = () => {
  const wasm = fs.readFileSync("./wasm/pkgnodejs/wasm_bg.wasm")
  fs.writeFileSync("./src/wasm/base64.json", `"${wasm.toString("base64")}"\n`)
}

const writeIndexFile = () => {
  const imports = [
    ...fs
      .readFileSync("./wasm/pkgbundler/wasm_bg.js")
      .toString()
      .matchAll(/export const (__wb\w+) =/g),
  ]
    .map((m) => m[1])
    .join(", ")

  const code = `
const imports = { '__wbindgen_placeholder__': { ${imports} } };
let wasm;
export const init = async () => {
  if (wasm) {
    return;
  }

  const _wasm = await WebAssembly.instantiate(Buffer.from(base64, 'base64'), imports);
  wasm = _wasm.instance.exports;

  wasm.init_hook();
};
`

  fs.writeFileSync(
    "./src/wasm/raw.js",
    fs
      .readFileSync("./wasm/pkgbundler/wasm_bg.js")
      .toString()
      .replace("import * as wasm from './wasm_bg.wasm';", "import base64 from './base64.json';")
      .concat(code)
  )
}

const writeIndexTypeFile = () => {
  fs.writeFileSync(
    "./src/wasm/raw.d.ts",
    fs
      .readFileSync("./wasm/pkgbundler/wasm.d.ts")
      .toString()
      .concat("\nexport function init(): Promise<void>;\n")
  )
}

main()
