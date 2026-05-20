.PHONY: dev seed build up down logs restart clean ssl

# ── Local development ────────────────────────────────────────────────────────

dev:
	@echo "Starting infrastructure..."
	cd api && docker-compose up -d postgres redis opensearch
	@echo "Waiting for services..."
	sleep 5
	@echo "Starting API (port 3001)..."
	cd api && npm run start:dev &
	@echo "Starting Web (port 3000)..."
	cd ai-commerce-platform && npm run dev &
	@echo "✅ Dev stack running"
	@echo "  Web:   http://localhost:3000"
	@echo "  API:   http://localhost:3001/api"
	@echo "  Docs:  http://localhost:3001/docs"
	@echo "  Admin: http://localhost:3000/admin"

seed:
	cd api && npm run seed

# ── Production ────────────────────────────────────────────────────────────────

build:
	docker compose -f deploy/docker-compose.production.yml build

up:
	docker compose -f deploy/docker-compose.production.yml up -d

down:
	docker compose -f deploy/docker-compose.production.yml down

restart:
	docker compose -f deploy/docker-compose.production.yml restart api web

logs:
	docker compose -f deploy/docker-compose.production.yml logs -f --tail=100

logs-api:
	docker compose -f deploy/docker-compose.production.yml logs -f api

logs-web:
	docker compose -f deploy/docker-compose.production.yml logs -f web

# ── SSL (first time setup) ────────────────────────────────────────────────────

ssl:
	docker compose -f deploy/docker-compose.production.yml --profile ssl run --rm certbot \
		certonly --webroot --webroot-path=/var/www/certbot \
		--email admin@decidekit.com --agree-tos --no-eff-email \
		-d decidekit.com -d www.decidekit.com -d api.decidekit.com

# ── Cleanup ───────────────────────────────────────────────────────────────────

clean:
	docker compose -f deploy/docker-compose.production.yml down -v
	docker image prune -f

# ── Health ────────────────────────────────────────────────────────────────────

health:
	@curl -s http://localhost:3001/api/health | python3 -m json.tool
