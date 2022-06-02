import { createElement } from "react"
import { createRoot } from "react-dom/client"

import "./index.sass"

import { App } from "./components/App"
import { setEmojiFavicon } from "./misc/favicon"

const con = document.getElementById("app-js-connector")
if (!con) throw new Error("Failed to find con")
createRoot(con).render(createElement(App))

setEmojiFavicon("👑")
