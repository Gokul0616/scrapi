"""
Scraper Templates - Pre-configured scraper templates for quick creation
"""

SCRAPER_TEMPLATES = {
    "google_maps": {
        "name": "Google Maps Scraper",
        "description": "Extract business listings from Google Maps with details like name, address, phone, rating, reviews, and more",
        "icon": "🗺️",
        "category": "Maps & Location",
        "template_type": "google_maps",
        "input_schema": {
            "title": "Google Maps Scraper Configuration",
            "type": "object",
            "schemaVersion": 1,
            "properties": {
                "search_terms": {
                    "title": "Search Terms",
                    "type": "array",
                    "description": "What to search for (e.g., 'coffee shops', 'restaurants')",
                    "editor": "stringList",
                    "items": {
                        "type": "string"
                    },
                    "minItems": 1
                },
                "location": {
                    "title": "Location",
                    "type": "string",
                    "description": "City, state, or country (e.g., 'New York, NY')",
                    "editor": "textfield"
                },
                "max_results": {
                    "title": "Maximum Results",
                    "type": "integer",
                    "description": "How many results to scrape",
                    "default": 50,
                    "minimum": 1,
                    "maximum": 500
                },
                "extract_reviews": {
                    "title": "Extract Reviews",
                    "type": "boolean",
                    "description": "Extract customer reviews",
                    "default": False
                },
                "extract_images": {
                    "title": "Extract Images",
                    "type": "boolean",
                    "description": "Extract business images",
                    "default": False
                }
            },
            "required": ["search_terms", "location"]
        },
        "readme": """# Google Maps Scraper

Extract comprehensive business data from Google Maps including:
- Business name and category
- Complete address with city/state parsing
- Phone numbers (verified)
- Email addresses (from websites)
- Ratings and review counts
- Opening hours
- Website URLs
- Social media links (Facebook, Instagram, Twitter, LinkedIn, YouTube, TikTok)
- Google Maps URL and Place ID

## Use Cases
- Lead generation for B2B sales
- Competitor analysis
- Market research
- Local business directories
- Contact list building

## Output Format
JSON/CSV with all extracted fields ready for export."""
    },
    
    "linkedin_profile": {
        "name": "LinkedIn Profile Scraper",
        "description": "Extract professional profiles from LinkedIn including experience, education, skills, and contact info",
        "icon": "💼",
        "category": "Social Media",
        "template_type": "linkedin",
        "input_schema": {
            "title": "LinkedIn Profile Scraper Configuration",
            "type": "object",
            "schemaVersion": 1,
            "properties": {
                "profile_urls": {
                    "title": "Profile URLs",
                    "type": "array",
                    "description": "List of LinkedIn profile URLs to scrape",
                    "editor": "stringList",
                    "items": {
                        "type": "string"
                    },
                    "minItems": 1
                },
                "extract_experience": {
                    "title": "Extract Work Experience",
                    "type": "boolean",
                    "default": True
                },
                "extract_education": {
                    "title": "Extract Education",
                    "type": "boolean",
                    "default": True
                },
                "extract_skills": {
                    "title": "Extract Skills",
                    "type": "boolean",
                    "default": True
                }
            },
            "required": ["profile_urls"]
        },
        "readme": """# LinkedIn Profile Scraper

Extract detailed professional information from LinkedIn profiles.

**Note:** This is a template. Implementation requires proper LinkedIn authentication and respecting LinkedIn's Terms of Service.

## Features
- Professional headline and summary
- Work experience history
- Education background
- Skills and endorsements
- Recommendations
- Contact information (when available)

## Compliance
Please ensure you comply with LinkedIn's Terms of Service and applicable data protection laws."""
    },
    
    "ecommerce_product": {
        "name": "E-commerce Product Scraper",
        "description": "Extract product details from e-commerce websites: title, price, images, ratings, reviews, and availability",
        "icon": "🛒",
        "category": "E-commerce",
        "template_type": "ecommerce",
        "input_schema": {
            "title": "E-commerce Product Scraper Configuration",
            "type": "object",
            "schemaVersion": 1,
            "properties": {
                "product_urls": {
                    "title": "Product URLs",
                    "type": "array",
                    "description": "List of product page URLs to scrape",
                    "editor": "stringList",
                    "items": {
                        "type": "string"
                    }
                },
                "category_urls": {
                    "title": "Category URLs",
                    "type": "array",
                    "description": "Category/listing page URLs to scrape all products from",
                    "editor": "stringList",
                    "items": {
                        "type": "string"
                    }
                },
                "max_products": {
                    "title": "Max Products per Category",
                    "type": "integer",
                    "default": 100,
                    "minimum": 1
                },
                "extract_reviews": {
                    "title": "Extract Customer Reviews",
                    "type": "boolean",
                    "default": False
                },
                "extract_specs": {
                    "title": "Extract Product Specifications",
                    "type": "boolean",
                    "default": True
                }
            }
        },
        "readme": """# E-commerce Product Scraper

Universal product scraper for e-commerce websites.

## Extracted Data
- Product title and description
- Current price and original price
- Product images
- Average rating and review count
- Availability status
- SKU and product ID
- Product specifications
- Customer reviews (optional)

## Supported Platforms
Works with most e-commerce platforms including custom stores. May require customization for specific sites."""
    },
    
    "generic_web": {
        "name": "Generic Web Scraper",
        "description": "Extract custom data from any website using CSS selectors and XPath",
        "icon": "🌐",
        "category": "General",
        "template_type": "generic",
        "input_schema": {
            "title": "Generic Web Scraper Configuration",
            "type": "object",
            "schemaVersion": 1,
            "properties": {
                "start_urls": {
                    "title": "Start URLs",
                    "type": "array",
                    "description": "URLs to scrape",
                    "editor": "stringList",
                    "items": {
                        "type": "string"
                    },
                    "minItems": 1
                },
                "page_function": {
                    "title": "Page Function",
                    "type": "string",
                    "description": "Custom JavaScript function to extract data from each page",
                    "editor": "javascript",
                    "prefill": "async function pageFunction(context) {\n    const { page } = context;\n    \n    // Extract data from page\n    const data = await page.evaluate(() => {\n        return {\n            title: document.querySelector('h1')?.textContent,\n            // Add your selectors here\n        };\n    });\n    \n    return data;\n}"
                },
                "max_crawl_depth": {
                    "title": "Max Crawl Depth",
                    "type": "integer",
                    "description": "How many levels deep to crawl links",
                    "default": 1,
                    "minimum": 1,
                    "maximum": 10
                }
            },
            "required": ["start_urls", "page_function"]
        },
        "readme": """# Generic Web Scraper

Flexible scraper for extracting custom data from any website.

## How to Use
1. Provide the URLs you want to scrape
2. Write a JavaScript function to extract the data you need
3. Use CSS selectors or XPath to target specific elements

## Features
- Custom JavaScript execution
- Deep crawling support
- Handles dynamic content
- Respects robots.txt

## Code Example
```javascript
async function pageFunction(context) {
    const { page } = context;
    
    const data = await page.evaluate(() => {
        return {
            title: document.querySelector('h1')?.textContent,
            paragraphs: Array.from(document.querySelectorAll('p'))
                .map(p => p.textContent)
        };
    });
    
    return data;
}
```"""
    },
    
    "api_scraper": {
        "name": "API Scraper",
        "description": "Extract data from REST APIs with authentication, pagination, and rate limiting support",
        "icon": "🔌",
        "category": "API",
        "template_type": "api",
        "input_schema": {
            "title": "API Scraper Configuration",
            "type": "object",
            "schemaVersion": 1,
            "properties": {
                "api_url": {
                    "title": "API Endpoint URL",
                    "type": "string",
                    "description": "The API endpoint to call",
                    "editor": "textfield"
                },
                "http_method": {
                    "title": "HTTP Method",
                    "type": "string",
                    "enum": ["GET", "POST", "PUT", "DELETE"],
                    "default": "GET"
                },
                "headers": {
                    "title": "HTTP Headers",
                    "type": "object",
                    "description": "Custom headers (e.g., Authorization, Content-Type)",
                    "editor": "json",
                    "prefill": "{\n  \"Authorization\": \"Bearer YOUR_TOKEN\",\n  \"Content-Type\": \"application/json\"\n}"
                },
                "query_params": {
                    "title": "Query Parameters",
                    "type": "object",
                    "description": "URL query parameters",
                    "editor": "json"
                },
                "pagination_enabled": {
                    "title": "Enable Pagination",
                    "type": "boolean",
                    "default": False
                },
                "max_pages": {
                    "title": "Max Pages to Fetch",
                    "type": "integer",
                    "default": 10,
                    "minimum": 1
                }
            },
            "required": ["api_url"]
        },
        "readme": """# API Scraper

Extract data from REST APIs efficiently.

## Features
- Support for all HTTP methods (GET, POST, PUT, DELETE)
- Custom headers and authentication
- Automatic pagination handling
- Rate limiting support
- Response transformation

## Use Cases
- Third-party API data extraction
- Webhook data collection
- API monitoring and testing
- Data aggregation from multiple APIs

## Authentication
Supports various authentication methods:
- Bearer tokens
- API keys
- Basic authentication
- Custom headers"""
    },
    
    "social_media_instagram": {
        "name": "Instagram Profile Scraper",
        "description": "Extract posts, followers, engagement data from Instagram profiles (public accounts)",
        "icon": "📸",
        "category": "Social Media",
        "template_type": "instagram",
        "input_schema": {
            "title": "Instagram Scraper Configuration",
            "type": "object",
            "schemaVersion": 1,
            "properties": {
                "usernames": {
                    "title": "Instagram Usernames",
                    "type": "array",
                    "description": "List of Instagram usernames to scrape (without @)",
                    "editor": "stringList",
                    "items": {
                        "type": "string"
                    }
                },
                "extract_posts": {
                    "title": "Extract Recent Posts",
                    "type": "boolean",
                    "default": True
                },
                "max_posts": {
                    "title": "Max Posts per Profile",
                    "type": "integer",
                    "default": 50,
                    "minimum": 1,
                    "maximum": 500
                },
                "extract_comments": {
                    "title": "Extract Comments",
                    "type": "boolean",
                    "default": False
                }
            },
            "required": ["usernames"]
        },
        "readme": """# Instagram Profile Scraper

Extract public Instagram profile data and posts.

## Extracted Data
- Profile information (bio, followers, following)
- Recent posts with captions
- Engagement metrics (likes, comments)
- Post images and videos
- Hashtags and mentions

## Limitations
- Only works with public accounts
- Instagram may rate limit requests
- Respects Instagram's Terms of Service

**Note:** This is a template. Use responsibly and comply with Instagram's policies."""
    }
}


def get_all_templates():
    """Get all available scraper templates"""
    return SCRAPER_TEMPLATES


def get_template(template_type: str):
    """Get a specific template by type"""
    return SCRAPER_TEMPLATES.get(template_type)


def get_template_categories():
    """Get all unique categories from templates"""
    categories = set()
    for template in SCRAPER_TEMPLATES.values():
        categories.add(template['category'])
    return sorted(list(categories))
