# Base Block Tip — Vercel port

A minimal [x402](https://x402.org)-paid API endpoint, built with [Hono](https://hono.dev) and deployed as a Vercel serverless function.

- `POST /paid` — returns the current Base mainnet block number, timestamp, and block hash, fetched live at call time. Price: **0.005 USDC on Base** (chain `eip155:8453`), settled through the public x402.org facilitator to the payout wallet named in the offer. Unpaid requests get an HTTP `402` with a `PAYMENT-REQUIRED` header carrying the base64 JSON payment offer.
- `GET /` — service summary JSON.
- `GET /openapi.json` — OpenAPI 3.0.3 description of `/paid`, including the `x-payment-info` block.

All paths are rewritten to the single function in `api/index.js` (see `vercel.json`), so the public URL shape is `https://<project>.vercel.app/paid`.

## Deploy

Vercel → New Project → import this repo (no env vars, no build settings to change). Framework preset can stay "Other"; the `api/` function and `vercel.json` rewrites are picked up automatically.

## Layout

- `api/index.js` — the Hono app, exported through the official `hono/vercel` adapter (`GET`/`POST`/etc.).
- `vercel.json` — catch-all rewrite to `/api/index`.
- `package.json` — pins `hono` `^4.13.18`.
- `local-server.mjs` — local test harness only; excluded from deployment via `.vercelignore`.
