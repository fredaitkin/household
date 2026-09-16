import { useEffect, useState } from 'react'
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
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [groceryTypes, setGroceryTypes] = useState([])
  const [groceries, setGroceries] = useState([])
  const [newType, setNewType] = useState('')
  const [error, setError] = useState('')

  // New grocery row form state
  const [gDate, setGDate] = useState('')
  const [gTypeId, setGTypeId] = useState('')
  const [gCost, setGCost] = useState('')

  const tab = TABS.find((t) => t.id === activeTab)

  useEffect(() => {
    loadGroceryTypes()
    loadGroceries()
  }, [])

  async function loadGroceryTypes() {
    try {
      const res = await fetch('/api/grocery-types')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setGroceryTypes(await res.json())
    } catch (err) {
      setError(`Could not load grocery types: ${err.message}`)
    }
  }

  async function loadGroceries() {
    try {
      const res = await fetch('/api/groceries')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setGroceries(await res.json())
    } catch (err) {
      setError(`Could not load groceries: ${err.message}`)
    }
  }

  async function addGroceryType(e) {
    e.preventDefault()
    const value = newType.trim()
    if (!value) return
    setError('')
    try {
      const res = await fetch('/api/grocery-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: value }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      setNewType('')
      await loadGroceryTypes()
    } catch (err) {
      setError(`Could not add grocery type: ${err.message}`)
    }
  }

  async function addGrocery(e) {
    e.preventDefault()
    if (!gDate || !gTypeId || gCost === '') return
    setError('')
    try {
      const res = await fetch('/api/groceries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: gDate,
          typeId: Number(gTypeId),
          cost: Number(gCost),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      setGDate('')
      setGTypeId('')
      setGCost('')
      await loadGroceries()
    } catch (err) {
      setError(`Could not add grocery: ${err.message}`)
    }
  }

  // Build the rows to display for the current tab.
  const columns = tab.columns
  let rows = tab.rows
  if (tab.id === 'groceries') {
    rows = groceries.map((g) => [
      formatDate(g.date),
      g.type ?? `#${g.typeId}`,
      formatCost(g.cost),
    ])
  }

  return (
    <div className="page">
      <div className="topbar">
        <h1 className="title">Household Dashboard</h1>
        <button
          type="button"
          className="settings-link"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((open) => !open)}
        >
          ⚙ Settings
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {settingsOpen && (
        <section className="settings-panel" aria-label="Settings">
          <h2 className="settings-title">Add data</h2>

          <form className="settings-form" onSubmit={addGroceryType}>
            <label htmlFor="grocery-type">Grocery type</label>
            <div className="settings-row">
              <input
                id="grocery-type"
                type="text"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="e.g. Produce"
              />
              <button type="submit" className="btn">
                Add to grocery_types
              </button>
            </div>
          </form>

          <form className="settings-form" onSubmit={addGrocery}>
            <label>Add grocery</label>
            <div className="settings-row">
              <input
                type="date"
                value={gDate}
                onChange={(e) => setGDate(e.target.value)}
                aria-label="Date"
              />
              <select
                value={gTypeId}
                onChange={(e) => setGTypeId(e.target.value)}
                aria-label="Type"
              >
                <option value="">Select type…</option>
                {groceryTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.type}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                value={gCost}
                onChange={(e) => setGCost(e.target.value)}
                placeholder="Cost"
                aria-label="Cost"
              />
              <button type="submit" className="btn">
                Add
              </button>
            </div>
          </form>

          {groceryTypes.length > 0 && (
            <>
              <h3 className="settings-subtitle">Grocery types</h3>
              <ul className="settings-list">
                {groceryTypes.map((t) => (
                  <li key={t.id}>{t.type}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

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
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="empty" colSpan={columns.length}>
                  No data yet
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
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

function formatDate(value) {
  if (!value) return ''
  // MySQL DATE may come back as an ISO string; show just the date part.
  return String(value).slice(0, 10)
}

function formatCost(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return `$${n.toFixed(2)}`
}
