from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.models.core import seed_default_teams
from app.models import *  # Ensure all SQLAlchemy models are registered
from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    if settings.AUTO_SEED and settings.ENVIRONMENT != "production":
        db = SessionLocal()
        try:
            seed_default_teams(db)
        finally:
            db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="EVENT HQ Tournament Domain Backend — Person 2 APIs for Rounds 1-4, Grand Finale, Scoring, Progression & Qualification.",
    lifespan=lifespan,
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount tournament routes on both /api and /api/v1 for complete frontend compatibility
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix="/api/v1")

@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME, "version": settings.VERSION}

