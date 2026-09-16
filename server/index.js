import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import express from 'express'
import mysql from 'mysql2/promise'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
app.use(express.json())

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'h-admin',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'Household',
    waitForConnections: true,
    connectionLimit: 10,
})

// Health check
app.get('/api/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1')
        res.json({ ok: true })
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message })
    }
})

// List grocery types
app.get('/api/grocery-types', async (_req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, `type` FROM grocery_types ORDER BY `type` ASC'
        )
        res.json(rows)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// Create a grocery type
app.post('/api/grocery-types', async (req, res) => {
    const type = String(req.body?.type ?? '').trim()
    if (!type) {
        return res.status(400).json({ error: 'type is required' })
    }
    if (type.length > 100) {
        return res.status(400).json({ error: 'type must be 100 characters or fewer' })
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO grocery_types (`type`) VALUES (?)',
            [type]
        )
        res.status(201).json({ id: result.insertId, type })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// List groceries (joined with their type name)
app.get('/api/groceries', async (_req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT g.id,
              g.\`date\`   AS date,
              g.\`Cost\`   AS cost,
              g.\`Type\`   AS typeId,
              t.\`type\`   AS type
       FROM groceries g
       LEFT JOIN grocery_types t ON t.id = g.\`Type\`
       ORDER BY g.\`date\` DESC, g.id DESC`
        )
        res.json(rows)
    } catch (err) {
        console.error('GET /api/groceries failed:', err)
        res.status(500).json({ error: err.message })
    }
})

// Create a grocery
app.post('/api/groceries', async (req, res) => {
    const date = String(req.body?.date ?? '').trim()
    const typeId = Number(req.body?.typeId)
    const cost = Number(req.body?.cost)

    if (!date) return res.status(400).json({ error: 'date is required' })
    if (!Number.isInteger(typeId) || typeId <= 0) {
        return res.status(400).json({ error: 'valid typeId is required' })
    }
    if (!Number.isFinite(cost) || cost < 0) {
        return res.status(400).json({ error: 'valid cost is required' })
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO groceries (`date`, `Type`, `Cost`) VALUES (?, ?, ?)',
            [date, typeId, cost]
        )
        res.status(201).json({ id: result.insertId, date, typeId, cost })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// Delete a grocery type
app.delete('/api/grocery-types/:id', async (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'valid id is required' })
    }
    try {
        await pool.query('DELETE FROM grocery_types WHERE id = ?', [id])
        res.json({ ok: true })
    } catch (err) {
        console.error('DELETE /api/grocery-types failed:', err)
        // ER_ROW_IS_REFERENCED... means groceries still use this type
        res.status(500).json({ error: err.message })
    }
})

// List restaurants
app.get('/api/restaurants', async (_req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, `date` AS date, `Cost` AS cost FROM restaurants ORDER BY `date` DESC, id DESC'
        )
        res.json(rows)
    } catch (err) {
        console.error('GET /api/restaurants failed:', err)
        res.status(500).json({ error: err.message })
    }
})

// Create a restaurant
app.post('/api/restaurants', async (req, res) => {
    const date = String(req.body?.date ?? '').trim()
    const cost = Number(req.body?.cost)
    if (!date) return res.status(400).json({ error: 'date is required' })
    if (!Number.isFinite(cost) || cost < 0) {
        return res.status(400).json({ error: 'valid cost is required' })
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO restaurants (`date`, `Cost`) VALUES (?, ?)',
            [date, cost]
        )
        res.status(201).json({ id: result.insertId, date, cost })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// List entertainment
app.get('/api/entertainment', async (_req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, `date` AS date, `Type` AS type, `Cost` AS cost FROM entertainment ORDER BY `date` DESC, id DESC'
        )
        res.json(rows)
    } catch (err) {
        console.error('GET /api/entertainment failed:', err)
        res.status(500).json({ error: err.message })
    }
})

// Create an entertainment entry
app.post('/api/entertainment', async (req, res) => {
    const date = String(req.body?.date ?? '').trim()
    const type = String(req.body?.type ?? '').trim()
    const cost = Number(req.body?.cost)
    if (!date) return res.status(400).json({ error: 'date is required' })
    if (!type) return res.status(400).json({ error: 'type is required' })
    if (type.length > 100) {
        return res.status(400).json({ error: 'type must be 100 characters or fewer' })
    }
    if (!Number.isFinite(cost) || cost < 0) {
        return res.status(400).json({ error: 'valid cost is required' })
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO entertainment (`date`, `Type`, `Cost`) VALUES (?, ?, ?)',
            [date, type, cost]
        )
        res.status(201).json({ id: result.insertId, date, type, cost })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

const port = Number(process.env.PORT || 3001)
app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`)
    console.log(
        `DB config -> host=${process.env.DB_HOST} port=${process.env.DB_PORT} user=${process.env.DB_USER} db=${process.env.DB_NAME}`
    )
})
