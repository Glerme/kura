// entrypoints/popup/SaveTab.tsx
import { useState, useEffect } from 'react'
import { addLink, getLinkByUrl, updateLink } from '../../lib/db'
import { parseTags } from '../../lib/tags'
import { fetchTitle, domainFromUrl } from '../../lib/fetch-title'
import type { KuraLink } from '../../lib/types'

export function SaveTab() {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [existing, setExisting] = useState<KuraLink | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
      if (tab?.url) setUrl(tab.url)
      if (tab?.title) {
        setTitle(tab.title)
      } else if (tab?.url) {
        const fetched = await fetchTitle(tab.url).catch(() => '')
        if (fetched) setTitle(fetched)
      }
    })
  }, [])

  async function handleSave() {
    const domain = domainFromUrl(url)
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    const found = await getLinkByUrl(url)
    if (found) { setExisting(found); return }
    await addLink({ url, title, comment: comment || undefined, tags: parseTags(tagsInput), favicon })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleUpdate() {
    if (!existing) return
    await updateLink(existing.id, { title, comment: comment || undefined, tags: parseTags(tagsInput) })
    setExisting(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <div className="tab-body">
        <div className="field">
          <label className="g-label">URL</label>
          <input
            className="g-input mono"
            value={url}
            onChange={e => { setUrl(e.target.value); setExisting(null) }}
          />
        </div>
        <div className="field">
          <label className="g-label">Título</label>
          <input className="g-input" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label className="g-label">Comentário</label>
          <textarea
            className="g-textarea"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Adicione um comentário..."
          />
        </div>
        <div className="field">
          <label className="g-label">Tags</label>
          <input
            className="g-input"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder="dev, leitura"
          />
        </div>

        {existing && (
          <div className="alert">
            Este link já foi salvo.
            <div className="alert-actions">
              <button className="g-btn ghost" onClick={() => setExisting(null)}>Cancelar</button>
              <button className="g-btn" onClick={handleUpdate}>Atualizar</button>
            </div>
          </div>
        )}

        {saved && <div className="alert">✓ Salvo!</div>}
      </div>

      <div className="popup-footer">
        {!existing && !saved && (
          <button className="g-btn" onClick={handleSave}>Salvar esta página</button>
        )}
      </div>
    </>
  )
}
