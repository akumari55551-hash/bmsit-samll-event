from fastapi import APIRouter
from app.api.rounds.round1 import router as r1_router
from app.api.rounds.round2 import router as r2_router
from app.api.rounds.round3 import router as r3_router
from app.api.rounds.round4 import router as r4_router
from app.api.rounds.finale import router as finale_router
from app.api.rounds.progression import router as progression_router

api_router = APIRouter()

api_router.include_router(r1_router)
api_router.include_router(r2_router)
api_router.include_router(r3_router)
api_router.include_router(r4_router)
api_router.include_router(finale_router)
api_router.include_router(progression_router)
