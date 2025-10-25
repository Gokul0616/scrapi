import asyncio
import sys
sys.path.insert(0, '/app/backend')

async def test_chat():
    from motor.motor_asyncio import AsyncIOMotorClient
    from global_chat_service_v2 import EnhancedGlobalChatService
    import os
    
    # Connect to MongoDB
    mongo_url = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(mongo_url)
    db = client.test_database
    
    # Get a test user
    user = await db.users.find_one({})
    if not user:
        print("❌ No users found in database")
        return
    
    print(f"✓ Testing with user: {user.get('username')}")
    print(f"✓ User ID: {user.get('id')}")
    
    # Initialize chat service
    chat_service = EnhancedGlobalChatService(db, user['id'])
    
    # Test a simple message
    print("\n🧪 Testing chat with message: 'How many runs do I have?'")
    result = await chat_service.chat("How many runs do I have?")
    
    print(f"\n✅ Chat Response:")
    print(f"   {result.get('response', 'No response')[:200]}...")
    
    if result.get('action'):
        print(f"\n🎯 Action detected: {result['action']}")
    
    print("\n✓ Chat system is working!")

asyncio.run(test_chat())
