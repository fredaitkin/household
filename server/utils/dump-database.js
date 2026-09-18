/*
 * Dumps the Household MySQL database to a single timestamped .sql file
 * using mysqldump.
 * Usage:
 *    npm run db:dump [outputDir]
 *
 * mysqldump is located via MYSQLDUMP_PATH, the standard MySQL Servers
 * install location, currently a Windows location, or PATH.
 *
 * Credentials are read from server/.env.
 *
 * Restore with: mysql -u <user> -p < dumpFile.sql>
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const host = process.env.DB_HOST || 'localhost'
const port = Number(process.env.DB_PORT || 3306)
const user = process.env.DB_USER || 'h-admin'
const password = process.env.DB_PASSWORD || ''
const requestedDb = process.env.DB_NAME || 'Household'

// This is the well-known location of mysqldump on Windows.
const wellknownWindowsLocation = 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe'
const mysqldump =
  process.env.MYSQLDUMP_PATH ||
    (fs.existsSync(wellknownWindowsLocation) ? wellknownWindowsLocation : 'mysqldump')

const env = { ...process.env, MYSQL_PWD: password }

const timestamp = new Date()
  .toISOString()
  .replace(/[:T]/g, '-')
  .replace(/\..+$/, '')
const outputDir = path.resolve(
  process.argv[2] || path.join(__dirname, '..', '..', 'db', 'backups')
)
const dumpFile = path.join(outputDir, `${requestedDb}-${timestamp}.sql`)

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
  requestedDb,
]

console.log(`Dumping database "${requestedDb}" from ${host}:${port} ...`)

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
