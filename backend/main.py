"""
StudyTube AI — FastAPI Backend
Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routes.api import router
from utils.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 StudyTube AI Backend starting...")
    yield
    print("🛑 StudyTube AI Backend shutting down.")

app = FastAPI(
    title="StudyTube AI",
    description="AI-powered YouTube learning platform API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "StudyTube AI API", "status": "online", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
