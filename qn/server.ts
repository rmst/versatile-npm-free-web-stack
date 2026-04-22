// server.ts - Hono server running on qn.
// qn transpiles .ts files on load, has a built-in bundler (qn:bundle), and a
// built-in HTTP server (qn:http). No esbuild, no @hono/node-server.

import { Hono } from "hono"
import type { Context } from "hono"
import { serve } from "qn:http"
import { build } from "qn:bundle"
import { readFileSync, existsSync } from "node:fs"
import { extname } from "node:path"

await build({
	entrypoints: ["src/main.tsx"],
	outdir: "dist",
	format: "esm",
	target: "browser",
	jsxImportSource: "preact",
})

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
