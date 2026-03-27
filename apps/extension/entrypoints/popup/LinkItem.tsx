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
  const isNote = link.url.startsWith('kura://')
  const domain = isNote ? 'nota' : domainFromUrl(link.url)
  const [copied, setCopied] = useState(false)

  function openLink() {
    if (isNote) return
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

  async function handleShare() {
    const noteText = link.comment ?? link.title
    const text = isNote ? noteText : `${link.title}\n${link.url}`

    if (navigator.share) {
      await navigator.share({ title: link.title, text, url: isNote ? undefined : link.url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(isNote ? noteText : link.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className={`link-item ${isExpanded ? 'open' : ''}`}>
      <div className="link-row" onClick={isNote ? onToggle : openLink} style={isNote ? { cursor: 'pointer' } : undefined}>
        {isNote ? <div className="favicon-fallback">✎</div> : <FaviconImg domain={domain} />}
        <div className="link-info">
          <div className="link-title">{link.title}</div>
          <div className="link-domain">{domain}</div>
          {link.tags.length > 0 && (
            <div className="link-tags">
              {link.tags.map(t => <span key={t} className="link-tag">{t}</span>)}
            </div>
          )}
        </div>
        {link.readAt ? <div className="read-dot" /> : <div className="unread-dot" />}
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
            {!isNote && <button className="action-btn" onClick={openLink}>↗ Abrir</button>}
            {!link.readAt && (
              <button className="action-btn" onClick={markRead}>✓ Lido</button>
            )}
            <button className="action-btn" onClick={handleShare}>
              {copied ? '✓ Copiado' : '⎘ Compartilhar'}
            </button>
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
