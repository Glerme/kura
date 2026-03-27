// entrypoints/popup/LinksTab.tsx
import { useState, useEffect, useMemo } from 'react'
import { getAllLinks, getAllTags } from '../../lib/db'
import type { KuraLink, FilterState } from '../../lib/types'
import { LinkItem } from './LinkItem'

export function LinksTab() {
  const [links, setLinks] = useState<KuraLink[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [filter, setFilter] = useState<FilterState>({ type: 'all' })
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function load() {
    const [l, t] = await Promise.all([getAllLinks(), getAllTags()])
    setLinks(l)
    setTags(t)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let result = links
    if (filter.type === 'unread') result = result.filter(l => !l.readAt)
    if (filter.type === 'tag') result = result.filter(l => l.tags.includes(filter.tag))
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.tags.some(t => t.includes(q)) ||
        (l.comment?.toLowerCase().includes(q) ?? false)
      )
    }
    return result
  }, [links, filter, search])

  return (
    <>
      <input
        className="g-search"
        placeholder="🔍 buscar..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="chips">
        <button
          className={`chip ${filter.type === 'all' ? 'active' : ''}`}
          onClick={() => setFilter({ type: 'all' })}
        >todos</button>
        <button
          className={`chip ${filter.type === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter({ type: 'unread' })}
        >não lidos</button>
        {tags.map(tag => (
          <button
            key={tag}
            className={`chip ${filter.type === 'tag' && filter.tag === tag ? 'active' : ''}`}
            onClick={() => setFilter({ type: 'tag', tag })}
          >{tag}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state">
          Nenhum link salvo ainda.<br />
          Use o ícone ou clique com botão direito em qualquer página.
        </div>
      ) : (
        filtered.map(link => (
          <LinkItem
            key={link.id}
            link={link}
            isExpanded={expandedId === link.id}
            onToggle={() => setExpandedId(expandedId === link.id ? null : link.id)}
            onRefresh={load}
          />
        ))
      )}
      <div className="popup-footer">
        <button
          className="footer-btn"
          onClick={() => browser.tabs.create({ url: browser.runtime.getURL('/options.html') })}
        >Ver todos os links →</button>
      </div>
    </>
  )
}
