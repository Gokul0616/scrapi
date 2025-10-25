from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from models import Actor


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Set Playwright browsers path for containerized environment
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/pw-browsers'

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Scrapi - Web Scraping Platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Import and setup routes
from routes import router as api_routes, set_db
set_db(db)

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Welcome to Scrapi API", "version": "1.0.0"}

# Include the API routes
api_router.include_router(api_routes)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Initialize default actors on startup."""
    # Check if Google Maps Scraper V2 exists
    existing_v2 = await db.actors.find_one({"name": "Google Maps Scraper V2"})
    if not existing_v2:
        # Create default Google Maps scraper V2
        from datetime import datetime, timezone
        actor = Actor(
            user_id="system",
            name="Google Maps Scraper V2",
            description="Extract businesses, places, reviews from Google Maps with powerful scraping engine",
            icon="🗺️",
            category="Maps & Location",
            type="prebuilt",
            is_public=True,
            status="published",
            visibility="public",
            tags=["maps", "google", "business", "leads", "local"],
            author_name="Scrapi",
            author_id="system",
            is_verified=True,
            is_featured=True,
            readme="""# Google Maps Scraper V2

The most comprehensive Google Maps scraper for business data extraction.

## Features
- 🎯 **Accurate Data**: Extract business names, addresses, phone numbers, emails
- ⭐ **Ratings & Reviews**: Get ratings, review counts, and full review text
- 🔗 **Social Media**: Extract all social media links (Facebook, Instagram, Twitter, LinkedIn, YouTube, TikTok)
- 📍 **Location Data**: Precise city/state parsing and Google Maps URLs
- 🚀 **Fast & Reliable**: V3 engine with parallel extraction

## Use Cases
- Lead generation for B2B sales
- Local business directories
- Market research and competitor analysis
- Contact list building

## Output Fields
All results include: business name, address, phone (verified), email, rating, reviews count, category, opening hours, website, social media links, place ID, and more.""",
            input_schema={
                "search_terms": {"type": "array", "description": "List of search terms"},
                "location": {"type": "string", "description": "Location to search in"},
                "max_results": {"type": "integer", "default": 100},
                "extract_reviews": {"type": "boolean", "default": False},
                "extract_images": {"type": "boolean", "default": False}
            }
        )
        doc = actor.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.actors.insert_one(doc)
        logger.info("Created default Google Maps Scraper V2 actor")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()