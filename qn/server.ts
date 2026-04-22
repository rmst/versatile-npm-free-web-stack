// server.ts - Hono server running on qn.
// qn transpiles .ts files on load (for our code) and has a built-in HTTP
// server (qn:http), so neither esbuild nor @hono/node-server is needed for
// the backend. esbuild is still invoked for the frontend bundle.

import { Hono } from "hono"
import type { Context } from "hono"
import { serve } from "qn:http"
import { readFileSync, existsSync } from "node:fs"
import { extname } from "node:path"
import { execSync, spawn } from "node:child_process"

const dev = process.argv.includes("--dev")

const build = "esbuild src/main.tsx --bundle --outdir=dist --format=esm --jsx=automatic --jsx-import-source=preact"
if (dev) spawn(build + " --watch", { shell: true, stdio: "inherit" })
else execSync(build, { stdio: "inherit" })

const MIME: Record<string, string> = {
	".html": "text/html", ".js": "text/javascript", ".css": "text/css",
	".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
}

const app = new Hono()
app.get("/api/hello", (c: Context) => c.json({ message: "hello" }))
app.get("/*", (c: Context) => {
	const p = c.req.path === "/" ? "/index.html" : c.req.path
	const f = `./dist${p}`
	if (!existsSync(f)) return c.notFound()
	return c.body(readFileSync(f), { headers: { "content-type": MIME[extname(f)] ?? "application/octet-stream" } })
})

serve({ port: 3000 }, app.fetch)
console.log("http://localhost:3000")
