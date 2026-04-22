Accompanying repo to [Versatile Npm-Free Web Stack](https://simonramstedt.com/blog/versatile-npm-free-web-stack/).

Three variants of a minimal npm-free stack using Preact, Hono, and Tailpipe, pulled directly from git at pinned commits. Each subdirectory is a working app.

- [`node/`](node/) — Node + esbuild. Needs `git` and `esbuild` on PATH.
- [`bun/`](bun/) — Bun only. No esbuild, no `@hono/node-server`.
- [`qn/`](qn/) — [qn](https://github.com/rmst/qn) + esbuild. Same shape as the Bun variant.

## Quick start

```
cd node/     # or bun/, qn/
npm install  # or bun install
npm start    # or bun start, qn run start
```

The app serves at `http://localhost:3000` (tiny Preact demo at `/`, example API at `/api/hello`).
