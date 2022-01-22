import fs from "fs"
import { execSync } from "child_process"

import { defs, AnyDef } from "./codecTypesDefs"

const main = () => {
  writeRsFile()
  writeTsFile()
}

const writeRsFile = () => {
  const lines = ["// Auto-generated via `yarn generate-codec-types`"]
  lines.push("use parity_scale_codec::{Decode, Encode};")
  lines.push("use sp_std::{collections::btree_map::BTreeMap, prelude::*};\n")

  lines.push('#[cfg(feature = "ink")]\nuse codec_types_derive::SpreadLayoutOneStorageCell;')
  lines.push('#[cfg(feature = "ink")]\nuse ink_storage::traits::PackedLayout;\n')

  lines.push('#[cfg(feature = "ink-std")]\nuse ink_storage::traits::StorageLayout;')
  lines.push('#[cfg(feature = "ink-std")]\nuse scale_info::TypeInfo;')

  genRsLines(defs, lines)

  fs.writeFileSync("../common/rs/src/codec_types.rs", lines.join("\n"))
  execSync("cd ../common/rs && cargo fmt -- src/codec_types.rs")
}

const rsDeriveStatement =
  '#[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]\n#[cfg_attr(feature = "ink", derive(PackedLayout, SpreadLayoutOneStorageCell))]\n#[cfg_attr(feature = "ink-std", derive(TypeInfo, StorageLayout))]'
const rsDeriveDefaultStatement =
  '#[derive(Default, PartialEq, Eq, PartialOrd, Ord, Clone, Hash, Debug, Encode, Decode)]\n#[cfg_attr(feature = "ink", derive(PackedLayout, SpreadLayoutOneStorageCell))]\n#[cfg_attr(feature = "ink-std", derive(TypeInfo, StorageLayout))]'

const genRsLines = (defs: AnyDef[], lines: string[]) => {
  for (const def of defs) {
    lines.push("")

    if (def.type === "mod") {
      lines.push(`pub mod ${def.name} {`)
      lines.push("use super::*;")
      genRsLines(def.params, lines)
      lines.push("}")
    }

    if (def.type === "struct") {
      lines.push(rsDeriveDefaultStatement)
      lines.push(
        `pub struct ${def.name} { ${Object.entries(def.params)
          .map(([k, v]) => `pub ${k}: ${v}`)
          .join(", ")} }`
      )
    }

    if (def.type === "tuple") {
      lines.push(rsDeriveDefaultStatement)
      lines.push(`pub struct ${def.name}(${def.params.map((p) => `pub ${p}`).join(", ")});`)
    }

    if (def.type === "enum") {
      lines.push(rsDeriveStatement)
      lines.push(`pub enum ${def.name} {`)
      for (const p of def.params) {
        const internalParams = p.params
        if (internalParams) {
          if (internalParams.type === "struct") {
            lines.push(
              `${p.name} { ${Object.entries(internalParams.params)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")} },`
            )
          }
          if (internalParams.type === "tuple") {
            lines.push(`${p.name} (${internalParams.params.join(", ")}),`)
          }
        } else {
          lines.push(`${p.name},`)
        }
      }
      lines.push("}")
      lines.push(`impl Default for ${def.name} {`)
      lines.push("fn default() -> Self {")
      const firstParam = def.params[0]
      const internalParams = firstParam.params
      if (internalParams) {
        if (internalParams.type === "struct") {
          const fields = Object.keys(internalParams.params)
            .map((k) => `${k}: Default::default()`)
            .join(", ")
          lines.push(`Self::${firstParam.name} { ${fields} }`)
        }
        if (internalParams.type === "tuple") {
          const fields = internalParams.params.map((_k) => "Default::default()").join(", ")
          lines.push(`Self::${firstParam.name} (${fields})`)
        }
      } else {
        lines.push(`Self::${firstParam.name}`)
      }
      lines.push("}")
      lines.push("}")
    }
  }
}

const writeTsFile = () => {
  const obj: any = {}

  genTsObj(defs, obj, [])

  // `JSON.stringify` does not guarantee object property order, you should check it by yourself...
  fs.writeFileSync(
    `../common/js/src/interfaces/all/_definitions.json`,
    `${JSON.stringify(obj, null, 2)}\n`
  )
}

const buildTsName = (name: string, mods: string[]) => [...mods, name].join("_")

const buildTsValue = (name: string) => {
  let n = name
  let prefix = ""
  let suffix = ""

  const vecMatch = name.match(/^Vec<(\w+)>$/)
  if (vecMatch) {
    prefix = "Vec<"
    suffix = ">"
    n = vecMatch[1]
  }
  const arrMatch = name.match(/^\[(\w+); (\d+)\]$/)
  if (arrMatch) {
    prefix = "["
    suffix = `; ${arrMatch[2]}]`
    n = arrMatch[1]
  }
  const btreeMatch = name.match(/^BTreeMap<(\w+), (\w+)>$/)
  if (btreeMatch) {
    prefix = `BTreeMap<${btreeMatch[1]}, `
    suffix = `>`
    n = btreeMatch[2]
  }
  const optMatch = name.match(/^Option<(\w+)>$/)
  if (optMatch) {
    prefix = "Option<"
    suffix = ">"
    n = optMatch[1]
  }
  const boxMatch = name.match(/^Box<(\w+)>$/)
  if (boxMatch) {
    prefix = "Box<"
    suffix = ">"
    n = boxMatch[1]
  }

  return `${prefix}${n.split("::").join("_")}${suffix}`
}

const buildTsStructParams = (params: { [key: string]: string }) => {
  const o: { [key: string]: string } = {}
  for (const [k, v] of Object.entries(params)) {
    o[k] = buildTsValue(v)
  }
  return o
}

const buildTsTupleParams = (params: string[]) =>
  `(${params.map((v) => buildTsValue(v)).join(", ")})`

const genTsObj = (defs: AnyDef[], obj: any, mods: string[]) => {
  for (const def of defs) {
    if (def.type === "mod") {
      genTsObj(def.params, obj, [...mods, def.name])
    }

    const name = buildTsName(def.name, mods)

    if (def.type === "struct") {
      obj[name] = buildTsStructParams(def.params)
    }

    if (def.type === "tuple") {
      obj[name] = buildTsTupleParams(def.params)
    }

    if (def.type === "enum") {
      const en: any = {}

      for (const p of def.params) {
        const internalDef = p.params
        if (internalDef) {
          if (internalDef.type === "struct") {
            const n = `${name}_${p.name}`
            en[p.name] = n
            obj[n] = buildTsStructParams(internalDef.params)
          }

          if (internalDef.type === "tuple") {
            en[p.name] = buildTsTupleParams(internalDef.params)
          }
        } else {
          en[p.name] = null
        }
      }

      obj[name] = { _enum: en }
    }
  }
}

main()
