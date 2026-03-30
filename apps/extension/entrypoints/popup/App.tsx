// entrypoints/popup/App.tsx
import { useState } from 'react'
import { LinksTab } from './LinksTab'
import { SaveTab } from './SaveTab'
import kuraLogo from '~/assets/Kura.png'
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
          <img src={kuraLogo} alt="Kura" className="header-logo" />
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
