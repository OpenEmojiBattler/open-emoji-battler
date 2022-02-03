import * as React from "react"

import { Codec } from "@polkadot/types/types"
import { Enum, Struct, Option, Vec, UInt, bool } from "@polkadot/types"
import { getTypeDef } from "@polkadot/types/create"
import { TypeDef, TypeDefInfo } from "@polkadot/types/create/types"

import { createType } from "common"

import { Dropdown } from "../common/Dropdown"

export function EmoAbilityBuilder() {
  return (
    <section className="section">
      <div className={"container"}>
        <Ability />
      </div>
    </section>
  )
}

type BuildFn = (c: Codec) => void

// const config = { type: "emo_ability_Ability", name: "Ability" } as const
const config = { type: "Vec<emo_ability_Ability>", name: "Abilities" } as const

function Ability() {
  const [ability, setAbility] = React.useState(createType(config.type))
  const tRef = React.useRef<HTMLTextAreaElement>(null)

  const build: BuildFn = (c) => setAbility(createType(config.type, c))

  return (
    <div className={"content"} style={{ display: "flex" }}>
      <div style={{ width: "70%" }}>
        <TypeDefComp codec={ability} build={build} name={config.name} />
      </div>
      <div style={{ width: "30%" }}>
        <button
          className="button"
          onClick={() => {
            tRef.current!.select()
            document.execCommand("copy")
          }}
        >
          Copy to Clipboard
        </button>
        <div>{config.type}</div>
        <textarea
          ref={tRef}
          style={{ overflow: "scroll", width: "100%", height: "300px" }}
          readOnly={true}
          value={JSON.stringify(ability.toJSON(), null, 2)}
        />
      </div>
    </div>
  )
}

const boxStyle: React.CSSProperties = { border: "1px solid #444", margin: "10px", padding: "10px" }

function TypeDefComp(props: { codec: Codec; build: BuildFn; name?: string }) {
  const typeDef = getTypeDefFromCodec(props.codec)

  let e

  switch (typeDef.info) {
    case TypeDefInfo.Enum:
      e = <EnumComp enum={props.codec as Enum} build={props.build} name={props.name} />
      break
    case TypeDefInfo.Struct:
      e = <StructComp struct={props.codec as Struct} build={props.build} name={props.name} />
      break
    case TypeDefInfo.Option:
      e = <OptionComp option={props.codec as Option<any>} build={props.build} name={props.name} />
      break
    case TypeDefInfo.Vec:
      e = <VecComp vec={props.codec as Vec<any>} build={props.build} name={props.name} />
      break
    case TypeDefInfo.Plain:
      switch (typeDef.type) {
        case "u8":
        case "u16":
          e = <UIntComp uint={props.codec as UInt} build={props.build} name={props.name} />
          break
        case "bool":
          e = <BoolComp bool={props.codec as bool} build={props.build} name={props.name} />
          break
      }
      break
  }

  if (e) {
    return <div style={boxStyle}>{e}</div>
  }

  throw new Error(`undefined typeDef: ${typeDef.info}`)
}

function EnumComp(props: { enum: Enum; build: BuildFn; name?: string }) {
  const typeDef = getTypeDefFromCodec(props.enum)

  const subs = typeDef.sub as TypeDef[]

  const items = subs.map((t): [string, React.ReactNode] => {
    return [`${t.name}`, <>{t.name}</>]
  })

  const build: BuildFn = (c) => {
    props.build(createType(typeDef.type, { [`${props.enum.type}`]: c }))
  }

  return (
    <>
      {props.name ? <div>{props.name}</div> : <></>}
      <Dropdown
        items={items}
        selectedItemId={props.enum.type}
        onItemSelection={(n) => {
          const s = subs.find((s) => s.name === n)
          if (!s) {
            throw new Error("invalid state, s is undefined")
          }
          props.build(createType(typeDef.type, s.name))
        }}
        isUp={false}
        height={null}
      />
      {props.enum.isNone ? <></> : <TypeDefComp codec={props.enum.value} build={build} />}
    </>
  )
}

function StructComp(props: { struct: Struct; build: BuildFn; name?: string }) {
  const typeDef = getTypeDefFromCodec(props.struct)

  const buildWrapper =
    (key: string): BuildFn =>
    (codec) => {
      const newValue = new Map(props.struct)
      newValue.set(key, codec)
      const t = createType(typeDef.type, newValue)
      props.build(t)
    }

  return (
    <>
      {props.name ? <div>{props.name}</div> : <></>}
      {props.struct.defKeys.map((key) => {
        const v = props.struct.get(key)
        if (!v) {
          throw new Error(`invalid state: ${key}`)
        }
        return (
          <div key={key}>
            <TypeDefComp codec={v} build={buildWrapper(key)} name={key} />
          </div>
        )
      })}
    </>
  )
}

function OptionComp<T extends Codec>(props: { option: Option<T>; build: BuildFn; name?: string }) {
  const typeDef = getTypeDefFromCodec(props.option)

  const subType = (typeDef.sub as TypeDef).type

  const build: BuildFn = (c) => {
    const newValue = createType(typeDef.type, c)
    props.build(newValue)
  }

  return (
    <div>
      {props.name ? <>{props.name} </> : <></>}
      <input
        type={"checkbox"}
        checked={props.option.isSome}
        onChange={(e) => {
          const newValue = createType(typeDef.type, e.target.checked ? createType(subType) : null)
          props.build(newValue)
        }}
      />
      {props.option.isSome ? <TypeDefComp codec={props.option.unwrap()} build={build} /> : <></>}
    </div>
  )
}

function VecComp<T extends Codec>(props: { vec: Vec<T>; build: BuildFn; name?: string }) {
  const typeDef = getTypeDefFromCodec(props.vec)

  const subType = (typeDef.sub as TypeDef).type

  const update = (arr: Codec[]) => {
    const newValue = createType(typeDef.type, arr)
    props.build(newValue)
  }

  const buildWrapper =
    (i: number): BuildFn =>
    (c) => {
      const arr = props.vec.toArray()
      arr[i] = c as T
      update(arr)
    }

  return (
    <>
      {props.name ? <div>{props.name}</div> : <></>}
      {props.vec.toArray().map((v, i) => (
        <div key={`${i}`} style={boxStyle}>
          <TypeDefComp codec={v} build={buildWrapper(i)} />
          <button
            className={"button is-small"}
            onClick={() => {
              const arr = props.vec.toArray()
              arr.splice(i, 1)
              update(arr)
            }}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        className={"button"}
        onClick={() => {
          update([...props.vec.toArray(), createType(subType)])
        }}
      >
        Add
      </button>
    </>
  )
}

function UIntComp(props: { uint: UInt; build: BuildFn; name?: string }) {
  const typeDef = getTypeDefFromCodec(props.uint)
  return (
    <span>
      {props.name ? `${props.name} (${typeDef.type})` : typeDef.type}{" "}
      <input
        type={"number"}
        value={props.uint.toString()}
        onChange={(e) => props.build(createType(typeDef.type, e.target.value))}
      />
    </span>
  )
}

function BoolComp(props: { bool: bool; build: BuildFn; name?: string }) {
  const typeDef = getTypeDefFromCodec(props.bool)
  return (
    <span>
      {props.name ? `${props.name} (${typeDef.type})` : typeDef.type}{" "}
      <input
        type={"checkbox"}
        checked={props.bool.isTrue}
        onChange={(e) => props.build(createType(typeDef.type, e.target.checked))}
      />
    </span>
  )
}

const getTypeDefFromCodec = (c: Codec) => getTypeDef(c.toRawType())
