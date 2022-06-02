import { createElement } from "react"
import { render } from "react-dom"

import "./index.sass"

import { App } from "./components/App"
import { setEmojiFavicon } from "./misc/favicon"

render(createElement(App), document.getElementById("app-js-connector"))

setEmojiFavicon("👑")
