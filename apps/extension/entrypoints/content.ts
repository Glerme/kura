// entrypoints/content.ts
import { updateLink } from '../lib/db'
import { parseTags } from '../lib/tags'
import type { KuraLink } from '../lib/types'

export default defineContentScript({
  // <all_urls> is required so the toast appears on any page after saving.
  // Keep this file minimal — any bug here affects every page the user visits.
  matches: ['<all_urls>'],
  main() {
    let host: HTMLElement | null = null
    let timer: ReturnType<typeof setTimeout> | null = null

    browser.runtime.onMessage.addListener((msg: { type: string; link: KuraLink }) => {
      if (msg.type === 'LINK_SAVED') showToast('saved', msg.link)
      if (msg.type === 'ALREADY_SAVED') showToast('existing', msg.link)
    })

    function showToast(mode: 'saved' | 'existing', link: KuraLink) {
      host?.remove()
      if (timer) clearTimeout(timer)

      host = document.createElement('div')
      const shadow = host.attachShadow({ mode: 'open' })
      shadow.innerHTML = buildToastHTML(mode, link)
      document.body.appendChild(host)

      const close = () => {
        host?.remove()
        host = null
        if (timer) clearTimeout(timer)
      }

      shadow.getElementById('kura-close')?.addEventListener('click', close)
      shadow.getElementById('kura-nothanks')?.addEventListener('click', close)
      shadow.getElementById('kura-skip')?.addEventListener('click', close)

      const expand = () => {
        if (timer) clearTimeout(timer)
        shadow.getElementById('kura-collapsed')!.style.display = 'none'
        shadow.getElementById('kura-expanded')!.style.display = 'block'
      }

      shadow.getElementById('kura-add')?.addEventListener('click', expand)
      shadow.getElementById('kura-update')?.addEventListener('click', expand)

      shadow.getElementById('kura-confirm')?.addEventListener('click', async () => {
        const tagsEl = shadow.getElementById('kura-tags') as HTMLInputElement
        const commentEl = shadow.getElementById('kura-comment') as HTMLTextAreaElement
        await updateLink(link.id, {
          tags: parseTags(tagsEl.value),
          comment: commentEl.value || undefined,
        })
        close()
      })

      shadow.getElementById('kura-view')?.addEventListener('click', () => {
        browser.runtime.sendMessage({ type: 'OPEN_POPUP' })
        close()
      })

      timer = setTimeout(close, mode === 'saved' ? 6000 : 10000)
    }
  },
})

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function buildToastHTML(mode: 'saved' | 'existing', link: KuraLink): string {
  const truncUrl = link.url.length > 42 ? link.url.slice(0, 42) + '…' : link.url
  const isSaved = mode === 'saved'

  return `
<style>
:host {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.toast {
  width: 300px;
  border-radius: 14px;
  background: rgba(18,18,18,0.88);
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 4px 6px rgba(0,0,0,0.4), 0 16px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.10);
  color: #fff;
  overflow: hidden;
  animation: slide-in 0.25s ease-out;
}
@keyframes slide-in { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.progress { height: 2px; background: rgba(255,255,255,0.08); }
.bar { height: 100%; background: rgba(255,255,255,0.35); ${isSaved ? 'animation: drain 6s linear forwards;' : 'width:0'} }
@keyframes drain { from { width: 100%; } to { width: 0%; } }
.body { padding: 12px 13px 13px; }
.top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.icon { width: 26px; height: 26px; border-radius: 7px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
.txt { flex: 1; min-width: 0; }
.ttl { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); }
.url { font-size: 9.5px; color: rgba(255,255,255,0.28); font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.x { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.2); font-size: 13px; padding: 2px 5px; border-radius: 4px; line-height: 1; }
.x:hover { color: rgba(255,255,255,0.5); }
.acts { display: flex; gap: 5px; }
.btn { flex: 1; border-radius: 7px; padding: 6px 4px; font-size: 10.5px; font-weight: 600; cursor: pointer; text-align: center; border: 1px solid rgba(255,255,255,0.12); font-family: inherit; }
.primary { background: rgba(255,255,255,0.11); color: rgba(255,255,255,0.9); }
.ghost { background: transparent; color: rgba(255,255,255,0.3); }
.fields { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
.inp, .ta { width: 100%; background: rgba(255,255,255,0.055); border: 1px solid rgba(255,255,255,0.09); border-radius: 7px; color: rgba(255,255,255,0.8); padding: 6px 9px; font-size: 11px; font-family: inherit; outline: none; box-sizing: border-box; }
.ta { min-height: 48px; resize: none; }
</style>
<div class="toast">
  <div class="progress"><div class="bar"></div></div>
  <div class="body">
    <div class="top">
      <div class="icon">◆</div>
      <div class="txt">
        <div class="ttl">${isSaved ? 'Link salvo!' : 'Já salvo!'}</div>
        <div class="url">${esc(truncUrl)}</div>
      </div>
      <button class="x" id="kura-close">✕</button>
    </div>
    <div id="kura-collapsed">
      ${isSaved
        ? `<div class="acts">
             <button class="btn ghost" id="kura-nothanks">Não, obrigado</button>
             <button class="btn primary" id="kura-add">Adicionar →</button>
           </div>`
        : `<div class="acts">
             <button class="btn ghost" id="kura-view">Ver</button>
             <button class="btn primary" id="kura-update">Atualizar</button>
           </div>`
      }
    </div>
    <div id="kura-expanded" style="display:none">
      <div class="fields">
        <input class="inp" id="kura-tags" placeholder="Tags (ex: dev, leitura)" value="${esc(link.tags.join(', '))}">
        <textarea class="ta" id="kura-comment" placeholder="Comentário...">${esc(link.comment ?? '')}</textarea>
      </div>
      <div class="acts">
        <button class="btn ghost" id="kura-skip">Pular</button>
        <button class="btn primary" id="kura-confirm">Confirmar</button>
      </div>
    </div>
  </div>
</div>`
}
