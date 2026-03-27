import { addLink, getLinkByUrl } from '../lib/db'
import { domainFromUrl } from '../lib/fetch-title'

export default defineBackground(() => {
  browser.contextMenus.create({
    id: 'save-to-kura',
    title: 'Salvar no Kura',
    contexts: ['page', 'link'],
  })

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    // Strip fragment from URL — fragments are client-side only
    const url = (info.linkUrl ?? info.pageUrl ?? tab?.url ?? '').split('#')[0]
    const title = tab?.title ?? ''
    const tabId = tab?.id
    if (!url || !tabId) return

    const existing = await getLinkByUrl(url)

    if (existing) {
      browser.tabs.sendMessage(tabId, { type: 'ALREADY_SAVED', link: existing })
      return
    }

    const domain = domainFromUrl(url)
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    const link = await addLink({ url, title, tags: [], favicon })
    browser.tabs.sendMessage(tabId, { type: 'LINK_SAVED', link })
  })
})
