// entrypoints/popup/App.tsx
import { useState } from 'react'
import { LinksTab } from './LinksTab'
import { SaveTab } from './SaveTab'
import './App.css'

type Tab = 'links' | 'save'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('links')

  return (
    <div className="popup">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="panel">
        <header className="popup-header">
          <div className="header-dot" />
          KURA
        </header>
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === 'links' ? 'active' : ''}`}
            onClick={() => setActiveTab('links')}
          >
            Links
          </button>
          <button
            className={`tab-btn ${activeTab === 'save' ? 'active' : ''}`}
            onClick={() => setActiveTab('save')}
          >
            Salvar
          </button>
        </div>
        <div className="tab-content">
          {activeTab === 'links' ? <LinksTab /> : <SaveTab />}
        </div>
      </div>
    </div>
  )
}
