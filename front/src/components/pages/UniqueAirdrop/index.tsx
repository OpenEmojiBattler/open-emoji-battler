import * as React from "react"
import { ApiPromise, WsProvider } from "@polkadot/api"
import { stringToHex } from "@polkadot/util"
import { web3FromAddress } from "@polkadot/extension-dapp"
import { encodeAddress } from "@polkadot/util-crypto"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"

import { useBlockMessageSetter, useWaitingSetter } from "~/components/App/Frame/tasks"
import { withToggleAsync } from "~/misc/utils"
import { setupExtension } from "~/misc/accountUtils"

import { Loading } from "~/components/common/Loading"
import { Dropdown } from "~/components/common/Dropdown"

import AllClaimableSubstrateAddresses from "./targetAddresses.json"

const kusamaEndpoint =
  "wss://kusama.api.onfinality.io/ws?apikey=7d5a9e1e-713d-46b7-82e8-b01a4de661a2"
const endUnixtime = Date.UTC(2021, 5, 12)

interface InjectedAccountWithMetaExt extends InjectedAccountWithMeta {
  substrateAddress: string
}

export function UniqueAirdrop() {
  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Unique Airdrop</h1>
        <div className="block">
          If you had an NFT on Unique Network at the snapshot time, you might be able to claim a
          preEMO.
          <br />
          The snapshot was taken on May 25th, 06:00 am UTC (Unique TestNet 2.0 block #897185).
          <br />
          <br />
          To claim, you'll submit a remark (OEB::UNIQUEAIRDROP) transaction to Kusama using the same
          account as Unique.
          <br />
          The account needs a bit of KSM for the fee.
          <br />
          If you reload this page after the claim, the UI shows the claim button again, but you
          don't need to re-claim.
          <br />
          Multiple claims by one address are no effects. Sorry for the inconvenience!
          <br />
          <br />
          This airdrop will end on June 12th, 00:00 am UTC.
          <br />
          You can find the detail of the entire airdrop event here. TODO: subsocial link
        </div>
        <Accounts />
      </div>
    </section>
  )
}

function Accounts() {
  const [injectedAccounts, setInjectedAccounts] = React.useState<InjectedAccountWithMetaExt[]>([])
  const [message, setMessage] = React.useState("")
  const [selectedAccountIndex, setSelectedAccountIndex] = React.useState(0)
  const [claimableSubstrateAddresses, setClaimableSubstrateAddresses] = React.useState<string[]>([])

  React.useEffect(() => {
    setupExtension().then((ext) => {
      if (ext.kind === "ok") {
        const accountsExt = ext.injectedAccounts.map(
          (account): InjectedAccountWithMetaExt => ({
            ...account,
            substrateAddress: encodeAddress(account.address),
          })
        )
        setClaimableSubstrateAddresses(
          accountsExt
            .map((account) => account.substrateAddress)
            .filter((address) => AllClaimableSubstrateAddresses.includes(address))
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
          claimableSubstrateAddresses={claimableSubstrateAddresses}
          selectedAccountIndex={selectedAccountIndex}
          setSelectedAccountIndex={setSelectedAccountIndex}
        />
      </div>
      <div className="block">
        {claimableSubstrateAddresses.includes(selectedAccount.substrateAddress) ? (
          <Claim address={selectedAccount.address} />
        ) : (
          <span>This account is not qualified.</span>
        )}
      </div>
    </>
  )
}

function Claim(props: { address: string }) {
  const setWaiting = useWaitingSetter()
  const setBlockMessage = useBlockMessageSetter()
  const [isClaimed, setIsClaimed] = React.useState(false)

  React.useEffect(() => {
    setIsClaimed(false)
  }, [props.address])

  const onClick = async () =>
    withToggleAsync(setWaiting, async () => {
      await tx(props.address, setBlockMessage)
      setIsClaimed(true)
    })

  if (isClaimed) {
    const explorerUrl = `https://kusama.subscan.io/account/${encodeAddress(props.address, 2)}`
    return (
      <>
        You successfully claimed.
        <br />
        <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
          {explorerUrl}
        </a>
      </>
    )
  }

  return (
    <div style={{ marginTop: "16px" }}>
      <button className={"button is-strong"} onClick={onClick}>
        Claim
      </button>
    </div>
  )
}

function AccountsDropdown(props: {
  accounts: InjectedAccountWithMetaExt[]
  claimableSubstrateAddresses: string[]
  selectedAccountIndex: number
  setSelectedAccountIndex: (i: number) => void
}) {
  const items = props.accounts.map((account, i): [number, React.ReactNode] => {
    return [
      i,
      <span>
        {account.meta.name || ""} {account.address}{" "}
        {props.claimableSubstrateAddresses.includes(account.substrateAddress)
          ? "[QUALIFIED]"
          : "[not qualified]"}
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
        .remark(stringToHex("OEB::UNIQUEAIRDROP"))
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
