// install.js - Realize sourceDependencies declared in package.json.
// Clones each at the pinned commit and builds for Node via esbuild.
// Prerequisites: git, esbuild on PATH.

import { execSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync, existsSync, globSync } from "node:fs"

const { sourceDependencies: deps } = JSON.parse(
	readFileSync("package.json", "utf8"))

Object.entries(deps).map(([name, src]) => {
	const dir = `node_modules/${name}`
	mkdirSync(dir, { recursive: true })
	execSync(
		`git init -q && git fetch -q --depth 1 ${src.git} ${src.rev} && git checkout -q FETCH_HEAD`,
		{ cwd: dir, stdio: "inherit" })

	const pkg = JSON.parse(readFileSync(`${dir}/package.json`, "utf8"))
	if (src.exports) buildExplicit(dir, name, pkg, src.exports)
	else buildDefault(dir, pkg)
})


// Explicit source map: bundle each entry to a derived dist path,
// then rewrite exports to point at the dist files.
function buildExplicit(dir, name, pkg, exp) {
	pkg.exports = Object.fromEntries(Object.entries(exp).map(([key, s]) => {
		const out = s.replace("/src/", "/dist/").replace(/\.[jt]sx?$/, ".mjs")
		execSync(
			`esbuild ${dir}${s.slice(1)} --bundle --format=esm --outfile=${dir}${out.slice(1)} --external:${name} --external:${name}/*`,
			{ stdio: "inherit" })
		return [key, out]
	}))
	writeFileSync(`${dir}/package.json`, JSON.stringify(pkg, null, 2))
}

// Default tree-mirror: ./dist/X.{js,mjs} ↔ ./src/X.ts.
// Derives entries from the cloned package's exports.
function buildDefault(dir, pkg) {
	const paths = [...new Set((JSON.stringify(pkg.exports).match(/"\.\/dist\/[^"]+\.m?js"/g) ?? []).map(p => p.slice(1, -1)))]
	if (paths.length === 0) return
	const entries = paths
		.map(p => p.replace("./dist/", "src/").replace(/\.m?js$/, ".ts"))
		.flatMap(s => s.includes("*")
			? globSync(s, { cwd: dir }).filter(p => !p.endsWith(".test.ts"))
			: existsSync(`${dir}/${s}`) ? [s] : [])
		.join(" ")
	const mjs = paths.some(p => p.endsWith(".mjs"))
	execSync(
		`esbuild ${entries} --outbase=src --outdir=dist --format=esm --platform=node --bundle${mjs ? " --out-extension:.js=.mjs" : ""}`,
		{ cwd: dir, stdio: "inherit" })
}
