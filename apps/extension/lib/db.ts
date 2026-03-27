import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { KuraLink } from './types'

interface KuraDB extends DBSchema {
  links: {
    key: string
    value: KuraLink
    indexes: {
      'by-savedAt': number
      'by-tags': string
      'by-readAt': number
    }
  }
}

let _db: Promise<IDBPDatabase<KuraDB>> | null = null

function getDB(): Promise<IDBPDatabase<KuraDB>> {
  if (!_db) {
    _db = openDB<KuraDB>('kura', 1, {
      upgrade(db) {
        const store = db.createObjectStore('links', { keyPath: 'id' })
        store.createIndex('by-savedAt', 'savedAt')
        store.createIndex('by-tags', 'tags', { multiEntry: true })
        store.createIndex('by-readAt', 'readAt')
      },
    })
  }
  return _db
}

export async function addLink(
  data: Omit<KuraLink, 'id' | 'savedAt'>
): Promise<KuraLink> {
  const db = await getDB()
  const link: KuraLink = { ...data, id: crypto.randomUUID(), savedAt: Date.now() }
  await db.add('links', link)
  return link
}

export async function getAllLinks(): Promise<KuraLink[]> {
  const db = await getDB()
  const links = await db.getAllFromIndex('links', 'by-savedAt')
  return links.sort((a, b) => b.savedAt - a.savedAt)
}

export async function getRecent(limit: number): Promise<KuraLink[]> {
  return (await getAllLinks()).slice(0, limit)
}

export async function updateLink(
  id: string,
  data: Partial<Omit<KuraLink, 'id' | 'savedAt'>>
): Promise<void> {
  const db = await getDB()
  const existing = await db.get('links', id)
  if (!existing) return
  await db.put('links', { ...existing, ...data })
}

export async function deleteLink(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('links', id)
}

export async function searchLinks(query: string): Promise<KuraLink[]> {
  const all = await getAllLinks()
  const q = query.toLowerCase()
  return all.filter(l =>
    l.title.toLowerCase().includes(q) ||
    l.tags.some(t => t.toLowerCase().includes(q)) ||
    (l.comment?.toLowerCase().includes(q) ?? false)
  )
}

export async function getAllTags(): Promise<string[]> {
  const all = await getAllLinks()
  const tags = new Set(all.flatMap(l => l.tags))
  return [...tags].sort()
}

export async function getTagCounts(): Promise<Record<string, number>> {
  const all = await getAllLinks()
  const counts: Record<string, number> = {}
  for (const link of all) {
    for (const tag of link.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1
    }
  }
  return counts
}

export async function getLinkByUrl(url: string): Promise<KuraLink | undefined> {
  const all = await getAllLinks()
  return all.find(l => l.url === url)
}
