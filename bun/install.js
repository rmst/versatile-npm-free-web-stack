// install.js - Realize sourceDependencies declared in package.json.
// Clones each at the pinned commit and points exports at source so bun
// can transpile on load.
// Prerequisites: git, bun.

import { execSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"

const { sourceDependencies: deps } = JSON.parse(
	readFileSync("package.json", "utf8"))

Object.entries(deps).map(([name, src]) => {
	const dir = `node_modules/${name}`
	mkdirSync(dir, { recursive: true })
	execSync(
		`git init -q && git fetch -q --depth 1 ${src.git} ${src.rev} && git checkout -q FETCH_HEAD`,
		{ cwd: dir, stdio: "inherit" })

	const pkg = JSON.parse(readFileSync(`${dir}/package.json`, "utf8"))
	const next = src.exports ?? rewriteToSource(pkg.exports)
	if (!next) return
	pkg.exports = next
	writeFileSync(`${dir}/package.json`, JSON.stringify(pkg, null, 2))
})

// Default tree-mirror: ./dist/X.{js,mjs} -> ./src/X.ts.
function rewriteToSource(exp) {
	const json = JSON.stringify(exp ?? null)
	return json?.includes("/dist/")
		? JSON.parse(json.replace(/"\.\/dist\/([^"]+)\.m?js"/g, '"./src/$1.ts"'))
		: null
}
