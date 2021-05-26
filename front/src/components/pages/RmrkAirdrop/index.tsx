import * as React from "react"
import { ApiPromise, WsProvider } from "@polkadot/api"
import { stringToHex } from "@polkadot/util"
import { web3FromAddress } from "@polkadot/extension-dapp"
import { encodeAddress } from "@polkadot/util-crypto"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"

import { useBlockMessageSetter, useWaitingSetter } from "~/components/App/Frame/tasks"
import { buildDateString, withToggleAsync } from "~/misc/utils"
import { setupExtension } from "~/misc/accountUtils"

import { Loading } from "~/components/common/Loading"
import { Dropdown } from "~/components/common/Dropdown"

import AllClaimableKusamaAddresses from "./targetAddresses.json"

const kusamaEndpoint =
  "wss://kusama.api.onfinality.io/ws?apikey=7d5a9e1e-713d-46b7-82e8-b01a4de661a2"
const endUnixtime = Date.UTC(2021, 4, 31) // TODO
const endDate = new Date(endUnixtime)

interface InjectedAccountWithMetaExt extends InjectedAccountWithMeta {
  kusamaAddress: string
}

export function RmrkAirdrop() {
  return (
    <section className="section">
      <div className="container">
        <h1 className="title">RMRK Airdrop</h1>
        <div className="block">TODO: desc and link, time: {buildDateString(endDate)}</div>
        <Accounts />
      </div>
    </section>
  )
}

function Accounts() {
  const [injectedAccounts, setInjectedAccounts] = React.useState<InjectedAccountWithMetaExt[]>([])
  const [message, setMessage] = React.useState("")
  const [selectedAccountIndex, setSelectedAccountIndex] = React.useState(0)
  const [claimableKusamaAddresses, setClaimableKusamaAddresses] = React.useState<string[]>([])

  React.useEffect(() => {
    setupExtension().then((ext) => {
      if (ext.kind === "ok") {
        const accountsExt = ext.injectedAccounts.map((account) => ({
          ...account,
          kusamaAddress: encodeAddress(account.address, 2),
        }))
        setClaimableKusamaAddresses(
          accountsExt
            .map((account) => account.kusamaAddress)
            .filter((address) => AllClaimableKusamaAddresses.includes(address))
        )
        setInjectedAccounts(accountsExt)
      } else {
        setMessage(ext.message)
      }
    })
  }, [])

  if (message !== "") {
    return <p>{message}</p>
  }

  if (injectedAccounts.length === 0) {
    return <Loading />
  }

  if (Date.now() >= endUnixtime) {
    return <div>This airdrop is finished.</div>
  }

  const selectedAccount = injectedAccounts[selectedAccountIndex]

  return (
    <>
      <h2 className="subtitle">Select Account</h2>
      <div className="block">
        <AccountsDropdown
          accounts={injectedAccounts}
          claimableKusamaAddresses={claimableKusamaAddresses}
          selectedAccountIndex={selectedAccountIndex}
          setSelectedAccountIndex={setSelectedAccountIndex}
        />
      </div>
      <div className="block">
        {claimableKusamaAddresses.includes(selectedAccount.kusamaAddress) ? (
          <Claim address={selectedAccount.address} />
        ) : (
          <span>not claimable</span>
        )}
      </div>
    </>
  )
}

function Claim(props: { address: string }) {
  const setWaiting = useWaitingSetter()
  const setBlockMessage = useBlockMessageSetter()
  const [isClaimed, setIsClaimed] = React.useState(false)

  const onClick = async () =>
    withToggleAsync(setWaiting, async () => {
      await tx(props.address, setBlockMessage)
      setIsClaimed(true)
    })

  if (isClaimed) {
    return <>You successfully claimed.</>
  }

  return (
    <>
      <p>Kusama address format: {encodeAddress(props.address, 2)}</p>
      <div style={{ marginTop: "16px" }}>
        <button className={"button is-strong"} onClick={onClick}>
          Claim
        </button>
      </div>
    </>
  )
}

function AccountsDropdown(props: {
  accounts: InjectedAccountWithMetaExt[]
  claimableKusamaAddresses: string[]
  selectedAccountIndex: number
  setSelectedAccountIndex: (i: number) => void
}) {
  const items = props.accounts.map((account, i): [number, React.ReactNode] => {
    return [
      i,
      <span>
        {account.meta.name || ""} {account.address}{" "}
        {props.claimableKusamaAddresses.includes(account.kusamaAddress)
          ? "claimable"
          : "not claimable"}
      </span>,
    ]
  })

  const on = (index: number) => {
    if (index === props.selectedAccountIndex) {
      return
    }
    props.setSelectedAccountIndex(index)
  }

  return (
    <Dropdown
      items={items}
      selectedItemId={props.selectedAccountIndex}
      onItemSelection={on}
      isUp={false}
      height={null}
    />
  )
}

const tx = async (address: string, setErrorMessage: (s: string) => void) => {
  const signer = (await web3FromAddress(address)).signer

  const apiPromise = await ApiPromise.create({
    provider: new WsProvider(kusamaEndpoint),
  })

  // https://polkadot.js.org/docs/api/cookbook/tx#how-do-i-get-the-decoded-enum-for-an-extrinsicfailed-event
  await new Promise<void>(async (resolve, reject) => {
    try {
      await apiPromise.tx.system
        .remark(stringToHex("OEB::RMRKAIRDROP"))
        .signAndSend(address, { signer }, ({ status, dispatchError }) => {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = apiPromise.registry.findMetaError(dispatchError.asModule)
              const { documentation, name, section } = decoded

              reject(`${section}.${name}: ${documentation.join(" ")}`)
            } else {
              reject(dispatchError.toString())
            }
          }
          if (status.isInBlock || status.isFinalized) {
            resolve()
          }
        })
    } catch (e) {
      reject(e)
    }
  })
    .catch((reason) => {
      setErrorMessage(`Error: ${reason}`)
    })
    .finally(() => apiPromise.disconnect())
}
