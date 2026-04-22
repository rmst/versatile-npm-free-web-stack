// server.ts - Hono server that bundles the frontend on startup.
// Uses bun's built-in HTTP server and bundler — no esbuild, no node-server.

import { Hono, Context } from "hono"
import { serveStatic } from "hono/bun"
import { watch } from "node:fs"

const dev = process.argv.includes("--dev")

async function build() {
	await Bun.build({
		entrypoints: ["./src/main.tsx"],
		outdir: "./dist",
		format: "esm",
		target: "browser",
	})
}
await build()
if (dev) {
	const watcher = watch("src", { recursive: true }, build)
	process.on("SIGINT", () => { watcher.close(); process.exit() })
}

const app = new Hono()
app.get("/api/hello", (c: Context) => c.json({ message: "hello" }))
app.use("/*", serveStatic({ root: "./public" }))
app.use("/*", serveStatic({ root: "./dist" }))

export default { port: 3000, fetch: app.fetch }
