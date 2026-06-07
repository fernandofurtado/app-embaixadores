"""
═══════════════════════════════════════════════════════════════
  Seed Script — Initial data for Rede de Embaixadores
  PRD §3.1: 5 níveis com limiares configuráveis
  Run: PYTHONPATH=. python src/scripts/seed.py
═══════════════════════════════════════════════════════════════
"""

import asyncio
import sys
import uuid
from pathlib import Path

# Ensure imports work
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import async_session_maker
from src.modules.gamification.models import Badge
from src.modules.missions.models import MissionCategory
from src.modules.users.models import Level, Region


# ═══ PRD §3.1: 5 NÍVEIS ═══
# Limiares: X₂=100, X₃=400, X₄=1000, N=5 (convites)
LEVELS = [
    {
        "name": "Apoiador",
        "slug": "apoiador",
        "description": "Nível inicial. Bem-vindo à rede!",
        "order_index": 1,
        "min_points": 0,
        "max_points": 99,
        "color": "#6B7280",
        "icon_url": "🌱",
        "min_missions_completed": 0,
        "min_referrals_active": 0,
        "requires_approval": False,
    },
    {
        "name": "Mobilizador",
        "slug": "mobilizador",
        "description": "Você está fazendo a diferença! Continue mobilizando.",
        "order_index": 2,
        "min_points": 100,
        "max_points": 399,
        "color": "#3B82F6",
        "icon_url": "⚡",
        "min_missions_completed": 3,
        "min_referrals_active": 0,
        "requires_approval": False,
    },
    {
        "name": "Líder Local",
        "slug": "lider-local",
        "description": "Você é referência na sua região. Lidere pelo exemplo!",
        "order_index": 3,
        "min_points": 400,
        "max_points": 999,
        "color": "#8B5CF6",
        "icon_url": "🔥",
        "min_missions_completed": 10,
        "min_referrals_active": 3,
        "requires_approval": False,
    },
    {
        "name": "Capitão",
        "slug": "capitao",
        "description": "Líder comprovado. Requer aprovação da coordenação.",
        "order_index": 4,
        "min_points": 1000,
        "max_points": 2499,
        "color": "#F59E0B",
        "icon_url": "🏆",
        "min_missions_completed": 25,
        "min_referrals_active": 5,
        "requires_approval": True,  # PRD §3.2: Requer aprovação
    },
    {
        "name": "Embaixador",
        "slug": "embaixador",
        "description": "O mais alto nível de reconhecimento. Você é um verdadeiro embaixador!",
        "order_index": 5,
        "min_points": 2500,
        "max_points": None,
        "color": "#EF4444",
        "icon_url": "👑",
        "min_missions_completed": 50,
        "min_referrals_active": 10,
        "requires_approval": True,  # PRD §3.2: Requer aprovação
    },
]

# ═══ MISSION CATEGORIES ═══
MISSION_CATEGORIES = [
    {"name": "Eventos", "slug": "eventos", "icon": "📅", "color": "#3B82F6", "order_index": 1},
    {"name": "Conteúdo", "slug": "conteudo", "icon": "📱", "color": "#8B5CF6", "order_index": 2},
    {"name": "Convites", "slug": "convites", "icon": "👥", "color": "#10B981", "order_index": 3},
    {"name": "Organização", "slug": "organizacao", "icon": "🏗️", "color": "#F59E0B", "order_index": 4},
    {"name": "Formação", "slug": "formacao", "icon": "📚", "color": "#EF4444", "order_index": 5},
    {"name": "Demandas", "slug": "demandas", "icon": "📋", "color": "#6366F1", "order_index": 6},
]

# ═══ BADGES ═══
BADGES = [
    # Points milestones
    {"name": "Primeiros Passos", "description": "Conquistou seus primeiros 10 pontos", "category": "milestone", "rarity": "common", "criteria_type": "points_threshold", "criteria_value": 10, "icon_url": "🎯"},
    {"name": "Centenário", "description": "Atingiu 100 pontos", "category": "milestone", "rarity": "uncommon", "criteria_type": "points_threshold", "criteria_value": 100, "icon_url": "💯"},
    {"name": "Meio Milhar", "description": "Atingiu 500 pontos", "category": "milestone", "rarity": "rare", "criteria_type": "points_threshold", "criteria_value": 500, "icon_url": "🌟"},
    {"name": "Milhar de Ouro", "description": "Atingiu 1000 pontos", "category": "milestone", "rarity": "epic", "criteria_type": "points_threshold", "criteria_value": 1000, "icon_url": "✨"},
    # Missions
    {"name": "Primeira Missão", "description": "Completou sua primeira missão", "category": "achievement", "rarity": "common", "criteria_type": "missions_completed", "criteria_value": 1, "icon_url": "✅"},
    {"name": "Missão Possível", "description": "Completou 5 missões", "category": "achievement", "rarity": "uncommon", "criteria_type": "missions_completed", "criteria_value": 5, "icon_url": "🎖️"},
    {"name": "Missionário", "description": "Completou 20 missões", "category": "achievement", "rarity": "rare", "criteria_type": "missions_completed", "criteria_value": 20, "icon_url": "🏅"},
    {"name": "Agente Especial", "description": "Completou 50 missões", "category": "achievement", "rarity": "epic", "criteria_type": "missions_completed", "criteria_value": 50, "icon_url": "🦸"},
    # Events
    {"name": "Presente!", "description": "Participou do primeiro evento", "category": "event", "rarity": "common", "criteria_type": "events_attended", "criteria_value": 1, "icon_url": "📍"},
    {"name": "Frequentador", "description": "Participou de 5 eventos", "category": "event", "rarity": "uncommon", "criteria_type": "events_attended", "criteria_value": 5, "icon_url": "🎪"},
    {"name": "VIP", "description": "Participou de 20 eventos", "category": "event", "rarity": "rare", "criteria_type": "events_attended", "criteria_value": 20, "icon_url": "🎫"},
    # Referrals
    {"name": "Recrutador", "description": "Convidou 1 pessoa que se cadastrou", "category": "special", "rarity": "common", "criteria_type": "referrals", "criteria_value": 1, "icon_url": "🤝"},
    {"name": "Multiplicador", "description": "Convidou 5 pessoas que se cadastraram", "category": "special", "rarity": "uncommon", "criteria_type": "referrals", "criteria_value": 5, "icon_url": "🌐"},
    {"name": "Influenciador", "description": "Convidou 20 pessoas que se cadastraram", "category": "special", "rarity": "rare", "criteria_type": "referrals", "criteria_value": 20, "icon_url": "📣"},
]

# ═══ REGIONS (sample) ═══
REGIONS = [
    {"name": "São Paulo - Capital", "slug": "sp-capital", "city": "São Paulo", "state": "SP"},
    {"name": "São Paulo - Interior", "slug": "sp-interior", "city": None, "state": "SP"},
    {"name": "Rio de Janeiro", "slug": "rj-capital", "city": "Rio de Janeiro", "state": "RJ"},
    {"name": "Minas Gerais", "slug": "mg", "city": None, "state": "MG"},
    {"name": "Brasília", "slug": "df", "city": "Brasília", "state": "DF"},
]


async def seed_table(db: AsyncSession, model, items: list[dict], slug_field: str = "slug"):
    """Generic seed — skip if slug already exists."""
    created = 0
    for item_data in items:
        existing = await db.execute(
            select(model).where(getattr(model, slug_field) == item_data[slug_field])
        )
        if existing.scalar_one_or_none():
            print(f"  ⏭️  {model.__tablename__}: '{item_data[slug_field]}' já existe, pulando")
            continue

        obj = model(**item_data)
        db.add(obj)
        created += 1

    if created:
        await db.flush()
    print(f"  ✅ {model.__tablename__}: {created} registros criados")
    return created


async def seed_badges(db: AsyncSession, badges: list[dict]):
    """Seed badges using name as unique key."""
    created = 0
    for badge_data in badges:
        existing = await db.execute(
            select(Badge).where(Badge.name == badge_data["name"])
        )
        if existing.scalar_one_or_none():
            print(f"  ⏭️  badges: '{badge_data['name']}' já existe, pulando")
            continue

        badge = Badge(**badge_data)
        db.add(badge)
        created += 1

    if created:
        await db.flush()
    print(f"  ✅ badges: {created} registros criados")
    return created


async def run_seed():
    """Execute all seeds."""
    print("\n🌱 Iniciando seed do banco de dados...\n")

    async with async_session_maker() as db:
        async with db.begin():
            # 1. Levels
            print("📊 Níveis de Gamificação (PRD §3.1):")
            await seed_table(db, Level, LEVELS)

            # 2. Mission Categories
            print("\n📁 Categorias de Missão:")
            await seed_table(db, MissionCategory, MISSION_CATEGORIES)

            # 3. Badges
            print("\n🏅 Badges:")
            await seed_badges(db, BADGES)

            # 4. Regions
            print("\n🗺️  Regiões:")
            await seed_table(db, Region, REGIONS)

    print("\n✅ Seed completo!\n")


if __name__ == "__main__":
    asyncio.run(run_seed())
