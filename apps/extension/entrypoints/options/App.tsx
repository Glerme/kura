import { useState, useEffect, useMemo } from 'react'
import { getAllLinks, getAllTags, deleteLink, updateLink } from '../../lib/db'
import { domainFromUrl } from '../../lib/fetch-title'
import type { KuraLink, FilterState } from '../../lib/types'
import './App.css'

export default function App() {
  const [links, setLinks] = useState<KuraLink[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [filter, setFilter] = useState<FilterState>({ type: 'all' })
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

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

  async function handleDelete(id: string) {
    await deleteLink(id)
    load()
  }

  async function handleMarkRead(id: string) {
    await updateLink(id, { readAt: Date.now() })
    load()
  }

  async function handleShare(link: KuraLink) {
    const isNote = link.url.startsWith('kura://')
    const text = isNote ? (link.comment ?? link.title) : link.url
    if (navigator.share && !isNote) {
      await navigator.share({ title: link.title, url: link.url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(text)
      setCopied(link.id)
      setTimeout(() => setCopied(null), 1500)
    }
  }

  function relativeDate(ts: number) {
    const diff = Date.now() - ts
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'agora'
    if (m < 60) return `${m}min atrás`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h atrás`
    const d = Math.floor(h / 24)
    if (d < 30) return `${d}d atrás`
    return new Date(ts).toLocaleDateString('pt-BR')
  }

  return (
    <div className="layout">
      {/* blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="header-dot" />
          KURA
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${filter.type === 'all' ? 'active' : ''}`}
            onClick={() => setFilter({ type: 'all' })}
          >Todos</button>
          <button
            className={`nav-item ${filter.type === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter({ type: 'unread' })}
          >Não lidos</button>
        </nav>
        {tags.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">Tags</div>
            {tags.map(tag => (
              <button
                key={tag}
                className={`nav-item ${filter.type === 'tag' && filter.tag === tag ? 'active' : ''}`}
                onClick={() => setFilter({ type: 'tag', tag })}
              >{tag}</button>
            ))}
          </div>
        )}
      </aside>

      {/* main */}
      <main className="main">
        <div className="topbar">
          <input
            className="search"
            placeholder="🔍 Buscar links..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="count">{filtered.length} link{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            Nenhum link encontrado.
          </div>
        ) : (
          <div className="link-list">
            {filtered.map(link => {
              const isNote = link.url.startsWith('kura://')
              const domain = isNote ? 'nota' : domainFromUrl(link.url)
              const isExpanded = expandedId === link.id
              return (
                <div key={link.id} className={`row ${isExpanded ? 'open' : ''}`}>
                  <div className="row-main" onClick={() => {
                    if (isNote) { setExpandedId(isExpanded ? null : link.id); return }
                    window.open(link.url, '_blank')
                  }}>
                    {isNote
                      ? <div className="favicon-fb">✎</div>
                      : <FaviconImg domain={domain} />
                    }
                    <div className="row-info">
                      <div className="row-title">{link.title}</div>
                      <div className="row-meta">
                        <span className="row-domain">{domain}</span>
                        {link.tags.map(t => <span key={t} className="tag">{t}</span>)}
                      </div>
                      {link.comment && isExpanded && (
                        <div className="row-comment">"{link.comment}"</div>
                      )}
                    </div>
                    <div className="row-right">
                      <span className="row-date">{relativeDate(link.savedAt)}</span>
                      {link.readAt
                        ? <span className="status-dot read" />
                        : <span className="status-dot unread" />
                      }
                    </div>
                    <button className={`expand-btn ${isExpanded ? 'rotated' : ''}`}
                      onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : link.id) }}
                    >▾</button>
                  </div>
                  {isExpanded && (
                    <div className="row-actions">
                      {!isNote && (
                        <button className="act-btn" onClick={() => window.open(link.url, '_blank')}>↗ Abrir</button>
                      )}
                      {!link.readAt && (
                        <button className="act-btn" onClick={() => handleMarkRead(link.id)}>✓ Lido</button>
                      )}
                      <button className="act-btn" onClick={() => handleShare(link)}>
                        {copied === link.id ? '✓ Copiado' : '⎘ Compartilhar'}
                      </button>
                      <button className="act-btn danger" onClick={() => handleDelete(link.id)}>✕ Deletar</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function FaviconImg({ domain }: { domain: string }) {
  const [err, setErr] = useState(false)
  if (err) return <div className="favicon-fb">{domain.charAt(0).toUpperCase()}</div>
  return (
    <img
      className="favicon"
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      onError={() => setErr(true)}
      alt=""
    />
  )
}
