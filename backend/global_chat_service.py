"""
Global Chat Service for general app assistance using Emergent LLM.
Provides help with app features, scraping questions, and general support.
"""

import os
import logging
from typing import List, Dict
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class GlobalChatService:
    """Service for handling global chat assistance."""
    
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment")
        self.client = OpenAI(api_key=self.api_key)
        self.system_prompt = """You are Scrapi Assistant - a knowledgeable helper for the Scrapi web scraping platform.

**Platform Overview:**
Scrapi is a powerful scraping tool with Actors (scrapers), Runs (scraping jobs), Datasets (results), Proxies, and AI-powered lead engagement.

**Your Role:**
Answer questions about platform features, how to use scrapers, interpret results, and best practices. Keep responses concise and practical.

**Key Capabilities:**
- Google Maps Scraper: Extract business data (name, address, phone, email, ratings, reviews)
- Proxy System: Automatic rotation for reliability
- AI Lead Chat: Get engagement advice for specific businesses (available on Datasets page)
- Export: Download data as JSON or CSV

**Response Style:**
- Brief and direct (2-4 sentences typically)
- If asked "how to", give quick bullet points
- Focus on what the user needs to know NOW
- Avoid lengthy tutorials unless specifically requested
- Reference specific features by their exact names (Actors, Runs, Storage, etc.)

Examples:
❌ "To scrape data using Scrapi, follow these steps: Step 1: Create an account..."
✅ "Go to Actors → Select Google Maps Scraper → Enter search terms and location → Click Start Run. Check Runs page to monitor progress."

Be helpful but concise. Users want quick answers, not manuals."""
    
    async def chat(self, message: str, chat_history: List[Dict[str, str]] = None) -> str:
        """
        Generate a response to user's message.
        
        Args:
            message: User's message
            chat_history: Optional list of previous messages [{"role": "user/assistant", "content": "..."}]
        
        Returns:
            AI assistant's response
        """
        try:
            # Create messages for OpenAI
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": message}
            ]

            # Get response
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=1000,
                temperature=0.7
            )

            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Global chat error: {str(e)}")
            return "I apologize, but I encountered an error. Please try again or contact support if the issue persists."
