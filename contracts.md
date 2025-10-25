# SCRAPI Backend Implementation Contracts

## Overview
Building a production-grade web scraping platform (Apify alternative) with focus on Google Maps scraping.

## Core Requirements
- **FAST & QUICK**: Optimized Playwright scraping with concurrent processing
- **ACCURATE**: Extract all 50+ fields from Google Maps
- **NO DUPLICATES**: Deduplication using Place IDs
- **EXACT COUNT**: If user requests 50 results, deliver exactly 50

---

## 1. API Contracts

### Authentication Endpoints

#### POST /api/auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepass123",
  "organization_name": "My Organization"
}
```
**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "organization_name": "My Organization"
  }
}
```

#### POST /api/auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```
**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "user": {...}
}
```

#### GET /api/auth/me
**Headers:** `Authorization: Bearer <token>`
**Response:** User object

---

### Actor Endpoints

#### GET /api/actors
List all available actors (scrapers)
**Response:**
```json
[
  {
    "id": "google-maps-scraper",
    "name": "Google Maps Scraper V2",
    "description": "Extract businesses, places, reviews from Google Maps",
    "category": "Maps & Location"
  }
]
```

#### GET /api/actors/{actor_id}
Get actor details

#### POST /api/actors/{actor_id}/runs
Start a scraper run
**Request:**
```json
{
  "search_terms": ["restaurant", "coffee shop"],
  "location": "New York, USA",
  "categories": ["Italian restaurant"],
  "max_results": 50,
  "include_reviews": true,
  "include_images": true
}
```
**Response:**
```json
{
  "run_id": "run_abc123",
  "status": "running",
  "started_at": "2024-10-15T10:16:00Z"
}
```

---

### Run Endpoints

#### GET /api/runs
List all runs for current user

#### GET /api/runs/{run_id}
Get run details with status, progress, logs

#### GET /api/runs/{run_id}/dataset
Get scraped data
**Response:**
```json
{
  "count": 50,
  "data": [
    {
      "title": "Central Park Coffee",
      "subtitle": "Coffee shop",
      "category": "Coffee Shop",
      "address": "123 Park Ave, New York, NY",
      "phone": "+1-212-555-0123",
      "website": "https://example.com",
      "rating": 4.5,
      "reviewsCount": 1247,
      "latitude": 40.7829,
      "longitude": -73.9654,
      "placeId": "ChIJXYZ123",
      "url": "https://maps.google.com/...",
      "openingHours": ["Mon-Fri: 7AM-8PM"],
      "priceLevel": "$$",
      "isPermanentlyClosed": false,
      // ... 40+ more fields
    }
  ]
}
```

#### GET /api/runs/{run_id}/export?format=csv|json|excel
Export dataset in specified format

---

## 2. MongoDB Collections

### users
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password_hash: String,
  organization_name: String,
  created_at: DateTime,
  usage: {
    memory: Number,
    total_memory: Number
  }
}
```

### actors
```javascript
{
  _id: String (actor_id),
  name: String,
  description: String,
  icon: String,
  category: String,
  runs_count: Number
}
```

### runs
```javascript
{
  _id: String (run_id),
  user_id: ObjectId,
  actor_id: String,
  status: String (running|succeeded|failed),
  config: Object,
  started_at: DateTime,
  finished_at: DateTime,
  duration: Number,
  results_count: Number,
  cost: Number,
  logs: [String],
  progress: Number (0-100)
}
```

### datasets
```javascript
{
  _id: ObjectId,
  run_id: String,
  data: [Object],
  created_at: DateTime
}
```

---

## 3. Google Maps Scraper Implementation

### Fields to Extract (50+ fields)
**Basic Info:**
- title, subtitle, category, placeId, url, rank, searchString

**Location & Address:**
- address, location (lat/lng), plusCode, neighborhood, street, city, postalCode, state, countryCode

**Contact:**
- phone (formatted/unformatted), website

**Ratings & Reviews:**
- totalScore (rating), reviewsCount, oneStarReviewsCount, twoStarReviewsCount, threeStarReviewsCount, fourStarReviewsCount, fiveStarReviewsCount
- reviews: [{text, date, likes, images, reviewerName, reviewerId, reviewerPhoto, ownerResponse}]

**Operations:**
- openingHours (array by day), priceLevel, isPermanentlyClosed, popularTimes (histogram)

**Media:**
- images (array with URLs/categories), menuUrl, imagesCount

**Additional:**
- additionalInfo (amenities array), tags, isAdvertisement, scrapedAt

### Scraping Strategy (FAST & ACCURATE)
1. **Use Playwright with Chromium** for full browser automation
2. **Scroll & Load**: Auto-scroll Google Maps results to load more places
3. **Concurrent Processing**: Process multiple places simultaneously
4. **Deduplication**: Use `placeId` as unique identifier
5. **Smart Waiting**: Wait for elements but with timeouts to maintain speed
6. **Error Handling**: Retry failed extractions, skip if necessary
7. **Progress Tracking**: Update run status in real-time

### Optimization Techniques
- Use headless browser for speed
- Extract data from DOM directly (no API calls)
- Parallel place detail extraction (up to 5 concurrent)
- Cache location coordinates
- Stop exactly at requested count after deduplication

---

## 4. Frontend Integration Changes

### Replace Mock Data
**Files to update:**
- `AuthContext.js`: Set `USE_MOCK = false`, use actual API
- `Actors.js`: Fetch from `/api/actors`
- `ActorDetail.js`: POST to `/api/actors/{id}/runs`
- `Runs.js`: Fetch from `/api/runs`
- `Dataset.js`: Fetch from `/api/runs/{id}/dataset`

### Remove Mock Files
- Delete or disable `mockData.js`

---

## 5. Background Task Processing

Use FastAPI BackgroundTasks or asyncio for:
- Running scrapers asynchronously
- Updating run status/progress
- Storing results to MongoDB

---

## 6. Export Functionality

Implement converters for:
- **JSON**: Direct export from MongoDB
- **CSV**: Flatten nested objects, use pandas
- **Excel**: Use openpyxl or xlsxwriter

---

## Success Metrics
✅ If user requests 50 results → Deliver exactly 50 unique places
✅ All 50+ fields extracted accurately
✅ Fast scraping (50 results in < 2 minutes)
✅ Zero duplicates (placeId-based deduplication)
✅ Real-time progress updates
✅ Proper error handling and logging
