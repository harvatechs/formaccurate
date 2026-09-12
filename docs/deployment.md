# Deployment & Publishing

This covers two different things: **publishing the npm packages** (maintainers) and **deploying
a site that uses `@formaccurate/server` in production** (site operators/consumers).

## Publishing packages (maintainers)

Versioning is handled entirely through [Changesets](https://github.com/changesets/changesets) —
never hand-edit a `package.json` version.

```bash
# while working on a change:
pnpm changeset                 # prompts for affected packages + bump type + summary

# on release:
pnpm changeset version          # consumes pending changesets, bumps versions, updates changelogs
pnpm install                    # refresh lockfile after version bumps
git commit -am "chore: release"
pnpm changeset publish          # publishes each changed package to npm, tags the commit
git push --follow-tags
```

`.github/workflows/release.yml` runs `changeset version` + `changeset publish` automatically on
merges to `main` when unreleased changesets exist, using the standard
[changesets/action](https://github.com/changesets/action). npm publishing uses provenance
(`npm publish --provenance`) so consumers can verify packages were built by this repo's CI, not a
local machine.

### Versioning policy

- Packages follow semver strictly. A change to `docs/spec-protocol.md` or `docs/spec-schema.md`
  that isn't backward compatible is a **major** bump for every package that implements it.
- The form schema spec version (`$schema: ".../v1.json"`) is independent of package versions —
  see `docs/spec-schema.md §Versioning`. Bumping package versions does not imply a spec version
  bump, and vice versa.

## Deploying a site that uses `@formaccurate/server`

`@formaccurate/server` exports a Hono app fragment (`createFormAccurateServer()`), not a
standalone process — it's designed to be mounted inside whatever server the site already runs, or
run standalone for smaller deployments. Because Hono targets the Web Fetch API, the same code
runs on Node, Bun, Deno, Cloudflare Workers, and Vercel Edge Functions with only the entrypoint
adapter changing.

### Standalone Node deployment (Docker)

```dockerfile
# examples/demo-server/Dockerfile
FROM node:20-slim AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

```bash
docker build -t formaccurate-demo .
docker run -p 3000:3000 --env-file .env formaccurate-demo
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | yes | `production` enables the TLS-required check (see `SECURITY.md`) |
| `FORMACCURATE_AUTH_KEYS` | yes | comma-separated static API keys for the reference `AuthProvider`; replace with a real OAuth/OIDC provider for production identity |
| `FORMACCURATE_STORAGE` | yes | `memory` (dev only) or the identifier of a configured persistent adapter |
| `FORMACCURATE_RATE_LIMIT_STORE` | recommended for multi-instance deployments | `memory` (single instance only) or a Redis connection string |
| `FORMACCURATE_WEBHOOK_SECRET` | if webhooks configured | HMAC signing secret for outbound webhook payloads |
| `ALLOW_INSECURE_TRANSPORT` | no | set `true` only behind a TLS-terminating reverse proxy in local/staging setups |

### Edge/serverless deployment

```ts
// entrypoint for Cloudflare Workers / Vercel Edge
import { createFormAccurateServer } from "@formaccurate/server";
import { forms } from "./forms";

export default createFormAccurateServer({ forms, storage: redisAdapter(env.REDIS_URL) });
```

The in-memory storage adapter must **not** be used in any multi-instance or serverless
deployment — state written on one instance won't be visible on another. Implement
`StorageAdapter` (see `docs/architecture.md`) against Redis, Postgres, or your existing
datastore before going to production.

## CI/CD pipeline

`.github/workflows/ci.yml` runs on every PR and push to `main`:

1. `pnpm install --frozen-lockfile`
2. `pnpm build` (Turborepo, dependency-ordered)
3. `pnpm typecheck`
4. `pnpm lint`
5. `pnpm test`
6. `pnpm test:e2e` (Playwright, only when `web`/`server`/`react`/`examples` changed — scoped via
   Turborepo's affected-package filtering to keep CI fast)
7. `pnpm audit --audit-level=high`

`.github/workflows/release.yml` runs only on `main` after CI is green, executing the Changesets
publish flow described above.

## Production checklist (site operators)

- [ ] TLS terminated in front of the server (load balancer, reverse proxy, or platform-managed)
- [ ] Real `AuthProvider` configured — static API keys are a dev convenience, not a production
      identity system
- [ ] Persistent `StorageAdapter` configured — in-memory storage loses all sessions/receipts on
      restart and doesn't work across multiple instances
- [ ] Rate limiter backed by a shared store if running more than one instance
- [ ] Structured logging wired to your log aggregator via the `logSink` option (see
      `docs/debugging.md`)
- [ ] Webhook secret set and webhook consumers verifying the `X-FormAccurate-Signature` header
- [ ] Data retention policy decided and documented for whatever `StorageAdapter` you're using
      (see `SECURITY.md §Data handling`)
- [ ] Health check endpoint (`GET /healthz`, included by `createFormAccurateServer`) wired into
      your platform's readiness/liveness checks
