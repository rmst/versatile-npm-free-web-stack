// dependencies.js - Install dependencies directly from git at pinned commits.
// Prerequisites: git, bun (transpiles .ts in node_modules natively).

import { execSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"

[
	{
		name: "preact",
		repo: "https://github.com/preactjs/preact",
		hash: "21dd6d04c1a9a43e5b60976bb5eb7d856253195b",  // 11.0.0-beta.1
		// preact's source is plain JS with renamed dist entries — override.
		exports: () => ({
			".": "./src/index.js",
			"./compat": "./compat/src/index.js",
			"./hooks": "./hooks/src/index.js",
			"./jsx-runtime": "./jsx-runtime/src/index.js",
			"./jsx-dev-runtime": "./jsx-runtime/src/index.js",
		}),
	},
	{
		name: "hono",
		repo: "https://github.com/honojs/hono",
		hash: "cf2d2b7edcf07adef2db7614557f4d7f9e2be7ba",  // v4.12.14
		exports,
	},
	{
		name: "tailpipe",
		repo: "https://github.com/rmst/tailpipe",
		hash: "58ca7e91ab7110c6b25ee9fa4761e8687f549e3f",  // 0.1.0
		// no rewrite needed — exports already point at src
	},
].map(({ name, repo, hash, exports }) => {
	const dir = `node_modules/${name}`
	mkdirSync(dir, { recursive: true })
	execSync(
		`git init -q && git fetch -q --depth 1 ${repo} ${hash} && git checkout -q FETCH_HEAD`,
		{ cwd: dir, stdio: "inherit" },
	)
	if (exports) {
		const pkg = JSON.parse(readFileSync(`${dir}/package.json`, "utf8"))
		pkg.exports = exports(dir)
		writeFileSync(`${dir}/package.json`, JSON.stringify(pkg, null, 2))
	}
})


// Default exports rewrite for tree-mirrored packages (src/X.ts <-> dist/X.{js,mjs}):
// points the package's exports at source so bun can transpile on load.
function exports(dir) {
	const exp = JSON.parse(readFileSync(`${dir}/package.json`, "utf8")).exports
	return JSON.parse(JSON.stringify(exp).replace(/"\.\/dist\/([^"]+)\.m?js"/g, '"./src/$1.ts"'))
}
