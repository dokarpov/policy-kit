# Changelog

## v0.3.0 — 2026-10-09 · Batch 3

### Demo
- `demo/server.mjs` — zero-dep HTTP server (playground + API)
- `demo/playground.html` — scenario buttons + live pipeline
- `demo/scenarios.json` — 6 preset product scenarios
- `Dockerfile` + `docker-compose.yml`
- `npm run demo` / `npm start`

### API endpoints
- `GET /api/health|scenarios|report`
- `POST /api/pipeline|decide|approve`

### Unchanged
- Core policy API and failure-class evals from v0.2
- POLICY_VERSION stamp → `0.3.0`

## v0.2.0 — Batch 2
- Failure-class taxonomy, 16 cases, EVAL_REPORT

## v0.1.0 — Batch 1
- decide + approve + pipeline + playground file
