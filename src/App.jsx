import { useState } from 'react'
import './App.css'

const TABS = [
  {
    id: 'groceries',
    label: 'Groceries',
    columns: ['Date', 'Type', 'Cost'],
    rows: [],
  },
  {
    id: 'restaurants',
    label: 'Restaurants',
    columns: ['Date', 'Cost'],
    rows: [],
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    columns: ['Date', 'Type', 'Cost'],
    rows: [],
  },
]

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS[0].id)
  const tab = TABS.find((t) => t.id === activeTab)

  return (
    <div className="page">
      <h1 className="title">Household Dashboard</h1>

      <div className="tabs" role="tablist" aria-label="Household data">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === activeTab}
            className={`tab${t.id === activeTab ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="table-wrap" role="tabpanel">
        <table>
          <thead>
            <tr>
              {tab.columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tab.rows.length === 0 ? (
              <tr>
                <td className="empty" colSpan={tab.columns.length}>
                  No data yet
                </td>
              </tr>
            ) : (
              tab.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
