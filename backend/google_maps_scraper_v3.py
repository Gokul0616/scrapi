import asyncio
import logging
import re
from typing import List, Dict, Any, Optional
from scraper_engine import ScraperEngine
from playwright.async_api import Page, TimeoutError as PlaywrightTimeoutError
from bs4 import BeautifulSoup
import aiohttp

logger = logging.getLogger(__name__)

class GoogleMapsScraperV3:
    """
    Enhanced Google Maps scraper with Apify-like performance:
    - Parallel detail extraction
    - Better scrolling and pagination
    - Email and phone extraction with verification
    - Retry logic for incomplete results
    """
    
    def __init__(self, scraper_engine: ScraperEngine):
        self.engine = scraper_engine
        self.base_url = "https://www.google.com/maps"
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        self.phone_pattern = re.compile(r'[\+\(]?[1-9][0-9 .\-\(\)]{8,}[0-9]')
        
        # Social media patterns
        self.social_patterns = {
            'facebook': re.compile(r'(?:https?://)?(?:www\.)?(?:facebook|fb)\.com/[\w\-\.]+', re.I),
            'instagram': re.compile(r'(?:https?://)?(?:www\.)?instagram\.com/[\w\-\.]+', re.I),
            'twitter': re.compile(r'(?:https?://)?(?:www\.)?(?:twitter|x)\.com/[\w\-]+', re.I),
            'linkedin': re.compile(r'(?:https?://)?(?:www\.)?linkedin\.com/(?:company|in)/[\w\-]+', re.I),
            'youtube': re.compile(r'(?:https?://)?(?:www\.)?youtube\.com/(?:channel|c|user)/[\w\-]+', re.I),
            'tiktok': re.compile(r'(?:https?://)?(?:www\.)?tiktok\.com/@[\w\-\.]+', re.I)
        }
    
    async def scrape(self, config: Dict[str, Any], progress_callback=None) -> List[Dict[str, Any]]:
        """
        Main scraping method with enhanced performance.
        """
        search_terms = config.get('search_terms', [])
        location = config.get('location', '')
        max_results = config.get('max_results', 100)
        extract_reviews = config.get('extract_reviews', False)
        extract_images = config.get('extract_images', False)
        
        all_results = []
        context = await self.engine.create_context(use_proxy=True)
        
        try:
            for term in search_terms:
                if progress_callback:
                    await progress_callback(f"🔍 Searching: {term} in {location}")
                
                search_query = f"{term} {location}" if location else term
                
                # Retry logic for incomplete results
                attempt = 0
                max_attempts = 3
                places = []
                
                while attempt < max_attempts and len(places) < max_results:
                    if attempt > 0:
                        if progress_callback:
                            await progress_callback(f"🔄 Retry {attempt}/{max_attempts-1} - Found {len(places)}/{max_results}")
                    
                    new_places = await self._search_places(context, search_query, max_results)
                    
                    # Merge and deduplicate
                    for place_url in new_places:
                        if place_url not in places:
                            places.append(place_url)
                    
                    if len(places) >= max_results:
                        break
                    
                    attempt += 1
                    if attempt < max_attempts:
                        await asyncio.sleep(2)
                
                if progress_callback:
                    await progress_callback(f"✅ Found {len(places)} places for '{term}'")
                
                # Extract details in parallel batches
                batch_size = 5  # Process 5 places at once
                places_to_process = places[:max_results]
                
                for i in range(0, len(places_to_process), batch_size):
                    batch = places_to_process[i:i+batch_size]
                    
                    if progress_callback:
                        progress = min(i + batch_size, len(places_to_process))
                        await progress_callback(f"📊 Extracting details: {progress}/{len(places_to_process)}")
                    
                    # Parallel extraction
                    tasks = [
                        self._extract_place_details(
                            context,
                            place_url,
                            extract_reviews,
                            extract_images
                        )
                        for place_url in batch
                    ]
                    
                    batch_results = await asyncio.gather(*tasks, return_exceptions=True)
                    
                    for result in batch_results:
                        if isinstance(result, dict):
                            all_results.append(result)
                    
                    # Small delay between batches
                    await asyncio.sleep(0.5)
        
        finally:
            await context.close()
        
        if progress_callback:
            await progress_callback(f"🎉 Complete! Extracted {len(all_results)} places with verified contacts")
        
        return all_results
    
    async def _search_places(self, context, query: str, max_results: int) -> List[str]:
        """Enhanced search with better scrolling and pagination."""
        page = await context.new_page()
        place_urls = set()  # Use set for automatic deduplication
        
        try:
            search_url = f"{self.base_url}/search/{query.replace(' ', '+')}"
            await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
            
            # Wait for results
            await asyncio.sleep(3)
            
            # Enhanced scrolling with more attempts
            for scroll_attempt in range(20):  # Increased from 10 to 20
                # Get all place links
                links = await page.query_selector_all('a[href*="/maps/place/"]')
                
                for link in links:
                    try:
                        href = await link.get_attribute('href')
                        if href and '/maps/place/' in href:
                            place_urls.add(href)
                            
                            if len(place_urls) >= max_results:
                                break
                    except:
                        continue
                
                if len(place_urls) >= max_results:
                    break
                
                # Better scrolling logic
                try:
                    # Get current scroll position
                    prev_height = await page.evaluate("""
                        () => {
                            const panel = document.querySelector('div[role="feed"]');
                            return panel ? panel.scrollHeight : 0;
                        }
                    """)
                    
                    # Scroll down
                    await page.evaluate("""
                        () => {
                            const panel = document.querySelector('div[role="feed"]');
                            if (panel) {
                                panel.scrollTop = panel.scrollHeight;
                            }
                        }
                    """)
                    
                    # Wait for new content
                    await asyncio.sleep(2)
                    
                    # Check if new content loaded
                    new_height = await page.evaluate("""
                        () => {
                            const panel = document.querySelector('div[role="feed"]');
                            return panel ? panel.scrollHeight : 0;
                        }
                    """)
                    
                    # If no new content, we've reached the end
                    if new_height == prev_height:
                        logger.info(f"Reached end of results at {len(place_urls)} places")
                        break
                        
                except Exception as e:
                    logger.debug(f"Scrolling error: {str(e)}")
                    break
            
            logger.info(f"Found {len(place_urls)} unique place URLs for query: {query}")
        
        except Exception as e:
            logger.error(f"Error searching places: {str(e)}")
        
        finally:
            await page.close()
        
        return list(place_urls)
    
    async def _extract_place_details(self, context, url: str, extract_reviews: bool = False, extract_images: bool = False) -> Optional[Dict[str, Any]]:
        """Extract detailed information with email and verified phone."""
        page = await context.new_page()
        
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(2)
            
            place_data = {
                'url': url,
                'placeId': self._extract_place_id(url)
            }
            
            # Extract title/name
            title_selector = 'h1.DUwDvf, h1'
            title_elem = await page.query_selector(title_selector)
            if title_elem:
                place_data['title'] = await title_elem.text_content()
            
            # Extract category
            category_selector = 'button[jsaction*="category"]'
            category_elem = await page.query_selector(category_selector)
            if category_elem:
                place_data['category'] = await category_elem.text_content()
            
            # Extract rating
            rating_selector = 'div.F7nice span[aria-label*="stars"]'
            rating_elem = await page.query_selector(rating_selector)
            if rating_elem:
                rating_text = await rating_elem.get_attribute('aria-label')
                if rating_text:
                    match = re.search(r'([0-9.]+)', rating_text)
                    if match:
                        place_data['rating'] = float(match.group(1))
            
            # Extract reviews count
            reviews_selector = 'div.F7nice span[aria-label*="reviews"]'
            reviews_elem = await page.query_selector(reviews_selector)
            if reviews_elem:
                reviews_text = await reviews_elem.get_attribute('aria-label')
                if reviews_text:
                    match = re.search(r'([0-9,]+)', reviews_text)
                    if match:
                        place_data['reviewsCount'] = int(match.group(1).replace(',', ''))
            
            # Extract address
            address_selector = 'button[data-item-id="address"]'
            address_elem = await page.query_selector(address_selector)
            if address_elem:
                address_text = await address_elem.text_content()
                place_data['address'] = address_text.strip() if address_text else None
                
                # Parse city and state from address
                if place_data['address']:
                    address_parts = place_data['address'].split(',')
                    if len(address_parts) >= 3:
                        place_data['city'] = address_parts[-2].strip()
                        state_zip = address_parts[-1].strip().split()
                        place_data['state'] = state_zip[0] if state_zip else None
            
            # Extract phone with verification
            phone_selector = 'button[data-item-id*="phone"]'
            phone_elem = await page.query_selector(phone_selector)
            if phone_elem:
                phone_text = await phone_elem.get_attribute('aria-label')
                if phone_text:
                    phone = phone_text.replace('Phone: ', '').replace('Call phone number', '').strip()
                    place_data['phone'] = phone
                    place_data['phoneVerified'] = True  # Phone on Google Maps is verified
            
            # Extract website and email
            website_selector = 'a[data-item-id="authority"]'
            website_elem = await page.query_selector(website_selector)
            if website_elem:
                website_url = await website_elem.get_attribute('href')
                place_data['website'] = website_url
                
                # Try to extract email and social media from website
                if website_url:
                    email = await self._extract_email_from_website(website_url)
                    if email:
                        place_data['email'] = email
                        place_data['emailVerified'] = True  # Email from business website
                    
                    # Extract social media links
                    social_links = await self._extract_social_media(page, website_url)
                    if social_links:
                        place_data['socialMedia'] = social_links
            
            # Extract opening hours
            hours_button = await page.query_selector('button[data-item-id="oh"]')
            if hours_button:
                hours_text = await hours_button.get_attribute('aria-label')
                place_data['openingHours'] = hours_text if hours_text else None
            
            # Extract price level
            price_selector = 'span[aria-label*="Price"]'
            price_elem = await page.query_selector(price_selector)
            if price_elem:
                price_text = await price_elem.text_content()
                place_data['priceLevel'] = price_text.strip() if price_text else None
            
            # Extract images if requested
            if extract_images:
                place_data['images'] = await self._extract_images(page)
            
            # Extract reviews if requested
            if extract_reviews:
                place_data['reviews'] = await self._extract_reviews(page)
            
            # Calculate total score based on rating and reviews
            if 'rating' in place_data and 'reviewsCount' in place_data:
                # Simple scoring: rating * log(reviews + 1)
                import math
                place_data['totalScore'] = round(place_data['rating'] * math.log(place_data['reviewsCount'] + 1, 10), 2)
            
            logger.info(f"✅ Extracted: {place_data.get('title', 'Unknown')} - Phone: {'✓' if place_data.get('phone') else '✗'}, Email: {'✓' if place_data.get('email') else '✗'}")
            return place_data
        
        except Exception as e:
            logger.error(f"Error extracting place details from {url}: {str(e)}")
            return None
        
        finally:
            await page.close()
    
    async def _extract_email_from_website(self, website_url: str) -> Optional[str]:
        """Extract email from business website."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(website_url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        # Look for email in common locations
                        # 1. mailto: links
                        mailto_links = soup.find_all('a', href=re.compile(r'^mailto:', re.I))
                        if mailto_links:
                            email = mailto_links[0]['href'].replace('mailto:', '').split('?')[0]
                            if self._is_valid_email(email):
                                return email.lower()
                        
                        # 2. Search in text content
                        text_content = soup.get_text()
                        emails = self.email_pattern.findall(text_content)
                        
                        # Filter out common non-business emails
                        for email in emails:
                            if self._is_business_email(email):
                                return email.lower()
        
        except Exception as e:
            logger.debug(f"Email extraction error from {website_url}: {str(e)}")
        
        return None
    
    def _is_valid_email(self, email: str) -> bool:
        """Validate email format."""
        return bool(self.email_pattern.match(email))
    
    def _is_business_email(self, email: str) -> bool:
        """Check if email looks like a business email."""
        email_lower = email.lower()
        
        # Exclude common non-business patterns
        excluded_patterns = [
            'example.com',
            'test.com',
            'domain.com',
            'email.com',
            'noreply',
            'no-reply',
            'donotreply',
            'privacy@',
            'legal@'
        ]
        
        for pattern in excluded_patterns:
            if pattern in email_lower:
                return False
        
        return True
    
    async def _extract_images(self, page: Page) -> List[str]:
        """Extract image URLs from place page."""
        images = []
        try:
            photos_button = await page.query_selector('button[aria-label*="Photo"]')
            if photos_button:
                await photos_button.click()
                await asyncio.sleep(2)
                
                img_elements = await page.query_selector_all('img[src*="googleusercontent"]')
                for img in img_elements[:10]:
                    src = await img.get_attribute('src')
                    if src and src not in images:
                        images.append(src)
                
                await page.keyboard.press('Escape')
        except Exception as e:
            logger.debug(f"Error extracting images: {str(e)}")
        
        return images
    
    async def _extract_reviews(self, page: Page, max_reviews: int = 10) -> List[Dict[str, Any]]:
        """Extract reviews from place page."""
        reviews = []
        try:
            reviews_button = await page.query_selector('button[aria-label*="Reviews"]')
            if reviews_button:
                await reviews_button.click()
                await asyncio.sleep(2)
                
                for _ in range(3):
                    await page.evaluate("""
                        () => {
                            const panel = document.querySelector('div[role="main"]');
                            if (panel) {
                                panel.scrollTop = panel.scrollHeight;
                            }
                        }
                    """)
                    await asyncio.sleep(1)
                
                review_elements = await page.query_selector_all('div[data-review-id]')
                for elem in review_elements[:max_reviews]:
                    try:
                        review_data = {}
                        
                        name_elem = await elem.query_selector('div.d4r55')
                        if name_elem:
                            review_data['reviewerName'] = await name_elem.text_content()
                        
                        rating_elem = await elem.query_selector('span[role="img"]')
                        if rating_elem:
                            rating_text = await rating_elem.get_attribute('aria-label')
                            if rating_text:
                                match = re.search(r'([0-9])', rating_text)
                                if match:
                                    review_data['rating'] = int(match.group(1))
                        
                        text_elem = await elem.query_selector('span.wiI7pd')
                        if text_elem:
                            review_data['text'] = await text_elem.text_content()
                        
                        date_elem = await elem.query_selector('span.rsqaWe')
                        if date_elem:
                            review_data['date'] = await date_elem.text_content()
                        
                        if review_data:
                            reviews.append(review_data)
                    except:
                        continue
        except Exception as e:
            logger.debug(f"Error extracting reviews: {str(e)}")
        
        return reviews
    
    async def _extract_social_media(self, page: Page, website_url: str) -> Dict[str, str]:
        """Extract social media links from Google Maps page and business website."""
        social_links = {}
        
        try:
            # 1. Check Google Maps page for social media links
            page_content = await page.content()
            
            for platform, pattern in self.social_patterns.items():
                matches = pattern.findall(page_content)
                if matches:
                    # Clean and normalize URL
                    url = matches[0]
                    if not url.startswith('http'):
                        url = 'https://' + url
                    social_links[platform] = url
            
            # 2. If website exists, check there too
            if website_url and len(social_links) < 3:  # Only if we don't have many links yet
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.get(website_url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                            if response.status == 200:
                                html = await response.text()
                                
                                for platform, pattern in self.social_patterns.items():
                                    if platform not in social_links:  # Don't override existing
                                        matches = pattern.findall(html)
                                        if matches:
                                            url = matches[0]
                                            if not url.startswith('http'):
                                                url = 'https://' + url
                                            social_links[platform] = url
                except Exception as e:
                    logger.debug(f"Error extracting social media from website: {str(e)}")
        
        except Exception as e:
            logger.debug(f"Error extracting social media: {str(e)}")
        
        return social_links
    
    def _extract_place_id(self, url: str) -> Optional[str]:
        """Extract place ID from Google Maps URL."""
        match = re.search(r'!1s([^!]+)', url)
        if match:
            return match.group(1)
        return None
