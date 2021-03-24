import { emo_Base, emo_Bases } from "common"

export interface EmoBases {
  codec: emo_Bases
  stringKey: Map<string, emo_Base>
}

export interface PlayerAccount {
  address: string
  powCount: number
}

export interface SessionAccount {
  address: string
  mnemonic: string
  powCount: number
  isActive: boolean
}

export type Account = {
  player: PlayerAccount
  session: SessionAccount
}
