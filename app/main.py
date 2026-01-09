from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.routers import auth, entries, admin
from app.config import settings
from app.services.service_factory import get_service_mode
import os
import logging

logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create local storage directory for development mode
os.makedirs("local_storage", exist_ok=True)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://localhost:8000",  # Backend itself
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        # Add production URLs here when deploying
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(entries.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

# Mount static files for local image storage (development mode)
if settings.USE_MOCK_SERVICES:
    app.mount("/local-images", StaticFiles(directory="local_storage"), name="local-images")
    logger.info("📁 Mounted /local-images for local file storage")

# Startup event
@app.on_event("startup")
async def startup_event():
    """Log service configuration on startup"""
    service_mode = get_service_mode()

    print("\n" + "=" * 60)
    print(f"Milo Campaign API Starting")
    print("=" * 60)
    print(f"Environment: {settings.APP_ENV}")
    print(f"Debug Mode: {settings.DEBUG}")
    print(f"Mock Services: {'ENABLED' if settings.USE_MOCK_SERVICES else 'DISABLED'}")
    print()

    if settings.USE_MOCK_SERVICES or service_mode["image_service"] == "mock" or service_mode["otp_service"] == "mock":
        print("🔧 Development Mode:")
        if service_mode["image_service"] == "mock":
            print("  - Images: Local storage (local_storage/)")
            print("    Access at: http://localhost:8000/local-images/")
        else:
            print("  - Images: Cloudflare R2")

        if service_mode["otp_service"] == "mock":
            print("  - OTP: Console output (check terminal)")
        else:
            print("  - OTP: Text.lk SMS")
    else:
        print("☁️ Production Mode:")
        print("  - Images: Cloudflare R2")
        print("  - OTP: Text.lk SMS")

    print("=" * 60)
    print(f"API Documentation: http://localhost:{settings.API_PORT}/docs")
    print("=" * 60 + "\n")

    logger.info(f"Service mode: {service_mode}")

@app.get("/")
async def root():
    return {
        "message": "Milo Campaign API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
