// entrypoints/popup/LinkItem.tsx
import { useState } from 'react'
import { updateLink, deleteLink } from '../../lib/db'
import { domainFromUrl } from '../../lib/fetch-title'
import type { KuraLink } from '../../lib/types'

interface Props {
  link: KuraLink
  isExpanded: boolean
  onToggle: () => void
  onRefresh: () => void
}

export function LinkItem({ link, isExpanded, onToggle, onRefresh }: Props) {
  const domain = domainFromUrl(link.url)

  function openLink() {
    browser.tabs.create({ url: link.url })
  }

  async function markRead() {
    await updateLink(link.id, { readAt: Date.now() })
    onRefresh()
  }

  async function handleDelete() {
    await deleteLink(link.id)
    onRefresh()
  }

  return (
    <div className={`link-item ${isExpanded ? 'open' : ''}`}>
      <div className="link-row" onClick={openLink}>
        <FaviconImg domain={domain} />
        <div className="link-info">
          <div className="link-title">{link.title}</div>
          <div className="link-domain">{domain}</div>
          {link.tags.length > 0 && (
            <div className="link-tags">
              {link.tags.map(t => <span key={t} className="link-tag">{t}</span>)}
            </div>
          )}
        </div>
        {!link.readAt && <div className="unread-dot" />}
        <button
          className="chevron-btn"
          aria-label="expandir"
          onClick={e => { e.stopPropagation(); onToggle() }}
        >▾</button>
      </div>
      {isExpanded && (
        <div className="link-detail">
          {link.comment && <p className="link-comment">"{link.comment}"</p>}
          <div className="action-btns">
            <button className="action-btn" onClick={openLink}>↗ Abrir</button>
            {!link.readAt && (
              <button className="action-btn" onClick={markRead}>✓ Lido</button>
            )}
            <button className="action-btn danger" onClick={handleDelete}>✕ Deletar</button>
          </div>
        </div>
      )}
    </div>
  )
}

function FaviconImg({ domain }: { domain: string }) {
  const [error, setError] = useState(false)
  if (error) {
    return <div className="favicon-fallback">{domain.charAt(0).toUpperCase()}</div>
  }
  return (
    <img
      className="favicon"
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      onError={() => setError(true)}
      alt=""
    />
  )
}
