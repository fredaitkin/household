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
  const [addRestaurantOpen, setAddRestaurantOpen] = useState(false)
  const [addEntertainmentOpen, setAddEntertainmentOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

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
  const columns = [...tab.columns, '']
  const isGroceries = tab.id === 'groceries'
  const isRestaurants = tab.id === 'restaurants'
  const isEntertainment = tab.id === 'entertainment'
  let rows = []
  if (isGroceries) {
    rows = groceries.map((g) => ({
      key: g.id,
      cells: [formatDate(g.date), g.type ?? `#${g.typeId}`, formatCost(g.cost)],
    }))
  } else if (isRestaurants) {
    rows = restaurants.map((r) => ({
      key: r.id,
      cells: [formatDate(r.date), formatCost(r.cost)]
    }))
  } else if (isEntertainment) {
    rows = entertainment.map((x) => ({
      key: x.id,
      cells: [formatDate(x.date), x.type ?? `#${x.typeId}`, formatCost(x.cost)]
    }))
  }
  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage))
  const pageIndex = Math.min(currentPage, pageCount - 1)
  const visibleRows = rows.slice(
    pageIndex * rowsPerPage,
    (pageIndex + 1) * rowsPerPage,
  )

  async function deleteGrocery(id) {
    setError('')
    try {
      await api(`/api/groceries/${id}`, { method: 'DELETE' })
      await loadGroceries()
    } catch (err) {
      setError(`Could not delete grocery: ${err.message}`)
    }
  }

  async function deleteRestaurant(id) {
    setError('')
    try {
      await api(`/api/restaurants/${id}`, { method: 'DELETE' })
      await loadRestaurants()
    } catch (err) {
      setError(`Could not delete restaurant: ${err.message}`)
    }
  }

  async function deleteEntertainment(id) {
    setError('')
    try {
      await api(`/api/entertainment/${id}`, { method: 'DELETE' })
      await loadEntertainment()
    } catch (err) {
      setError(`Could not delete entertainment: ${err.message}`)
    }
  }

  function renderDeleteAction(label, id, deleteHandler) {
    return (
      <td className="row-actions">
        <button
          type="button"
          className="row-delete"
          aria-label={`Delete ${label} row`}
          title="Delete row"
          onClick={() => deleteHandler(id)}
        >
          ×
        </button>
      </td>
    )
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

        </section>
      )}

      <div className="tabs" role="tablist" aria-label="Household data">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === activeTab}
            className={`tab${t.id === activeTab ? ' active' : ''}`}
            onClick={() => {
              setActiveTab(t.id)
              setCurrentPage(0)
            }}
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
              visibleRows.map((row) => (
                <tr key={row.key}>
                  {row.cells.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                  {isGroceries && renderDeleteAction('grocery', row.key, deleteGrocery)}
                  {isRestaurants && renderDeleteAction('restaurant', row.key, deleteRestaurant)}
                  {isEntertainment && renderDeleteAction('entertainment', row.key, deleteEntertainment)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="table-controls" aria-label="Table pagination">
          <label htmlFor="rows-per-page">Rows per page</label>
          <select
            id="rows-per-page"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value))
              setCurrentPage(0)
            }}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>
            Showing {pageIndex * rowsPerPage + 1}-{Math.min((pageIndex + 1) * rowsPerPage, rows.length)} of {rows.length}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => page - 1)}
            disabled={pageIndex === 0}
          >
            Previous
          </button>
          <span>Page {pageIndex + 1} of {pageCount}</span>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => page + 1)}
            disabled={pageIndex === pageCount - 1}
          >
            Next
          </button>
        </div>
      )}

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
      {activeTab === 'restaurants' && (
        <div className="add-restaurant">
          <button
            type="button"
            className="add-restaurant-link"
            aria-expanded={addRestaurantOpen}
            onClick={() => setAddRestaurantOpen((open) => !open)}
          >
            + Add restaurant
          </button>

          {addRestaurantOpen && (
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
          )}
        </div>
      )}
      {activeTab === 'entertainment' && (
        <div className="add-entertainment">
          <button
            type="button"
            className="add-entertainment-link"
            aria-expanded={addEntertainmentOpen}
            onClick={() => setAddEntertainmentOpen((open) => !open)}
          >
            + Add entertainment
          </button>

          {addEntertainmentOpen && (
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
