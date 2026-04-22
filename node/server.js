// server.js - Hono server that builds the frontend on startup.
// In dev mode esbuild watches and rebuilds on file changes,
// while `node --watch` restarts on server source changes.

import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { execSync, spawn } from "node:child_process"

const dev = process.argv.includes("--dev")

const build = "esbuild src/main.tsx --bundle --outdir=dist --format=esm --jsx=automatic --jsx-import-source=preact --alias:react=preact/compat --alias:react-dom=preact/compat"

if (dev) spawn(build + " --watch", { shell: true, stdio: "inherit" })
else execSync(build, { stdio: "inherit" })

const app = new Hono()

app.get("/api/hello", (c) => c.json({ message: "hello" }))
app.use("/*", serveStatic({ root: "./public" }))
app.use("/*", serveStatic({ root: "./dist" }))

serve({ fetch: app.fetch, port: 3000 }, ({ port }) => {
	console.log(`http://localhost:${port}`)
})
