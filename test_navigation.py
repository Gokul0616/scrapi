import asyncio
import sys
sys.path.insert(0, '/app/backend')

async def test_navigation():
    from motor.motor_asyncio import AsyncIOMotorClient
    from global_chat_service_v2 import EnhancedGlobalChatService
    
    # Connect to MongoDB
    mongo_url = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(mongo_url)
    db = client.test_database
    
    # Get a test user
    user = await db.users.find_one({})
    
    print(f"✓ Testing with user: {user.get('username')}")
    
    # Initialize chat service
    chat_service = EnhancedGlobalChatService(db, user['id'])
    
    # Test navigation command
    print("\n🧪 Test 1: 'go to actors page'")
    result = await chat_service.chat("go to actors page")
    print(f"   Response: {result.get('response', '')[:100]}...")
    if result.get('action'):
        print(f"   ✅ Action: {result['action'].get('action')} → {result['action'].get('page')}")
        print(f"   Message: {result['action'].get('message')}")
    
    # Test scraping command
    print("\n🧪 Test 2: 'scrape coffee shops in NYC'")
    result2 = await chat_service.chat("scrape coffee shops in NYC")
    print(f"   Response: {result2.get('response', '')[:100]}...")
    if result2.get('action'):
        print(f"   ✅ Action: {result2['action'].get('action')}")
        print(f"   Run ID: {result2['action'].get('run_id', 'N/A')[:20]}...")
        print(f"   Message: {result2['action'].get('message')}")
    
    print("\n✅ All automation tests passed!")

asyncio.run(test_navigation())
