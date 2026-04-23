// server.ts - Hono server running on qn.
// qn transpiles .ts files on load, has a built-in bundler (qn:bundle), and a
// built-in HTTP server (qn:http). No esbuild, no @hono/node-server.

import { Hono } from "hono"
import type { Context } from "hono"
import { serve } from "qn:http"
import { build } from "qn:bundle"
import { getMimeType } from "hono/utils/mime"
import { readFileSync, existsSync, watch } from "node:fs"

const dev = process.argv.includes("--dev")

async function rebuild() {
	await build({
		entrypoints: ["src/main.tsx"],
		outdir: "dist",
		format: "esm",
		target: "browser",
	})
}
await rebuild()
if (dev) {
	const watcher = watch("src", { recursive: true }, rebuild)
	process.on("SIGINT", () => { watcher.close(); process.exit() })
}

const app = new Hono()
app.get("/api/hello", (c: Context) => c.json({ message: "hello" }))
app.get("/*", (c: Context) => {
	const p = c.req.path === "/" ? "/index.html" : c.req.path
	for (const root of ["./public", "./dist"]) {
		const f = root + p
		if (existsSync(f)) return c.body(readFileSync(f), { headers: { "content-type": getMimeType(f) ?? "application/octet-stream" } })
	}
	return c.notFound()
})

serve({ port: 3000 }, app.fetch)
console.log("http://localhost:3000")
