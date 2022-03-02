import * as React from "react"

export function ExternalLink(props: { href: string; children: React.ReactNode }) {
  return (
    <a href={props.href} target="_blank" rel="noopener noreferrer">
      {props.children}
    </a>
  )
}
