# ═══════════════════════════════════════════════════════════════
#  Rede de Embaixadores — Makefile
#  Atalhos para Docker Compose
# ═══════════════════════════════════════════════════════════════

.PHONY: up down logs restart reset-db db-shell api-shell status

# Subir tudo (build + start em background)
up:
	docker compose up -d --build

# Parar tudo
down:
	docker compose down

# Ver logs do backend (follow mode)
logs:
	docker compose logs -f api

# Ver logs do banco
logs-db:
	docker compose logs -f db

# Reiniciar backend (útil se alterar requirements.txt)
restart:
	docker compose restart api

# Rebuild completo do backend (após alterar requirements.txt ou Dockerfile)
rebuild:
	docker compose up -d --build api

# Abrir shell no PostgreSQL
db-shell:
	docker compose exec db psql -U postgres -d embaixadores

# Abrir shell no container do backend
api-shell:
	docker compose exec api bash

# Resetar banco (apaga volume e recria do zero com migrations)
reset-db:
	docker compose down -v
	docker compose up -d --build

# Status dos containers
status:
	docker compose ps
