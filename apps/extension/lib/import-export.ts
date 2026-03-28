import type { KuraLink } from './types'
import { getLinkByUrl, addLink } from './db'
import { isSafeUrl } from './url-utils'

const MAX_LEN = 2048

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
    const url = typeof item.url === 'string' ? item.url.trim().slice(0, MAX_LEN) : null
    const title = typeof item.title === 'string' ? item.title.trim().slice(0, 500) : null
    if (!url || !title || !isSafeUrl(url)) {
      skipped++
      continue
    }

    const existing = await getLinkByUrl(url)
    if (existing) {
      skipped++
      continue
    }

    await addLink({
      url,
      title,
      tags: Array.isArray(item.tags)
        ? item.tags.filter((t: unknown): t is string => typeof t === 'string').map((t: string) => t.slice(0, 100))
        : [],
      comment: typeof item.comment === 'string' ? item.comment.slice(0, 2000) : undefined,
      favicon: typeof item.favicon === 'string' ? item.favicon.slice(0, MAX_LEN) : undefined,
      readAt: typeof item.readAt === 'number' ? item.readAt : undefined,
    })
    imported++
  }

  return { imported, skipped }
}

export async function importBookmarksHTML(file: File): Promise<{ imported: number; skipped: number }> {
  const text = await readFileAsText(file)
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/html')

  let imported = 0
  let skipped = 0

  const anchors = doc.querySelectorAll('a[href]')

  for (const a of anchors) {
    const url = a.getAttribute('href')
    const title = a.textContent?.trim()
    if (!url || !title || !isSafeUrl(url)) {
      skipped++
      continue
    }

    // Find parent folder: walk up to find the closest <DL> parent, then its preceding <DT><H3>
    const tags: string[] = []
    const parentDl = a.closest('dl')
    if (parentDl) {
      const dt = parentDl.parentElement
      if (dt) {
        const h3 = dt.querySelector(':scope > h3')
        if (h3?.textContent) {
          tags.push(h3.textContent.trim())
        }
      }
    }

    const existing = await getLinkByUrl(url)
    if (existing) {
      skipped++
      continue
    }

    await addLink({
      url,
      title,
      tags,
      readAt: undefined,
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
