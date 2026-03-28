import type { KuraLink } from './types'
import { getLinkByUrl as _getLinkByUrl, addLink as _addLink } from './db'

export function exportJSON(links: KuraLink[]): void {
  const json = JSON.stringify(links, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const date = new Date().toISOString().slice(0, 10)
  a.download = `kura-export-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}
