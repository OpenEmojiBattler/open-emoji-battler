const setFavicon = (url: string) => {
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
  if (favicon) {
    favicon.href = url
  } else {
    const link = document.createElement("link")
    link.rel = "icon"
    link.href = url

    document.head.appendChild(link)
  }
}

export const setEmojiFavicon = (emoji: string) => {
  const canvas = document.createElement("canvas")
  canvas.height = 64
  canvas.width = 64

  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("unsupported browser")
  }

  context.font = "48px serif"
  context.fillText(emoji, 8, 48)

  const url = canvas.toDataURL()

  setFavicon(url)
}
