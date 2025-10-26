# Home Page Runs Display Fix

## Issue
Runs created from the home page (or anywhere) were not showing up in the home page's recent runs section.

## Root Cause
The `/api/runs` endpoint returns a **paginated response object**:
```json
{
  "runs": [...],
  "total": 10,
  "page": 1,
  "limit": 20,
  "total_pages": 1
}
```

But the Home page was treating the response as if it was a direct array and trying to use `.slice()` on it.

## Fixes Applied

### 1. **Fixed API Response Handling** ✅
**Before:**
```javascript
const runs = await runsRes.json();
setRecentRuns(runs.slice(0, 5)); // ❌ Trying to slice object, not array
```

**After:**
```javascript
const runsData = await runsRes.json();
setRecentRuns(runsData.runs || []); // ✅ Extract runs array from response
```

### 2. **Added Proper Query Parameters** ✅
**Before:**
```javascript
fetch(`${BACKEND_URL}/api/runs`, { headers })
```

**After:**
```javascript
fetch(`${BACKEND_URL}/api/runs?limit=5&sort_by=created_at&sort_order=desc`, { headers })
```
- Limits to 5 most recent runs
- Sorts by creation date (newest first)
- More efficient than fetching all and slicing

### 3. **Added Auto-Refresh** ✅
**Before:**
```javascript
useEffect(() => {
  fetchData();
}, []);
```

**After:**
```javascript
useEffect(() => {
  fetchData();
  // Auto-refresh every 5 seconds to show new runs
  const interval = setInterval(fetchData, 5000);
  return () => clearInterval(interval);
}, []);
```
- Automatically updates every 5 seconds
- New runs appear without page refresh
- Cleanup function prevents memory leaks

### 4. **Improved Date Formatting** ✅
**Before:**
```javascript
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString(...);
};
```

**After:**
```javascript
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString(...);
  } catch (error) {
    return '-';
  }
};
```
- Handles null/undefined dates
- Handles invalid dates
- Returns '-' for missing data

### 5. **Added Debug Logging** ✅
```javascript
console.log('Fetched runs data:', runsData); // Debug log
```
- Helps debug if runs aren't showing
- Can be removed in production

## Files Modified

### `/app/frontend/src/pages/Home.js`
**Changes:**
- Line 19-22: Added auto-refresh with 5-second interval
- Line 38-41: Fixed runs API response handling with proper parameters
- Line 42: Added debug logging
- Line 81-95: Improved date formatting with error handling

## Testing

### Test Steps:
1. **Go to Home page** - Should see existing runs
2. **Start a new run** from Actor detail page
3. **Wait 5 seconds** - New run should automatically appear in home page
4. **Check console** - Should see "Fetched runs data" logs
5. **Verify data**:
   - Status badges show correct colors
   - Dates are formatted properly
   - Duration shows correctly
   - Click on run navigates to dataset page

### Expected Behavior:
- ✅ Home page shows last 5 runs sorted by newest first
- ✅ New runs appear automatically every 5 seconds
- ✅ All run details display correctly (status, dates, duration, results count)
- ✅ No errors in console
- ✅ Clicking a run navigates to its dataset page

## API Response Format Reference

```javascript
// GET /api/runs?limit=5&sort_by=created_at&sort_order=desc
{
  "runs": [
    {
      "id": "run-uuid-here",
      "user_id": "user-uuid",
      "actor_id": "actor-uuid",
      "status": "succeeded",  // 'queued' | 'running' | 'succeeded' | 'failed' | 'aborted'
      "results_count": 10,
      "duration": 45000,  // milliseconds
      "created_at": "2025-01-15T10:30:00",
      "started_at": "2025-01-15T10:30:05",
      "finished_at": "2025-01-15T10:30:50",
      "input_data": {...},
      ...
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 5,
  "total_pages": 5
}
```

## Summary

✅ **Fixed**: Runs now show correctly in home page  
✅ **Auto-refresh**: New runs appear every 5 seconds  
✅ **Better error handling**: No crashes on missing data  
✅ **Optimized**: Only fetch 5 runs instead of all  
✅ **Debugging**: Added console logs for troubleshooting
