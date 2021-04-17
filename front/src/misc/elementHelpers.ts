export const getFirstDivByClass = (element: HTMLDivElement, className: string) => {
  const e = element.getElementsByClassName(className)[0]
  if (e && e.tagName === "DIV") {
    return e as HTMLDivElement
  }
  throw new Error(`getFirstDivByClass: not found div: ${className}`)
}

export const getFirstSpanByClass = (element: HTMLDivElement, className: string) => {
  const e = element.getElementsByClassName(className)[0]
  if (e && e.tagName === "SPAN") {
    return e as HTMLSpanElement
  }
  throw new Error(`getFirstSpanByClass: not found span: ${className}`)
}

export const getFirstDivChildElement = (e: HTMLElement) => {
  const first = e.children[0]
  if (!first) {
    throw new Error("first child not found")
  }
  if (first.tagName !== "DIV") {
    throw new Error("first child is not div")
  }
  return first as HTMLDivElement
}

export const removeAllChildren = (e: HTMLElement) => {
  while (e.firstChild) {
    e.removeChild(e.firstChild)
  }
}

export const insertElementByIndex = (
  parentElement: HTMLElement,
  childElement: HTMLElement,
  index: number
) => {
  if (parentElement.children.length <= index) {
    parentElement.appendChild(childElement)
  } else {
    parentElement.insertBefore(childElement, parentElement.children[index])
  }
}

export const getChildDivByIndex = (element: HTMLDivElement, index: number) => {
  const e = element.children[index]
  if (e && e.tagName === "DIV") {
    return e as HTMLDivElement
  }
  throw new Error(`not found div: ${index}`)
}

// not accurate, see https://github.com/microsoft/TypeScript/issues/26073
type Keyframes = {
  [P in keyof CSSStyleDeclaration]?: string | string[]
}
export const animateIndefinitely = (
  element: HTMLElement,
  keyframes: Keyframes,
  options: KeyframeAnimationOptions
) =>
  element.animate(keyframes, options).finished.then(() => {
    for (const [k, v] of Object.entries(keyframes)) {
      if (v) {
        element.style[k as any] = (Array.isArray(v) ? v[v.length - 1] : v) as any
      }
    }
  })
