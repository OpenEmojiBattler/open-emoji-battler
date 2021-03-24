import BN from "bn.js"
import { web3FromAddress } from "@polkadot/extension-dapp"
import { mnemonicGenerate } from "@polkadot/util-crypto"

import { createType, query, tx, buildKeyringPair, mtc_Board } from "common"

import type { EmoBases, PlayerAccount, SessionAccount } from "~/misc/types"
import { isDevelopment, withToggleAsync, checkArraysEquality } from "~/misc/utils"
import { finishBattle, MtcState, buildInitialMtcState, ResultState } from "~/misc/mtcUtils"

export const buildAndGeneratePlayerAndSessionAccounts = async (playerAddress: string) => {
  const accountData = await query((q) => q.transactionPaymentPow.accountData(playerAddress))
  const playerPowCount = accountData.isSome ? accountData.unwrap()[1].toNumber() : 0
  const playerAccount: PlayerAccount = { address: playerAddress, powCount: playerPowCount }

  const sessionMnemonic = mnemonicGenerate()
  const sessionAccount: SessionAccount = {
    address: buildKeyringPair(sessionMnemonic).address,
    mnemonic: sessionMnemonic,
    powCount: 0,
    isActive: false,
  }

  return { player: playerAccount, session: sessionAccount }
}

export const start = (
  playerAccount: PlayerAccount,
  sessionAccount: SessionAccount,
  isStartBySession: boolean,
  solution: BN,
  deckEmoBaseIds: string[],
  setWaiting: (b: boolean) => void,
  previousEp: number
) =>
  withToggleAsync(setWaiting, async () => {
    const _deckEmoBaseIds = createType("Vec<u16>", deckEmoBaseIds)

    if (isStartBySession) {
      await tx(
        (t) => t.game.startMtcBySession(_deckEmoBaseIds),
        buildKeyringPair(sessionAccount.mnemonic),
        solution
      )
    } else {
      const signer = (await web3FromAddress(playerAccount.address)).signer

      await tx(
        (t) => t.game.startMtc(sessionAccount.address, _deckEmoBaseIds),
        { address: playerAccount.address, signer },
        solution
      )
    }

    const [seed, _pool, _ghosts] = await Promise.all([
      getSeed(playerAccount),
      query((q) => q.game.playerPool(playerAccount.address)),
      query((q) => q.game.playerGhosts(playerAccount.address)),
    ])

    const pool = _pool.unwrap()

    const ghosts = createType(
      "Vec<mtc_Ghost>",
      _ghosts.unwrap().map(([_a, _e, ghost]) => ghost)
    )
    const ghostAddressesAndEps = _ghosts.unwrap().map(([address, ep, _g]) => ({
      address: address.toString(),
      ep: ep.toNumber(),
    }))

    return buildInitialMtcState(previousEp, seed, pool, ghosts, ghostAddressesAndEps)
  })

export const getSeed = (playerAccount: PlayerAccount) =>
  query((q) => q.game.playerSeed(playerAccount.address)).then((s) => {
    if (s.isNone) {
      throw new Error("no seed")
    }
    return s.unwrap().toString()
  })

export const finishBattleAndBuildState = (
  playerAccount: PlayerAccount,
  mtcState: MtcState,
  emoBases: EmoBases
): { mtcState: MtcState; resultState: Promise<ResultState> | null } => {
  const s = finishBattle(mtcState, emoBases)

  const place = s.finalPlace
  if (place) {
    ensureFinished(playerAccount.address)
    return {
      mtcState: s.mtcState,
      resultState: query((q) => q.game.playerEp(playerAccount.address)).then((ep) => ({
        place,
        ep: ep.unwrap().toNumber(),
      })),
    }
  }

  ensureNoStateDiff(playerAccount.address, s.mtcState.health, mtcState.board)

  return { mtcState: s.mtcState, resultState: null }
}

const ensureFinished = (address: string) => {
  if (!isDevelopment) {
    return
  }

  query((q) => q.game.playerPool(address)).then((p) => {
    if (p.isSome) {
      throw new Error("looks like not finished")
    }
  })
}

const ensureNoStateDiff = (address: string, health: number, board: mtc_Board) => {
  if (!isDevelopment) {
    return
  }

  query((q) => q.game.playerHealth(address)).then((h) => {
    const subHealth = h.unwrap().toNumber()
    if (health !== subHealth) {
      throw new Error(`state diff found for health (front: ${health}, sub: ${subHealth})`)
    }
  })
  query((q) => q.game.playerGradeAndBoardHistory(address)).then((_subBoards) => {
    const subBoards = _subBoards.unwrap()
    const localIds = board.map((e) => e.mtc_emo_ids.map((i) => i.toString())).flat()
    const subIds = subBoards[subBoards.length - 1].board
      .map((e) => e.mtc_emo_ids.map((i) => i.toString()))
      .flat()
    if (!checkArraysEquality(localIds, subIds)) {
      throw new Error(
        `state diff found for board: local: ${localIds.join(",")}, sub: ${subIds.join(",")}`
      )
    }
  })
}
