// apps/extension/tests/popup/mocks.ts
import { vi } from 'vitest'

export function mockBrowser() {
  const b = {
    tabs: {
      create: vi.fn(),
      query: vi.fn().mockResolvedValue([{ url: 'https://example.com', title: 'Example' }]),
    },
    runtime: {
      getURL: vi.fn((path: string) => `chrome-extension://fake-id/${path.replace(/^\//, '')}`),
      sendMessage: vi.fn(),
      onMessage: { addListener: vi.fn() },
    },
    contextMenus: {
      create: vi.fn(),
      onClicked: { addListener: vi.fn() },
    },
  }
  vi.stubGlobal('browser', b)
  return b
}
