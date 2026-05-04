# ─────────────────────────────────────────────────────────────────────────────
# PATH DRC — OpenMRS + EMR AI
# Usage: make <target>
# ─────────────────────────────────────────────────────────────────────────────

COMPOSE        := docker compose
COMPOSE_OVERRIDE := docker compose -f docker-compose.yml -f docker-compose.override.yml
SERVICE        ?= emr-ai

.DEFAULT_GOAL := help

# ── Help ─────────────────────────────────────────────────────────────────────

.PHONY: help
help:
	@echo ""
	@echo "  PATH DRC — EMR + AI Service"
	@echo ""
	@echo "  Start & stop"
	@echo "    make dev          Build all images and start every container (first run / after code changes)"
	@echo "    make up           Start all containers without rebuilding (fast)"
	@echo "    make down         Stop and remove all containers"
	@echo "    make restart      Restart all containers"
	@echo ""
	@echo "  Rebuild individual service"
	@echo "    make rebuild      Rebuild + restart one service  (SERVICE=emr-ai|gateway|frontend|backend)"
	@echo "    make rebuild-ai   Shortcut — rebuild emr-ai only"
	@echo "    make rebuild-gw   Shortcut — rebuild gateway only (nginx config changes)"
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
	$(COMPOSE_OVERRIDE) up --build -d
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
	$(COMPOSE_OVERRIDE) up --build --no-deps -d $(SERVICE)

.PHONY: rebuild-ai
rebuild-ai:
	$(COMPOSE_OVERRIDE) up --build --no-deps -d emr-ai

.PHONY: rebuild-gw
rebuild-gw:
	$(COMPOSE_OVERRIDE) up --build --no-deps -d gateway

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
