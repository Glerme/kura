import type { KuraLink } from './types'
import { getLinkByUrl, addLink } from './db'

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export async function importJSON(file: File): Promise<{ imported: number; skipped: number }> {
  const text = await readFileAsText(file)
  const data = JSON.parse(text)

  if (!Array.isArray(data)) {
    throw new Error('Invalid format: expected an array')
  }

  let imported = 0
  let skipped = 0

  for (const item of data) {
    if (!item.url || !item.title) {
      skipped++
      continue
    }

    const existing = await getLinkByUrl(item.url)
    if (existing) {
      skipped++
      continue
    }

    await addLink({
      url: item.url,
      title: item.title,
      tags: Array.isArray(item.tags) ? item.tags : [],
      comment: item.comment ?? undefined,
      favicon: item.favicon ?? undefined,
      readAt: item.readAt ?? undefined,
    })
    imported++
  }

  return { imported, skipped }
}

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
