#!/usr/bin/env python3
import asyncio
import sys
import os
sys.path.append('/app/backend')

from scraper_engine import ScraperEngine
from google_maps_scraper import GoogleMapsScraper

async def test_scraper():
    try:
        print("Initializing scraper engine...")
        engine = ScraperEngine()
        await engine.initialize()
        print("✅ Scraper engine initialized successfully")
        
        print("Testing Google Maps scraper...")
        scraper = GoogleMapsScraper(engine)
        
        input_data = {
            "search_terms": ["coffee shop"],
            "location": "San Francisco, CA",
            "max_results": 2,
            "extract_reviews": False,
            "extract_images": False
        }
        
        async def progress_callback(message):
            print(f"Progress: {message}")
        
        results = await scraper.scrape(input_data, progress_callback)
        print(f"✅ Scraping completed! Found {len(results)} results")
        
        if results:
            print("Sample result:", results[0])
        
        await engine.cleanup()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_scraper())