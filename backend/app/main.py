import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.scheduler import start_scheduler, stop_scheduler
from app.services.collector_orchestrator import seed_initial_sources_if_empty

from app.api.dashboard import router as dashboard_router
from app.api.articles import router as articles_router
from app.api.reports import router as reports_router
from app.api.models_tracker import router as models_router
from app.api.research import router as research_router
from app.api.sources import router as sources_router
from app.api.settings import router as settings_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_radar")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database Tables
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed initial sources
    db = SessionLocal()
    try:
        seed_initial_sources_if_empty(db)
    finally:
        db.close()

    # Start APScheduler (15m collector + 7 AM IST daily brief)
    logger.info("Starting background scheduler...")
    start_scheduler()
    
    yield
    
    # Shutdown
    logger.info("Shutting down background scheduler...")
    stop_scheduler()

app = FastAPI(
    title="AI Intelligence Radar API",
    description="Real-Time AI News Intelligence Platform backend engine with automated collection, Gemini synthesis, and daily brief scheduling.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(dashboard_router)
app.include_router(articles_router)
app.include_router(reports_router)
app.include_router(models_router)
app.include_router(research_router)
app.include_router(sources_router)
app.include_router(settings_router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "AI Intelligence Radar",
        "version": "1.0.0"
    }
