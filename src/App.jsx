import { useEffect, useState } from 'react'
import './App.css'

const TABS = [
  { id: 'groceries', label: 'Groceries', columns: ['Date', 'Type', 'Cost'] },
  { id: 'restaurants', label: 'Restaurants', columns: ['Date', 'Cost'] },
  { id: 'entertainment', label: 'Entertainment', columns: ['Date', 'Type', 'Cost'] },
]

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS[0].id)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [addGroceryOpen, setAddGroceryOpen] = useState(false)

  const [groceryTypes, setGroceryTypes] = useState([])
  const [groceries, setGroceries] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [entertainment, setEntertainment] = useState([])
  const [error, setError] = useState('')

  // Form field state
  const [newType, setNewType] = useState('')
  const [gDate, setGDate] = useState('')
  const [gTypeId, setGTypeId] = useState('')
  const [gCost, setGCost] = useState('')
  const [rDate, setRDate] = useState('')
  const [rCost, setRCost] = useState('')
  const [eDate, setEDate] = useState('')
  const [eType, setEType] = useState('')
  const [eCost, setECost] = useState('')

  const tab = TABS.find((t) => t.id === activeTab)

  async function api(path, options) {
    const res = await fetch(path, options)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `HTTP ${res.status}`)
    }
    return res.json()
  }

  async function loadGroceryTypes() {
    try {
      setGroceryTypes(await api('/api/grocery-types'))
    } catch (err) {
      setError(`Could not load grocery types: ${err.message}`)
    }
  }

  async function loadGroceries() {
    try {
      setGroceries(await api('/api/groceries'))
    } catch (err) {
      setError(`Could not load groceries: ${err.message}`)
    }
  }

  async function loadRestaurants() {
    try {
      setRestaurants(await api('/api/restaurants'))
    } catch (err) {
      setError(`Could not load restaurants: ${err.message}`)
    }
  }

  async function loadEntertainment() {
    try {
      setEntertainment(await api('/api/entertainment'))
    } catch (err) {
      setError(`Could not load entertainment: ${err.message}`)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadAll() {
      try {
        const [types, groceryRows, restaurantRows, entertainmentRows] =
          await Promise.all([
            api('/api/grocery-types'),
            api('/api/groceries'),
            api('/api/restaurants'),
            api('/api/entertainment'),
          ])
        if (cancelled) return
        setGroceryTypes(types)
        setGroceries(groceryRows)
        setRestaurants(restaurantRows)
        setEntertainment(entertainmentRows)
      } catch (err) {
        if (!cancelled) setError(`Could not load data: ${err.message}`)
      }
    }

    loadAll()
    return () => {
      cancelled = true
    }
  }, [])

  async function addGroceryType(e) {
    e.preventDefault()
    const value = newType.trim()
    if (!value) return
    setError('')
    try {
      await api('/api/grocery-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: value }),
      })
      setNewType('')
      await loadGroceryTypes()
    } catch (err) {
      setError(`Could not add grocery type: ${err.message}`)
    }
  }

  async function deleteGroceryType(id) {
    setError('')
    try {
      await api(`/api/grocery-types/${id}`, { method: 'DELETE' })
      await loadGroceryTypes()
    } catch (err) {
      setError(`Could not delete grocery type: ${err.message}`)
    }
  }

  async function addGrocery(e) {
    e.preventDefault()
    if (!gDate || !gTypeId || gCost === '') return
    setError('')
    try {
      await api('/api/groceries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: gDate, typeId: Number(gTypeId), cost: Number(gCost) }),
      })
      setGDate('')
      setGTypeId('')
      setGCost('')
      await loadGroceries()
    } catch (err) {
      setError(`Could not add grocery: ${err.message}`)
    }
  }

  async function addRestaurant(e) {
    e.preventDefault()
    if (!rDate || rCost === '') return
    setError('')
    try {
      await api('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: rDate, cost: Number(rCost) }),
      })
      setRDate('')
      setRCost('')
      await loadRestaurants()
    } catch (err) {
      setError(`Could not add restaurant: ${err.message}`)
    }
  }

  async function addEntertainment(e) {
    e.preventDefault()
    if (!eDate || !eType.trim() || eCost === '') return
    setError('')
    try {
      await api('/api/entertainment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: eDate, type: eType.trim(), cost: Number(eCost) }),
      })
      setEDate('')
      setEType('')
      setECost('')
      await loadEntertainment()
    } catch (err) {
      setError(`Could not add entertainment: ${err.message}`)
    }
  }

  // Build the rows to display for the current tab.
  const columns = tab.columns
  let rows = []
  if (tab.id === 'groceries') {
    rows = groceries.map((g) => [formatDate(g.date), g.type ?? `#${g.typeId}`, formatCost(g.cost)])
  } else if (tab.id === 'restaurants') {
    rows = restaurants.map((r) => [formatDate(r.date), formatCost(r.cost)])
  } else if (tab.id === 'entertainment') {
    rows = entertainment.map((x) => [formatDate(x.date), x.type, formatCost(x.cost)])
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
                Add type
              </button>
            </div>
          </form>

          {groceryTypes.length > 0 && (
            <>
              <h3 className="settings-subtitle">Grocery types</h3>
              <ul className="settings-list">
                {groceryTypes.map((t) => (
                  <li key={t.id}>
                    {t.type}
                    <button
                      type="button"
                      className="chip-x"
                      aria-label={`Delete ${t.type}`}
                      onClick={() => deleteGroceryType(t.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <form className="settings-form" onSubmit={addRestaurant}>
            <label>Add restaurant</label>
            <div className="settings-row">
              <input
                type="date"
                value={rDate}
                onChange={(e) => setRDate(e.target.value)}
                aria-label="Date"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={rCost}
                onChange={(e) => setRCost(e.target.value)}
                placeholder="Cost"
                aria-label="Cost"
              />
              <button type="submit" className="btn">
                Add
              </button>
            </div>
          </form>

          <form className="settings-form" onSubmit={addEntertainment}>
            <label>Add entertainment</label>
            <div className="settings-row">
              <input
                type="date"
                value={eDate}
                onChange={(e) => setEDate(e.target.value)}
                aria-label="Date"
              />
              <input
                type="text"
                value={eType}
                onChange={(e) => setEType(e.target.value)}
                placeholder="Type (e.g. Movie)"
                aria-label="Type"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={eCost}
                onChange={(e) => setECost(e.target.value)}
                placeholder="Cost"
                aria-label="Cost"
              />
              <button type="submit" className="btn">
                Add
              </button>
            </div>
          </form>
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

      {activeTab === 'groceries' && (
        <div className="add-grocery">
          <button
            type="button"
            className="add-grocery-link"
            aria-expanded={addGroceryOpen}
            onClick={() => setAddGroceryOpen((open) => !open)}
          >
            + Add grocery
          </button>

          {addGroceryOpen && (
            <form className="settings-form" onSubmit={addGrocery}>
              <label>Add grocery</label>
              <div className="settings-row">
                <input
                  type="date"
                  value={gDate}
                  onChange={(e) => setGDate(e.target.value)}
                  aria-label="Date"
                />
                <select value={gTypeId} onChange={(e) => setGTypeId(e.target.value)} aria-label="Type">
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
          )}
        </div>
      )}
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
