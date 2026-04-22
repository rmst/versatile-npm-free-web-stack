// install.js - Install dependencies directly from git at pinned commits.
// Prerequisites: git, node, esbuild on PATH.

import { execSync } from "node:child_process"
import { mkdirSync, readFileSync, existsSync, globSync } from "node:fs"

[
	{
		name: "preact",
		repo: "https://github.com/preactjs/preact",
		hash: "21dd6d04c1a9a43e5b60976bb5eb7d856253195b",
		// preact's exports rename and nest (dist/preact.mjs, compat/dist/compat.mjs, ...) so the default build doesn't fit.
		build: () => `
			esbuild ./src --bundle --format=esm --outfile=dist/preact.mjs &&
			esbuild ./compat/src --bundle --format=esm --outfile=compat/dist/compat.mjs --external:preact --external:preact/* &&
			esbuild ./jsx-runtime/src --bundle --format=esm --outfile=jsx-runtime/dist/jsxRuntime.mjs --external:preact &&
			esbuild ./hooks/src --bundle --format=esm --outfile=hooks/dist/hooks.mjs --external:preact
		`,
	},
	{
		name: "hono",
		repo: "https://github.com/honojs/hono",
		hash: "cf2d2b7edcf07adef2db7614557f4d7f9e2be7ba",
		build,
	},
	{
		name: "@hono/node-server",
		repo: "https://github.com/honojs/node-server",
		hash: "b5e63a366d9b0ef62ac65fcafd7f69b383b03ff5",
		build,
	},
	{
		name: "tailpipe",
		repo: "https://github.com/rmst/tailpipe",
		hash: "58ca7e91ab7110c6b25ee9fa4761e8687f549e3f",
		// no build step necessary
	},

].map(({ name, repo, hash, build }) => {
	const dir = `node_modules/${name}`
	mkdirSync(dir, { recursive: true })
	execSync(
		`git init -q && git fetch -q --depth 1 ${repo} ${hash} && git checkout -q FETCH_HEAD`,
		{ cwd: dir, stdio: "inherit" },
	)
	if (build) execSync(build(dir), { cwd: dir, stdio: "inherit" })
})


// Default build for tree-mirrored packages (src/X.ts <-> dist/X.{js,mjs}):
// derives entries from package.json's `exports` map
function build(dir) {
	const exp = JSON.parse(readFileSync(`${dir}/package.json`, "utf8")).exports
	const paths = [...new Set((JSON.stringify(exp).match(/"\.\/dist\/[^"]+\.m?js"/g) ?? []).map(p => p.slice(1, -1)))]
	const entries = paths
		.map(p => p.replace("./dist/", "src/").replace(/\.m?js$/, ".ts"))
		.flatMap(s => s.includes("*")
			? globSync(s, { cwd: dir }).filter(p => !p.endsWith(".test.ts"))
			: existsSync(`${dir}/${s}`) ? [s] : [])
		.join(" ")
	const mjs = paths.some(p => p.endsWith(".mjs"))
	return `esbuild ${entries} --outbase=src --outdir=dist --format=esm --platform=node --bundle${mjs ? " --out-extension:.js=.mjs" : ""}`
}
