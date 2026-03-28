import { addLink, getLinkByUrl } from '../lib/db'
import { domainFromUrl } from '../lib/fetch-title'

export default defineBackground(() => {
  browser.contextMenus.create({
    id: 'save-to-kura',
    title: 'Salvar no Kura',
    contexts: ['page', 'link', 'selection'],
  })

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    const tabId = tab?.id
    if (!tabId) return

    // Selection: save the selected text as a note (no URL)
    if (info.selectionText) {
      const text = info.selectionText.trim()
      const title = text.length > 80 ? text.slice(0, 80) + '…' : text
      const comment = text.length > 80 ? text : undefined
      const link = await addLink({ url: `kura://note/${Date.now()}`, title, comment, tags: [], favicon: '' })
      browser.tabs.sendMessage(tabId, { type: 'LINK_SAVED', link }).catch(() => {})
      return
    }

    // Strip fragment from URL — fragments are client-side only
    const url = (info.linkUrl ?? info.pageUrl ?? tab?.url ?? '').split('#')[0]
    const title = tab?.title ?? ''
    if (!url) return

    const existing = await getLinkByUrl(url)

    if (existing) {
      browser.tabs.sendMessage(tabId, { type: 'ALREADY_SAVED', link: existing }).catch(() => {})
      return
    }

    const domain = domainFromUrl(url)
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    const link = await addLink({ url, title, tags: [], favicon })
    browser.tabs.sendMessage(tabId, { type: 'LINK_SAVED', link }).catch(() => {})
  })

  browser.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'OPEN_POPUP') {
      // browser.action.openPopup is available in Chrome MV3; may not work in all contexts
      browser.action.openPopup?.()
    }
  })
})
