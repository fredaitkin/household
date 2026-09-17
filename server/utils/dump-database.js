// Dumps the Household MySQL database to a single timestamped .sql file
// using mysqldump.
//
// Usage:
//   node server/utils/dump-database.js [outputDir] or npm run db:dump
//
// mysqldump is located via MYSQLDUMP_PATH, the standard MySQL Servers
// install location, or PATH. Credentials are read from server/.env.
//
// Restore with: mysql -u <user> -p < dumpFile.sql

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const host = process.env.DB_HOST || 'localhost'
const port = Number(process.env.DB_PORT || 3306)
// Prefer dedicated dump credentials, but only if a dump password is set;
// mysqldump only needs privileges on the schema being dumped, so the app
// user is usually sufficient.
const useDumpCreds = !!(process.env.DB_DUMP_USER && process.env.DB_DUMP_PASSWORD)
const user = useDumpCreds ? process.env.DB_DUMP_USER : (process.env.DB_USER || 'h-admin')
const password = useDumpCreds ? process.env.DB_DUMP_PASSWORD : (process.env.DB_PASSWORD || '')
const requestedDb = process.env.DB_NAME || 'Household'

const wellKnown = 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe'
const mysqldump =
    process.env.MYSQLDUMP_PATH ||
    (fs.existsSync(wellKnown) ? wellKnown : 'mysqldump')

const env = { ...process.env, MYSQL_PWD: password }
const shellOpts = { env, stdio: ['ignore', 'pipe', 'pipe'], shell: false }

// Resolve the actual schema name on the server: servers on Windows
// typically store them in lowercase.
const resolved = await new Promise((resolvePromise, rejectPromise) => {
    const q = spawn(
        'mysqlsh',
        ['-u', user, '-h', host, '-P', String(port), '--sql', '--json=raw', '-e',
            `SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE LOWER(SCHEMA_NAME) = LOWER('${requestedDb.replaceAll("'", "''")}')`],
        shellOpts
    )
    let out = ''
    let errOut = ''
    q.stdout.on('data', (chunk) => { out += chunk })
    q.stderr.on('data', (chunk) => { errOut += chunk })
    q.on('error', rejectPromise)
    q.on('close', (code) => {
        if (code !== 0) {
            return rejectPromise(new Error(
                `Could not query schemas (exit ${code}): ${errOut.trim()}`
            ))
        }
        const match = [...out.matchAll(/"SCHEMA_NAME"\s*:\s*"([^"]+)"/g)]
        resolvePromise(match.length ? match[0][1] : null)
    })
}).catch((err) => {
    console.error(
        err.code === 'ENOENT'
            ? 'mysqlsh was not found. Install MySQL Shell or add its bin folder to PATH.'
            : err.message
    )
    process.exit(1)
})

if (!resolved) {
    console.error(`Database "${requestedDb}" was not found on ${host}:${port}.`)
    process.exit(1)
}

const database = resolved

const timestamp = new Date()
    .toISOString()
    .replace(/[:T]/g, '-')
    .replace(/\..+$/, '')
const outputDir = path.resolve(
    process.argv[2] || path.join(__dirname, '..', '..', 'db', 'backups')
)
const dumpFile = path.join(outputDir, `${database}-${timestamp}.sql`)

fs.mkdirSync(outputDir, { recursive: true })

const args = [
    `--host=${host}`,
    `--port=${port}`,
    `--user=${user}`,
    '--routines',
    '--triggers',
    '--events',
    '--no-tablespaces',
    '--databases',
    database,
]

console.log(`Dumping database "${database}" from ${host}:${port} ...`)

// Pass the password via env var so it never appears on the command line
// or in the process list.
const child = spawn(mysqldump, args, {
    env,
    stdio: ['ignore', 'pipe', 'inherit'],
    shell: false,
})

const out = fs.createWriteStream(dumpFile, { encoding: 'utf8' })
child.stdout.pipe(out)

child.on('error', (err) => {
    out.close()
    fs.rmSync(dumpFile, { force: true })
    console.error(
        err.code === 'ENOENT'
            ? `mysqldump was not found at "${mysqldump}". Set MYSQLDUMP_PATH in server/.env or add it to PATH.`
            : `Failed to start mysqldump: ${err.message}`
    )
    process.exit(1)
})

child.on('close', (code) => {
    if (code === 0) {
        const sizeKb = (fs.statSync(dumpFile).size / 1024).toFixed(1)
        console.log(`Dump written to ${dumpFile} (${sizeKb} KB)`)
    } else {
        out.close()
        fs.rmSync(dumpFile, { force: true })
        console.error(`mysqldump exited with code ${code}`)
        process.exit(code ?? 1)
    }
})
