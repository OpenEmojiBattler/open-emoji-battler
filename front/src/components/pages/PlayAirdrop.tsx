import * as React from "react"
import BN from "bn.js"
import { checkAddress, encodeAddress } from "@polkadot/util-crypto"
import { web3FromAddress } from "@polkadot/extension-dapp"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"

import { query, tx } from "common"

import {
  AccountContext,
  GlobalAsyncContext,
  useAccountSetter,
  useWaitingSetter,
} from "~/components/App/Frame/tasks"
import { setupAccounts } from "~/misc/accountUtils"
import { buildDateString, withToggleAsync } from "~/misc/utils"
import type { Account } from "~/misc/types"

import { Loading } from "~/components/common/Loading"
import { AccountsDropdown } from "~/components/common/AccountsDropdown"
import { PowButton } from "~/components/common/PowButton"

const airdropMaxCount = 500
const endUnixtime = Date.UTC(2021, 5, 12)
const endDate = new Date(endUnixtime)

export function PlayAirdrop() {
  const globalAsync = React.useContext(GlobalAsyncContext)

  if (!globalAsync) {
    return <Loading />
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Gameplay Airdrop</h1>
        <Connected />
      </div>
    </section>
  )
}

function Connected() {
  const [airdroppedCount, setAirdroppedCount] = React.useState<number | null>(null)

  React.useEffect(() => {
    let isMounted = true

    query((q) => q.firstAirdrop.playerAirdropDestinationKusamaAccountIdCount()).then((countOpt) => {
      if (isMounted) {
        setAirdroppedCount(countOpt.isSome ? countOpt.unwrap().toNumber() : 0)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <>
      <div className="block">
        You can claim a preEMO after playing the game and getting 3rd place or higher in a 4 player
        match.
        <br />
        The claim transaction will be submitted on the Open Emoji Battler chain, so the fee is not
        required.
        <br />
        Players who already played the game before also need to complete this to be qualified.
        <br />
        You need to input your Kusama address, and the preEMO will go to the address.
        <br />
        <br />
        This airdrop will ends on {buildDateString(endDate)}.
        <br />
        You can find the detail of the entire airdrop event here. TODO: subsocial link
        <br />
        <br />
        <strong>
          {airdroppedCount === null
            ? "Loading"
            : `${airdropMaxCount - airdroppedCount} of ${airdropMaxCount} Remaining`}
        </strong>
      </div>
      {airdroppedCount === null ? <></> : <Accounts airdroppedCount={airdroppedCount} />}
    </>
  )
}

function Accounts(props: { airdroppedCount: number }) {
  const account = React.useContext(AccountContext)
  const setAccount = useAccountSetter()

  const [injectedAccounts, setInjectedAccounts] = React.useState<InjectedAccountWithMeta[]>([])
  const [message, setMessage] = React.useState("")

  React.useEffect(() => {
    setupAccounts(account).then((accounts) => {
      if (accounts.kind === "ok") {
        setAccount(accounts.account)
        setInjectedAccounts(accounts.injectedAccounts)
      } else {
        setMessage(accounts.message)
      }
    })
  }, [])

  if (message !== "") {
    return <p>{message}</p>
  }

  if (injectedAccounts.length === 0 || account === null) {
    return <Loading />
  }

  return (
    <>
      <h2 className="subtitle">Select Account</h2>
      <div className="block">
        <AccountsDropdown accounts={injectedAccounts} playerAddress={account.player.address} />
      </div>
      <div className="block">
        <AccountComp account={account} airdroppedCount={props.airdroppedCount} />
      </div>
    </>
  )
}

function AccountComp(props: { account: Account; airdroppedCount: number }) {
  const [claimedKusamaAddress, setClaimedKusamaAddress] = React.useState<string | null>(null)
  const [isEligible, setIsEligible] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    let isMounted = true

    Promise.all([
      query((q) =>
        q.firstAirdrop.playerAirdropDestinationKusamaAccountId(props.account.player.address)
      ),
      query((q) => q.game.playerFirstAirdropEligible(props.account.player.address)),
    ]).then(([claimedAccountOpt, isEligibleOpt]) => {
      if (!isMounted) {
        return
      }
      if (claimedAccountOpt.isSome) {
        const kusamaAddress = encodeAddress(claimedAccountOpt.unwrap(), 2)
        setClaimedKusamaAddress(kusamaAddress)
      } else {
        setClaimedKusamaAddress(null)
      }
      setIsEligible(isEligibleOpt.isSome ? isEligibleOpt.unwrap().isTrue : false)
    })

    return () => {
      isMounted = false
    }
  }, [props.account.player.address])

  if (isEligible === null) {
    return <Loading />
  }

  if (claimedKusamaAddress) {
    return <span>You've already claimed.</span>
  }
  if (props.airdroppedCount >= airdropMaxCount || Date.now() >= endUnixtime) {
    return <span>This airdrop is finished.</span>
  }
  if (isEligible) {
    return <Claim account={props.account} />
  }
  return <span>This account is not qualified.</span>
}

function Claim(props: { account: Account }) {
  const setWaiting = useWaitingSetter()
  const [kusamaAddress, setKusamaAddress] = React.useState("")
  const [isValidKusamaAddress, setIsValidKusamaAddress] = React.useState(false)
  const [isClaimed, setIsClaimed] = React.useState(false)

  const onInputKusamaAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setKusamaAddress(v)
    const [isValid, reason] = checkAddress(v, 2)
    if (reason) {
      console.log(reason)
    }
    setIsValidKusamaAddress(isValid)
  }

  const onClick = async (solution: BN) =>
    withToggleAsync(setWaiting, async () => {
      const signer = (await web3FromAddress(props.account.player.address)).signer
      await tx(
        (t) => t.firstAirdrop.claim(kusamaAddress),
        { address: props.account.player.address, signer },
        solution
      )
      setIsClaimed(true)
    })

  if (isClaimed) {
    return <>You successfully claimed.</>
  }

  return (
    <>
      You can claim a preEMO.
      <br />
      <input
        type="text"
        value={kusamaAddress}
        onChange={onInputKusamaAddressChange}
        size={60}
        placeholder="Enter Kusama Address"
      />
      <br />
      {kusamaAddress !== "" && !isValidKusamaAddress ? (
        <span>Invalid Kusama address format</span>
      ) : (
        <div style={{ marginTop: "16px" }}>
          <PowButton
            account={props.account.player}
            onClick={onClick}
            disabled={kusamaAddress === ""}
          >
            Claim
          </PowButton>
        </div>
      )}
    </>
  )
}
