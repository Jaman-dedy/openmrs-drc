# ─────────────────────────────────────────────────────────────────────────────
# PATH DRC — OpenMRS + EMR AI
# Usage: make <target>
#
# COMPOSE      — main file only, no override (pre-built images, no local build)
# COMPOSE_SRC  — main + override, used to build custom services from source
# ─────────────────────────────────────────────────────────────────────────────

COMPOSE     := docker compose -f docker-compose.yml
COMPOSE_SRC := docker compose -f docker-compose.yml -f docker-compose.override.yml
SERVICE     ?= emr-ai

.DEFAULT_GOAL := help

# ── Help ─────────────────────────────────────────────────────────────────────

.PHONY: help
help:
	@echo ""
	@echo "  PATH DRC — EMR + AI Service"
	@echo ""
	@echo "  Start & stop"
	@echo "    make dev          Full stack: pre-built DB/backend + build frontend, gateway, emr-ai  ← use this"
	@echo "    make up           Start all containers using existing images only (no build, fast)"
	@echo "    make down         Stop and remove all containers"
	@echo "    make restart      Restart all containers"
	@echo ""
	@echo "  Rebuild individual service"
	@echo "    make rebuild-ai   Rebuild emr-ai only (after AI backend changes)"
	@echo "    make rebuild-fe   Rebuild frontend only (after UI changes)"
	@echo "    make rebuild-gw   Rebuild gateway only (after nginx config changes)"
	@echo "    make rebuild      Rebuild any service  (SERVICE=emr-ai|frontend|gateway)"
	@echo ""
	@echo "  Observability"
	@echo "    make status       Show running containers and ports"
	@echo "    make logs         Tail logs for all containers"
	@echo "    make logs-ai      Tail emr-ai logs only"
	@echo "    make logs-gw      Tail gateway logs only"
	@echo "    make shell        Open a shell in a container  (SERVICE=emr-ai)"
	@echo ""
	@echo "  Cleanup"
	@echo "    make clean        Stop containers and delete all volumes  ⚠ data loss"
	@echo ""

# ── Start & stop ─────────────────────────────────────────────────────────────

.PHONY: dev
dev:
	@echo "  Starting db and backend with pre-built images..."
	$(COMPOSE) up -d db backend
	@echo "  Building frontend (with AI module injection), gateway, and emr-ai from source..."
	$(COMPOSE_SRC) up --build --no-deps -d frontend gateway emr-ai
	@echo ""
	@echo "  All containers started."
	@echo "  OpenMRS → http://localhost/openmrs/spa"
	@echo "  EMR AI  → http://localhost/openmrs/emr-ai/health"
	@echo ""

.PHONY: up
up:
	$(COMPOSE) up -d
	@echo ""
	@echo "  OpenMRS → http://localhost/openmrs/spa"
	@echo ""

.PHONY: down
down:
	$(COMPOSE) down

.PHONY: restart
restart:
	$(COMPOSE) restart

# ── Rebuild individual services ───────────────────────────────────────────────

.PHONY: rebuild
rebuild:
	$(COMPOSE_SRC) up --build --no-deps -d $(SERVICE)

.PHONY: rebuild-ai
rebuild-ai:
	$(COMPOSE_SRC) up --build --no-deps -d emr-ai

.PHONY: rebuild-fe
rebuild-fe:
	$(COMPOSE_SRC) up --build --no-deps -d frontend

.PHONY: rebuild-gw
rebuild-gw:
	$(COMPOSE_SRC) up --build --no-deps -d gateway

# ── Observability ─────────────────────────────────────────────────────────────

.PHONY: status
status:
	$(COMPOSE) ps

.PHONY: logs
logs:
	$(COMPOSE) logs -f --tail=100

.PHONY: logs-ai
logs-ai:
	$(COMPOSE) logs -f --tail=100 emr-ai

.PHONY: logs-gw
logs-gw:
	$(COMPOSE) logs -f --tail=100 gateway

.PHONY: shell
shell:
	$(COMPOSE) exec $(SERVICE) /bin/bash || $(COMPOSE) exec $(SERVICE) /bin/sh

# ── Cleanup ───────────────────────────────────────────────────────────────────

.PHONY: clean
clean:
	@echo "⚠  This will delete all volumes (database data will be lost)."
	@read -p "   Are you sure? [y/N] " ans && [ "$$ans" = "y" ]
	$(COMPOSE) down -v
