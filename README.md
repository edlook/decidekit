# DecideKit — AI Commerce Decision Platform

> Affiliate-powered purchase decision engine. No accounts. Three flows. Explained results.

## Architecture

```
decidekit/
├── ai-commerce-platform/   Next.js 14 frontend (App Router, TypeScript)
├── api/                    NestJS backend (TypeScript, TypeORM)
├── deploy/
│   ├── docker-compose.production.yml
│   ├── nginx/              Reverse proxy + SSL termination
│   ├── github/ci-cd.yml    GitHub Actions CI/CD pipeline
│   └── .env.production.template
└── Makefile                Dev/prod shortcuts
```

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript, TypeORM |
| Database | PostgreSQL 16 |
| Cache / Sessions | Redis 7 |
| Search | OpenSearch 2.12 |
| AI | OpenAI (gpt-4o-mini / gpt-4o) or Anthropic |
| Affiliate | Awin, Rakuten/LinkShare, Impact |
| Analytics | PostHog |
| Infra | Docker, Nginx, GitHub Actions, Let's Encrypt |

## Quick start (local)

```bash
# 1. Clone and install
git clone https://github.com/YOUR_ORG/decidekit
cd decidekit

# 2. Install all deps
cd api && npm install && cd ..
cd ai-commerce-platform && npm install && cd ..

# 3. Configure environment
cp deploy/.env.production.template api/.env
# Edit api/.env — set DB_PASS, OPENAI_API_KEY minimum

cp ai-commerce-platform/.env.example ai-commerce-platform/.env.local

# 4. Start everything
make dev

# 5. Seed database with test products
make seed
```

**URLs:**
- Frontend: http://localhost:3000
- API: http://localhost:3001/api
- Swagger docs: http://localhost:3001/docs
- Admin panel: http://localhost:3000/admin/dashboard
- Health check: http://localhost:3001/api/health

## Production deploy

### First time setup

```bash
# 1. Provision a Linux server (Ubuntu 22.04 recommended, min 4GB RAM)
# 2. Install Docker + Docker Compose
# 3. Copy deploy files to server

scp -r deploy/ user@YOUR_SERVER:/opt/decidekit/

# 4. Configure environment on server
cp /opt/decidekit/.env.production.template /opt/decidekit/.env.production
nano /opt/decidekit/.env.production   # Fill in all secrets

# 5. Get SSL certificate
make ssl

# 6. Start production stack
make up

# 7. Run database migrations and seed
docker exec decidekit_api npm run seed
```

### GitHub Actions CI/CD

Required secrets in your GitHub repo settings:

| Secret | Description |
|---|---|
| `DEPLOY_HOST` | Server IP or hostname |
| `DEPLOY_USER` | SSH username (e.g. ubuntu) |
| `DEPLOY_SSH_KEY` | Private SSH key for server access |
| `NEXT_PUBLIC_API_URL` | https://api.decidekit.com/api |

On every push to `main`:
1. TypeScript check (both projects)
2. Next.js production build
3. Docker images built and pushed to GHCR
4. Zero-downtime rolling deploy to server

## Feed ingestion

```bash
# Trigger via admin panel: http://localhost:3000/admin/ingestion
# Or via API:
curl -X POST http://localhost:3001/api/admin/ingestion/run \
  -H "Content-Type: application/json" \
  -d '{
    "network": "awin",
    "advertiserId": "12345",
    "merchantName": "Amazon UK",
    "dryRun": true
  }'
```

**Pipeline steps:**
1. Fetch feed from affiliate network API
2. Parse XML/CSV/TSV format
3. Normalize: category taxonomy, brand aliases, availability, price/currency
4. Deduplicate within batch (MD5 hash of brand+name+category)
5. Entity matching: EAN → MPN → brand+name → fuzzy ILIKE → create new
6. Upsert offers with staleness tracking
7. Deactivate missing offers

## API reference

### User flows

```
POST /api/builder/intent    Parse intent → clarification questions
POST /api/builder/result    Generate Budget/Balanced/Premium kit

POST /api/dupe/recognize    Identify product from URL or text
POST /api/dupe/alternatives Get alternatives for recognized product

POST /api/battles/pair      Get next comparison pair (or final result)

GET  /api/r/:offerId        Affiliate redirect (log click + 302)
```

### Admin (internal network only in production)

```
GET    /api/admin/stats              Dashboard metrics
GET    /api/admin/offers             Offer moderation queue
DELETE /api/admin/offers/:id         Deactivate offer
POST   /api/admin/offers/:id/approve Approve offer
GET    /api/admin/merchants          Merchant quality panel
PATCH  /api/admin/merchants/:id      Update quality score
POST   /api/admin/ingestion/run      Trigger pipeline
GET    /api/admin/ingestion/jobs     Job history
GET    /api/health                   Health check (all services)
```

## Key design decisions

**No accounts** — anonymous sessions via UUID stored in Redis (24h TTL). Client passes `sessionId` in request body.

**AI is not the source of truth** — AI generates search queries and explanations. Real prices/availability come from affiliate feeds in PostgreSQL.

**OpenSearch with PostgreSQL fallback** — semantic product search via OpenSearch; if unavailable, falls back to ILIKE queries automatically.

**Open redirect protection** — `AffiliateService` whitelists affiliate network domains. Any non-whitelisted URL is blocked before redirect.

**Confidence scoring** — all AI outputs and feed items carry `confidenceScore` (0–1). Low-confidence items are flagged in the UI with `isLowConfidence`.

**Rate limiting** — ThrottlerModule: 10 req/s, 200 req/min. Nginx: 20 req/s API, 5 req/s redirect endpoint.

## MVP scope

Included:
- All 3 user flows (Builder, Dupe/Alt, Battles)
- Awin + Rakuten feed ingestion
- OpenSearch semantic search
- Redis session persistence
- Admin panel (dashboard, moderation, merchants, ingestion)
- PostHog analytics
- Docker production stack
- Nginx + SSL
- GitHub Actions CI/CD

Not included in MVP:
- User accounts / login
- Email notifications
- Mobile native app
- Advanced personalization
- Multi-vertical auto-discovery
