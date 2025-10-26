import logging
import os
from typing import Dict, Any, List
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class LeadChatService:
    """Service for AI-powered lead engagement advice using Emergent LLM."""

    def __init__(self):
        # Get Emergent LLM key
        emergent_key = os.getenv('EMERGENT_LLM_KEY')
        
        if not emergent_key:
            raise ValueError("EMERGENT_LLM_KEY not found in environment variables")
        
        self.api_key = emergent_key
        logger.info(f"LeadChatService initialized with Emergent LLM key")
    
    async def get_engagement_advice(
        self,
        lead_data: Dict[str, Any],
        user_message: str,
        chat_history: List[Dict[str, str]] = None
    ) -> str:
        """
        Get AI-powered advice on how to engage with a business lead.
        
        Args:
            lead_data: Business information (name, category, rating, etc.)
            user_message: User's question about the lead
            chat_history: Previous conversation history
        
        Returns:
            AI assistant's response
        """
        try:
            # Build system message with lead context
            system_message = self._build_system_message(lead_data)
            
            # Add conversation history to system message for context
            if chat_history and len(chat_history) > 0:
                system_message += "\n\n**PREVIOUS CONVERSATION (Remember this context):**\n"
                for msg in chat_history:
                    role = "USER" if msg.get('role') == 'user' else "ASSISTANT"
                    content = msg.get('content', '')
                    system_message += f"\n{role}: {content}\n"
                system_message += "\n**CURRENT USER MESSAGE:**"

            # Initialize LlmChat client with unique session per request
            # This prevents session interference and ensures our history management works
            lead_id = lead_data.get('id', 'unknown')
            session_id = f"lead_chat_{lead_id}_{datetime.now().timestamp()}"
            
            chat_client = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")

            # Send message and get response
            user_msg = UserMessage(text=user_message)
            response = await chat_client.send_message(user_msg)
            
            logger.info(f"Generated engagement advice for lead: {lead_data.get('title', 'Unknown')}")
            return response
        
        except Exception as e:
            logger.error(f"Error generating engagement advice: {str(e)}")
            raise Exception(f"Failed to generate advice: {str(e)}")
    
    def _build_system_message(self, lead_data: Dict[str, Any]) -> str:
        """Build system message with lead context."""
        
        # Extract key lead information
        business_name = lead_data.get('title', 'Unknown Business')
        category = lead_data.get('category', 'N/A')
        rating = lead_data.get('rating', 'N/A')
        reviews_count = lead_data.get('reviewsCount', 'N/A')
        address = lead_data.get('address', 'N/A')
        phone = lead_data.get('phone', 'N/A')
        email = lead_data.get('email', 'N/A')
        website = lead_data.get('website', 'N/A')
        
        system_message = f"""You are an expert sales and business development consultant helping with B2B lead engagement.

You're analyzing this specific business lead:

**Business Profile:**
- Name: {business_name}
- Type: {category}
- Rating: {rating} ⭐ ({reviews_count} reviews)
- Location: {address}
- Contact: Phone: {phone} | Email: {email}
- Website: {website}

**Your Expertise:**
Provide personalized, actionable advice for engaging with THIS specific business. Focus on:

1. **Personalized Approach**: Specific talking points based on their business type, rating, and location
2. **Communication Strategy**: Best method to reach them (email, phone call, visit) with reasoning
3. **Value Proposition**: How to position your product/service for their specific needs
4. **Conversation Starters**: Specific opening lines or questions that would resonate
5. **Pain Points**: Industry-specific challenges they likely face that you can address

**Response Style:**
- Keep responses conversational and concise (3-5 sentences unless more detail requested)
- Always reference specific details about THIS business (name, category, rating, location)
- Suggest practical next steps
- If asked for templates, create personalized ones using their actual business info
- Be direct and actionable, not generic

Example: Instead of "businesses in this category..." say "For {business_name}, a {category} business with {rating} stars..."

Help the user craft a winning approach to engage with {business_name}."""
        
        return system_message
    
    async def generate_outreach_template(self, lead_data: Dict[str, Any], channel: str = "email") -> str:
        """
        Generate a personalized outreach template.

        Args:
            lead_data: Business information
            channel: Communication channel (email, phone, linkedin)

        Returns:
            Personalized outreach template
        """
        try:
            system_message = self._build_system_message(lead_data)

            prompt = f"Create a personalized {channel} outreach template for this business. Make it professional, concise, and focused on value. Include placeholders for customization."

            # Initialize LlmChat client
            lead_id = lead_data.get('id', 'unknown')
            session_id = f"lead_template_{lead_id}_{channel}"
            
            chat_client = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")

            # Send message and get response
            user_msg = UserMessage(text=prompt)
            response = await chat_client.send_message(user_msg)
            
            logger.info(f"Generated {channel} template for lead: {lead_data.get('title', 'Unknown')}")
            return response
        
        except Exception as e:
            logger.error(f"Error generating outreach template: {str(e)}")
            raise Exception(f"Failed to generate template: {str(e)}")
