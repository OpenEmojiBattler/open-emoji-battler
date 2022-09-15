export const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export const groupBy = <K, V>(
  array: readonly V[],
  getKey: (cur: V, idx: number, src: readonly V[]) => K
): [K, V[]][] =>
  Array.from(
    array.reduce((map, cur, idx, src) => {
      const key = getKey(cur, idx, src)
      const list = map.get(key)
      if (list) list.push(cur)
      else map.set(key, [cur])
      return map
    }, new Map<K, V[]>())
  )

export const checkArraysEquality = <T>(a: T[], b: T[]) => {
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export const moveArrayElement = <T>(array: T[], from: number, to: number) =>
  array.splice(to, 0, array.splice(from, 1)[0])

export const withToggleAsync = async <T>(toggle: (b: boolean) => void, main: () => Promise<T>) => {
  toggle(true)
  const result = await main()
  toggle(false)
  return result
}

export const buildDateString = (date: Date) =>
  `${date.toLocaleString([], { timeZoneName: "long" })} (${date.toUTCString()})`
