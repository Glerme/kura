export interface KuraLink {
  id: string
  url: string
  title: string
  comment?: string
  tags: string[]
  favicon?: string
  savedAt: number     // Unix ms timestamp
  readAt?: number     // undefined = unread; timestamp = read
}

export type FilterState =
  | { type: 'all' }
  | { type: 'unread' }
  | { type: 'tag'; tag: string }
