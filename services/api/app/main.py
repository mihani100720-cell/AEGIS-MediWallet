import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core.config import settings
from .api.v1.router import api_router
from .models.database import init_db
from .models.seed import seed_database

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="MEDIWALLET — Patient-Owned Health Records, Multilingual AI, Offline Emergency QR & Verified Clinical Sharing"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to ensure database tables and clinical seed data exist
@app.on_event("startup")
def on_startup():
    init_db()
    seed_database()

# Include versioned API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "MEDIWALLET Application Server is Active",
        "docs_url": "/docs",
        "health_check": f"{settings.API_V1_STR}/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.api.app.main:app", host="0.0.0.0", port=8000, reload=True)
