import type { EmoBases } from "~/misc/types"
import { getDefaultDeck } from "~/misc/mtcUtils"

const customDecksStoragePrefix = "mtcSetupCustomDecksV1:"
const selectedDeckIndexStoragePrefix = "mtcSetupSelectedDeckIndexV1:"

const getCustomDecksStorageKey = (address: string) => `${customDecksStoragePrefix}:${address}`
const getSelectedDeckIndexStorageKey = (address: string) =>
  `${selectedDeckIndexStoragePrefix}:${address}`

export const getDecks = (address: string, emoBases: EmoBases, builtEmoBaseIds: string[]) => {
  const defaultDeck = getDefaultDeck(emoBases, builtEmoBaseIds)
  let decks = [defaultDeck]
  let selectedDeckIndex = 0

  const customDecksStr = localStorage.getItem(getCustomDecksStorageKey(address))
  if (customDecksStr) {
    decks.push(...JSON.parse(customDecksStr))

    const selectedDeckIndexStr = localStorage.getItem(getSelectedDeckIndexStorageKey(address))
    if (selectedDeckIndexStr) {
      const index = JSON.parse(selectedDeckIndexStr)
      if (index < decks.length) {
        selectedDeckIndex = index
      }
    }
  }

  return { decks, selectedDeckIndex }
}

export const deleteDeck = (address: string, deckIndex: number) => {
  if (deckIndex === 0) {
    throw new Error("cannot delete default deck")
  }
  const key = getCustomDecksStorageKey(address)
  const decks = JSON.parse(localStorage.getItem(key) || "[]")
  decks.splice(deckIndex - 1, 1)
  localStorage.setItem(key, JSON.stringify(decks))
  localStorage.removeItem(getSelectedDeckIndexStorageKey(address))
}

export const addDeck = (
  address: string,
  deck: string[],
  emoBases: EmoBases,
  builtEmoBaseIds: string[]
) => {
  const defaultDeck = getDefaultDeck(emoBases, builtEmoBaseIds)

  const key = getCustomDecksStorageKey(address)
  const decks = JSON.parse(localStorage.getItem(key) || "[]")
  const decksWithDefault = [defaultDeck].concat(decks)
  const isDup = decksWithDefault.some((_deck) => _deck.every((id, i) => id === deck[i]))
  if (!isDup) {
    decks.push(deck)
    localStorage.setItem(key, JSON.stringify(decks))
  }
}

export const selectDeckIndex = (
  address: string,
  deckIndex: number,
  emoBases: EmoBases,
  builtEmoBaseIds: string[]
) => {
  if (getDecks(address, emoBases, builtEmoBaseIds).decks.length <= deckIndex) {
    throw new Error("invalid deckIndex")
  }
  localStorage.setItem(getSelectedDeckIndexStorageKey(address), JSON.stringify(deckIndex))
}
