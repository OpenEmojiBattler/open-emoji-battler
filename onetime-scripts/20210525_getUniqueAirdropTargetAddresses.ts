import { writeFileSync } from "fs"
import { ApiPromise, WsProvider } from "@polkadot/api"
import { encodeAddress } from "@polkadot/util-crypto"

const blockHash = "0x1b02a5e276414fdd035dabc352892f644dda9c0f8090d33916f1dcaca2615eac"

const main = async () => {
  const provider = new WsProvider("wss://testnet2.uniquenetwork.io")
  const api = await ApiPromise.create({ provider, types })

  console.log(`now: ${Date.now()}, blockHash: ${blockHash}`)
  const entries = await api.query.nft.accountItemCount.entriesAt(blockHash)
  const data = entries.map(([key, value]) => [key.args[0].toString(), (value as any).toNumber()])
  console.log(`full data len: ${data.length}`)

  writeFileSync("./20210525_getUniqueAirdropTargetAddresses.rawData.json", JSON.stringify(data))
  const filteredData = data.filter(([_addr, n]) => n > 0)
  const addresses = filteredData.map(([addr, _n]) => addr)
  console.log(`filtered addresses len: ${addresses.length}`)

  const addressesForCheck = addresses.map((a) => encodeAddress(a))
  if (!checkArraysEquality(addresses, addressesForCheck)) {
    console.error("invalid address format")
    return
  }

  addresses.sort()
  writeFileSync(
    "./20210525_getUniqueAirdropTargetAddresses.addresses.json",
    JSON.stringify(addresses, null, 2)
  )
}

const checkArraysEquality = <T>(a: T[], b: T[]) => {
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      console.error(`diff: ${a[i]}, ${b[i]}`)
      return false
    }
  }
  return true
}

// https://github.com/polkadot-js/apps/blob/410a5afcaaea23eb61d94e07c11269137da731fe/packages/apps-config/src/api/spec/unique.ts
const types = {
  AccessMode: {
    _enum: ["Normal", "WhiteList"],
  },
  DecimalPoints: "u8",
  CollectionMode: {
    _enum: {
      Invalid: null,
      NFT: null,
      Fungible: "DecimalPoints",
      ReFungible: null,
    },
  },
  Ownership: {
    Owner: "AccountId",
    Fraction: "u128",
  },
  FungibleItemType: {
    Value: "u128",
  },
  NftItemType: {
    Owner: "AccountId",
    ConstData: "Vec<u8>",
    VariableData: "Vec<u8>",
  },
  ReFungibleItemType: {
    Owner: "Vec<Ownership<AccountId>>",
    ConstData: "Vec<u8>",
    VariableData: "Vec<u8>",
  },
  Collection: {
    Owner: "AccountId",
    Mode: "CollectionMode",
    Access: "AccessMode",
    DecimalPoints: "DecimalPoints",
    Name: "Vec<u16>",
    Description: "Vec<u16>",
    TokenPrefix: "Vec<u8>",
    MintMode: "bool",
    OffchainSchema: "Vec<u8>",
    SchemaVersion: "SchemaVersion",
    Sponsor: "AccountId",
    SponsorConfirmed: "bool",
    Limits: "CollectionLimits",
    VariableOnChainSchema: "Vec<u8>",
    ConstOnChainSchema: "Vec<u8>",
  },
  RawData: "Vec<u8>",
  Address: "AccountId",
  LookupSource: "AccountId",
  Weight: "u64",
  CreateNftData: {
    const_data: "Vec<u8>",
    variable_data: "Vec<u8>",
  },
  CreateFungibleData: {
    value: "u128",
  },
  CreateReFungibleData: {
    const_data: "Vec<u8>",
    variable_data: "Vec<u8>",
    pieces: "u128",
  },
  CreateItemData: {
    _enum: {
      NFT: "CreateNftData",
      Fungible: "CreateFungibleData",
      ReFungible: "CreateReFungibleData",
    },
  },
  SchemaVersion: {
    _enum: ["ImageURL", "Unique"],
  },
  CollectionId: "u32",
  TokenId: "u32",
  ChainLimits: {
    CollectionNumbersLimit: "u32",
    AccountTokenOwnershipLimit: "u32",
    CollectionAdminsLimit: "u64",
    CustomDataLimit: "u32",
    NftSponsorTimeout: "u32",
    FungibleSponsorTimeout: "u32",
    RefungibleSponsorTimeout: "u32",
    OffchainSchemaLimit: "u32",
    VariableOnChainSchemaLimit: "u32",
    ConstOnChainSchemaLimit: "u32",
  },
  CollectionLimits: {
    AccountTokenOwnershipLimit: "u32",
    SponsoredDataSize: "u32",
    SponsoredDataRateLimit: "Option<BlockNumber>",
    TokenLimit: "u32",
    SponsorTimeout: "u32",
    OwnerCanTransfer: "bool",
    OwnerCanDestroy: "bool",
  },
}

main().catch(console.error).finally(process.exit)
