import { solvePowByBytes } from "common"

declare var self: Worker

self.onerror = (evt) => {
  self.postMessage({
    type: "error",
    message: JSON.stringify(evt),
  })
}

self.onmessage = async (evt) => {
  const data = evt.data

  try {
    if (data.type === "start") {
      const solution = await solvePowByBytes(data.wasmBytes, data.publicKey, data.count)

      self.postMessage({
        type: "done",
        solution,
      })
    }
  } catch (e) {
    setTimeout(() => {
      throw e
    })
  }
}
