"""
Enhanced Global Chat Service with function calling capabilities.
Provides full access to user data and ability to execute actions.
"""

import os
import json
import logging
import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from openai import OpenAI
import litellm
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class EnhancedGlobalChatService:
    """Enhanced service for handling global chat with function calling."""
    
    def __init__(self, db, user_id: str):
        self.db = db
        self.user_id = user_id
        # Try OpenAI first, fallback to Emergent LLM key
        openai_key = os.getenv('OPENAI_API_KEY')
        emergent_key = os.getenv('EMERGENT_LLM_KEY')
        
        if not openai_key and not emergent_key:
            raise ValueError("Neither OPENAI_API_KEY nor EMERGENT_LLM_KEY found in environment")
        
        # Determine which key type we're using
        self.using_openai = bool(openai_key)
        self.api_key = openai_key if self.using_openai else emergent_key
        logger.info(f"EnhancedGlobalChatService initialized with {'OpenAI' if self.using_openai else 'Emergent LLM'} key")
        
        # Use appropriate client
        if self.using_openai:
            self.client = OpenAI(api_key=self.api_key)
            self.use_litellm = False
        else:
            # Use custom OpenAI-compatible endpoint for Emergent key
            self.client = OpenAI(
                api_key=self.api_key,
                base_url="https://llm.emergentmethods.ai/v1"
            )
            self.use_litellm = False  # Use OpenAI client with custom base URL
        
        self.system_prompt = """You are Scrapi AI Agent - an intelligent AI with COMPLETE CONTROL over the Scrapi web scraping platform.

**🤖 YOU ARE A FULL AI AGENT - NOT JUST A CHATBOT**

**Your FULL Automation Capabilities:**
✅ **Navigate** - Go to any page instantly
✅ **Create Scrapers** - Fill forms and start scraping automatically  
✅ **View Results** - Open run details and datasets
✅ **Export Data** - Download scraped data in any format
✅ **Delete/Stop Runs** - Manage scraping jobs
✅ **Complete Access** - Read all user data and stats

**How You Operate:**
When a user gives ANY command, you AUTOMATICALLY execute it:
- "scrape hotels in NYC" → You FILL the form, START the scraper, NAVIGATE to runs - ALL AUTOMATIC
- "show my runs" → You NAVIGATE to runs page instantly
- "export latest data" → You TRIGGER the export automatically
- "open google maps scraper" → You NAVIGATE to actor detail page

**NO CLICKING NEEDED - YOU DO EVERYTHING!**

**Key Functions:**
1. **fill_and_start_scraper** - Automatically fill form + start run (use THIS instead of create_scraping_run for automation)
2. **navigate_to_page** - Go to dashboard, actors, runs, datasets, leads, proxies
3. **view_run_details** - Open specific run's results
4. **open_actor_detail** - Open actor configuration page
5. **export_dataset** - Download data
6. **stop_run** / **delete_run** - Manage runs

**Response Style:**
- Be proactive and take action immediately
- Say what you're DOING: "🤖 Starting scraper...", "📍 Opening Actors page...", "📥 Exporting data..."
- Show automation in action
- Use emojis for visual feedback

**Examples of FULL AUTOMATION:**
User: "scrape restaurants in San Francisco"
You: FUNCTION_CALL: {"name": "fill_and_start_scraper", "arguments": {"actor_name": "Google Maps", "search_terms": ["restaurants"], "location": "San Francisco, CA", "max_results": 20}}

User: "show me my scrapers"
You: FUNCTION_CALL: {"name": "navigate_to_page", "arguments": {"page": "actors"}}

User: "what's in my latest run?"
You: First get recent runs, then navigate to the latest one

**Important:**
- Always TAKE ACTION, don't just explain
- You're an AI AGENT that DOES things, not just talks about them
- User should see things happening automatically
- Be fast, efficient, and autonomous"""

        # Define available functions/tools
        self.functions = [
            {
                "name": "get_user_stats",
                "description": "Get user's account statistics including total runs, success rate, total datasets, and recent activity",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            },
            {
                "name": "list_recent_runs",
                "description": "List user's recent scraping runs with status, actor name, and results",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "limit": {
                            "type": "integer",
                            "description": "Number of recent runs to retrieve (default 10)",
                            "default": 10
                        },
                        "status_filter": {
                            "type": "string",
                            "description": "Filter by status: 'all', 'running', 'succeeded', 'failed'",
                            "default": "all"
                        }
                    },
                    "required": []
                }
            },
            {
                "name": "get_actors",
                "description": "Get list of available scrapers/actors",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            },
            {
                "name": "create_scraping_run",
                "description": "Create and start a new scraping run. Use this when user wants to scrape data.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "actor_name": {
                            "type": "string",
                            "description": "Name of the scraper (e.g., 'Google Maps Scraper')"
                        },
                        "search_terms": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Keywords to search for (e.g., ['Hotels', 'Restaurants'])"
                        },
                        "location": {
                            "type": "string",
                            "description": "Location to search in (e.g., 'New York, NY')"
                        },
                        "max_results": {
                            "type": "integer",
                            "description": "Maximum number of results to scrape",
                            "default": 20
                        }
                    },
                    "required": ["actor_name", "search_terms"]
                }
            },
            {
                "name": "stop_run",
                "description": "Stop/abort a running scraping job",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "run_id": {
                            "type": "string",
                            "description": "ID of the run to stop"
                        }
                    },
                    "required": ["run_id"]
                }
            },
            {
                "name": "delete_run",
                "description": "Delete a scraping run and its data",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "run_id": {
                            "type": "string",
                            "description": "ID of the run to delete"
                        }
                    },
                    "required": ["run_id"]
                }
            },
            {
                "name": "get_dataset_info",
                "description": "Get information about datasets and total scraped items",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            },
            {
                "name": "navigate_to_page",
                "description": "Navigate to a specific page in the application. Use this when user wants to go to or view a specific section.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "page": {
                            "type": "string",
                            "description": "Page to navigate to",
                            "enum": ["dashboard", "actors", "runs", "datasets", "leads", "proxies"]
                        }
                    },
                    "required": ["page"]
                }
            },
            {
                "name": "export_dataset",
                "description": "Export scraped data from a specific run in JSON or CSV format",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "run_id": {
                            "type": "string",
                            "description": "ID of the run to export data from"
                        },
                        "format": {
                            "type": "string",
                            "description": "Export format",
                            "enum": ["json", "csv"],
                            "default": "json"
                        }
                    },
                    "required": ["run_id"]
                }
            },
            {
                "name": "get_page_context",
                "description": "Get information about what the user is currently viewing or their current context",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "current_page": {
                            "type": "string",
                            "description": "Current page the user is on"
                        }
                    },
                    "required": []
                }
            },
            {
                "name": "fill_and_start_scraper",
                "description": "Automatically fill scraper form and start a scraping run. Use this when user wants to scrape something.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "actor_name": {
                            "type": "string",
                            "description": "Name of the scraper actor (e.g., 'Google Maps Scraper')"
                        },
                        "search_terms": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Keywords to search for (e.g., ['Hotels', 'Restaurants'])"
                        },
                        "location": {
                            "type": "string",
                            "description": "Location to search in (e.g., 'New York, NY')"
                        },
                        "max_results": {
                            "type": "integer",
                            "description": "Maximum number of results to scrape",
                            "default": 20
                        },
                        "navigate_to_actor": {
                            "type": "boolean",
                            "description": "Whether to navigate to actor page first",
                            "default": False
                        }
                    },
                    "required": ["actor_name", "search_terms"]
                }
            },
            {
                "name": "view_run_details",
                "description": "Navigate to a specific run's details page to view results",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "run_id": {
                            "type": "string",
                            "description": "ID of the run to view"
                        }
                    },
                    "required": ["run_id"]
                }
            },
            {
                "name": "open_actor_detail",
                "description": "Open actor detail page to configure and run a scraper",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "actor_id": {
                            "type": "string",
                            "description": "ID of the actor to open"
                        },
                        "actor_name": {
                            "type": "string",
                            "description": "Name of the actor (alternative to ID)"
                        }
                    },
                    "required": []
                }
            }
        ]
    
    async def get_user_stats(self) -> Dict[str, Any]:
        """Get user's account statistics."""
        try:
            # Get runs stats
            total_runs = await self.db.runs.count_documents({"user_id": self.user_id})
            succeeded_runs = await self.db.runs.count_documents({
                "user_id": self.user_id,
                "status": "succeeded"
            })
            failed_runs = await self.db.runs.count_documents({
                "user_id": self.user_id,
                "status": "failed"
            })
            running_runs = await self.db.runs.count_documents({
                "user_id": self.user_id,
                "status": "running"
            })
            
            # Get datasets stats
            total_datasets = await self.db.datasets.count_documents({"user_id": self.user_id})
            
            # Get total items only for this user's runs
            # First get all run_ids for this user
            user_runs = await self.db.runs.find(
                {"user_id": self.user_id},
                {"_id": 0, "id": 1}
            ).to_list(1000)
            user_run_ids = [run["id"] for run in user_runs]
            
            # Count items only for this user's runs
            total_items = await self.db.dataset_items.count_documents({
                "run_id": {"$in": user_run_ids}
            }) if user_run_ids else 0
            
            # Calculate success rate
            success_rate = (succeeded_runs / total_runs * 100) if total_runs > 0 else 0
            
            # Get recent activity
            recent_run = await self.db.runs.find_one(
                {"user_id": self.user_id},
                {"_id": 0, "actor_name": 1, "created_at": 1, "status": 1},
                sort=[("created_at", -1)]
            )
            
            return {
                "total_runs": total_runs,
                "succeeded_runs": succeeded_runs,
                "failed_runs": failed_runs,
                "running_runs": running_runs,
                "success_rate": round(success_rate, 1),
                "total_datasets": total_datasets,
                "total_scraped_items": total_items,
                "recent_activity": recent_run
            }
        except Exception as e:
            logger.error(f"Error getting user stats: {str(e)}")
            return {"error": str(e)}
    
    async def list_recent_runs(self, limit: int = 10, status_filter: str = "all") -> Dict[str, Any]:
        """List recent runs."""
        try:
            query = {"user_id": self.user_id}
            if status_filter != "all":
                query["status"] = status_filter
            
            runs = await self.db.runs.find(
                query,
                {"_id": 0, "id": 1, "actor_name": 1, "status": 1, "results_count": 1, 
                 "created_at": 1, "duration_seconds": 1, "input_data": 1}
            ).sort("created_at", -1).limit(limit).to_list(limit)
            
            return {
                "runs": runs,
                "count": len(runs)
            }
        except Exception as e:
            logger.error(f"Error listing runs: {str(e)}")
            return {"error": str(e)}
    
    async def get_actors(self) -> Dict[str, Any]:
        """Get available actors."""
        try:
            actors = await self.db.actors.find(
                {"$or": [{"user_id": self.user_id}, {"is_public": True}]},
                {"_id": 0, "id": 1, "name": 1, "description": 1, "category": 1, "runs_count": 1}
            ).to_list(100)
            
            return {
                "actors": actors,
                "count": len(actors)
            }
        except Exception as e:
            logger.error(f"Error getting actors: {str(e)}")
            return {"error": str(e)}
    
    async def create_scraping_run(self, actor_name: str, search_terms: List[str], 
                                   location: str = None, max_results: int = 20) -> Dict[str, Any]:
        """Create a new scraping run."""
        try:
            # Find actor by name (case-insensitive)
            actor = await self.db.actors.find_one(
                {
                    "$or": [{"user_id": self.user_id}, {"is_public": True}],
                    "name": {"$regex": actor_name, "$options": "i"}
                },
                {"_id": 0}
            )
            
            if not actor:
                return {"error": f"Actor '{actor_name}' not found"}
            
            # Create run
            run_id = str(__import__('uuid').uuid4())
            run_doc = {
                "id": run_id,
                "user_id": self.user_id,
                "actor_id": actor["id"],
                "actor_name": actor["name"],
                "status": "queued",
                "input_data": {
                    "search_terms": search_terms,
                    "location": location,
                    "max_results": max_results
                },
                "started_at": None,
                "finished_at": None,
                "duration_seconds": None,
                "results_count": 0,
                "dataset_id": None,
                "error_message": None,
                "logs": [],
                "cost": 0.0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await self.db.runs.insert_one(run_doc)
            
            # Update actor run count
            await self.db.actors.update_one(
                {"id": actor["id"]},
                {"$inc": {"runs_count": 1}}
            )
            
            # Note: Actual background execution would be triggered by the API endpoint
            return {
                "success": True,
                "run_id": run_id,
                "actor_name": actor["name"],
                "message": f"Scraping run created successfully! Run ID: {run_id}"
            }
        except Exception as e:
            logger.error(f"Error creating run: {str(e)}")
            return {"error": str(e)}
    
    async def stop_run(self, run_id: str) -> Dict[str, Any]:
        """Stop a running scraping job."""
        try:
            result = await self.db.runs.update_one(
                {"id": run_id, "user_id": self.user_id, "status": "running"},
                {"$set": {"status": "aborted", "finished_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            if result.modified_count > 0:
                return {"success": True, "message": f"Run {run_id} stopped successfully"}
            else:
                return {"error": "Run not found or not running"}
        except Exception as e:
            logger.error(f"Error stopping run: {str(e)}")
            return {"error": str(e)}
    
    async def delete_run(self, run_id: str) -> Dict[str, Any]:
        """Delete a run."""
        try:
            # Delete run
            result = await self.db.runs.delete_one({"id": run_id, "user_id": self.user_id})
            
            if result.deleted_count > 0:
                # Also delete associated dataset items
                await self.db.dataset_items.delete_many({"run_id": run_id})
                return {"success": True, "message": f"Run {run_id} deleted successfully"}
            else:
                return {"error": "Run not found"}
        except Exception as e:
            logger.error(f"Error deleting run: {str(e)}")
            return {"error": str(e)}
    
    async def get_dataset_info(self) -> Dict[str, Any]:
        """Get dataset information."""
        try:
            total_datasets = await self.db.datasets.count_documents({"user_id": self.user_id})
            
            # Get items count per dataset
            pipeline = [
                {"$match": {"user_id": self.user_id}},
                {"$lookup": {
                    "from": "dataset_items",
                    "localField": "run_id",
                    "foreignField": "run_id",
                    "as": "items"
                }},
                {"$project": {
                    "_id": 0,
                    "run_id": 1,
                    "item_count": {"$size": "$items"}
                }}
            ]
            
            datasets = await self.db.datasets.aggregate(pipeline).to_list(100)
            total_items = sum(d.get("item_count", 0) for d in datasets)
            
            return {
                "total_datasets": total_datasets,
                "total_items": total_items,
                "datasets": datasets[:5]  # Return first 5 for context
            }
        except Exception as e:
            logger.error(f"Error getting dataset info: {str(e)}")
            return {"error": str(e)}
    
    async def navigate_to_page(self, page: str) -> Dict[str, Any]:
        """Navigate to a specific page - returns command for frontend to execute."""
        try:
            valid_pages = ["dashboard", "actors", "runs", "datasets", "leads", "proxies"]
            if page not in valid_pages:
                return {"error": f"Invalid page. Valid pages: {', '.join(valid_pages)}"}
            
            return {
                "success": True,
                "action": "navigate",
                "page": page,
                "message": f"Opening {page.capitalize()} page..."
            }
        except Exception as e:
            logger.error(f"Error navigating to page: {str(e)}")
            return {"error": str(e)}
    
    async def export_dataset(self, run_id: str, format: str = "json") -> Dict[str, Any]:
        """Export dataset - returns command for frontend to execute."""
        try:
            # Verify the run exists and belongs to user
            run = await self.db.runs.find_one(
                {"id": run_id, "user_id": self.user_id},
                {"_id": 0, "id": 1, "actor_name": 1, "results_count": 1}
            )
            
            if not run:
                return {"error": "Run not found or you don't have access to it"}
            
            if run.get("results_count", 0) == 0:
                return {"error": "This run has no results to export"}
            
            return {
                "success": True,
                "action": "export",
                "run_id": run_id,
                "format": format.lower(),
                "results_count": run.get("results_count", 0),
                "message": f"Exporting {run.get('results_count', 0)} results as {format.upper()}..."
            }
        except Exception as e:
            logger.error(f"Error preparing export: {str(e)}")
            return {"error": str(e)}
    
    async def get_page_context(self, current_page: str = None) -> Dict[str, Any]:
        """Get context about user's current page/state."""
        try:
            context = {
                "current_page": current_page or "unknown"
            }
            
            # Add relevant context based on page
            if current_page == "runs":
                recent_runs = await self.list_recent_runs(limit=5)
                context["recent_runs"] = recent_runs.get("runs", [])
            elif current_page == "actors":
                actors = await self.get_actors()
                context["available_actors"] = actors.get("actors", [])
            elif current_page == "datasets" or current_page == "leads":
                dataset_info = await self.get_dataset_info()
                context["dataset_info"] = dataset_info
            
            return context
        except Exception as e:
            logger.error(f"Error getting page context: {str(e)}")
            return {"error": str(e)}
    
    async def fill_and_start_scraper(self, actor_name: str, search_terms: List[str], 
                                      location: str = None, max_results: int = 20,
                                      navigate_to_actor: bool = False) -> Dict[str, Any]:
        """Fill scraper form and start run - returns commands for full automation."""
        try:
            # Find actor
            actor = await self.db.actors.find_one(
                {
                    "$or": [{"user_id": self.user_id}, {"is_public": True}],
                    "name": {"$regex": actor_name, "$options": "i"}
                },
                {"_id": 0}
            )
            
            if not actor:
                return {"error": f"Actor '{actor_name}' not found"}
            
            # Create the run first
            run_id = str(__import__('uuid').uuid4())
            run_doc = {
                "id": run_id,
                "user_id": self.user_id,
                "actor_id": actor["id"],
                "actor_name": actor["name"],
                "status": "queued",
                "input_data": {
                    "search_terms": search_terms,
                    "location": location,
                    "max_results": max_results
                },
                "started_at": None,
                "finished_at": None,
                "duration_seconds": None,
                "results_count": 0,
                "dataset_id": None,
                "error_message": None,
                "logs": [],
                "cost": 0.0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await self.db.runs.insert_one(run_doc)
            
            # Update actor run count
            await self.db.actors.update_one(
                {"id": actor["id"]},
                {"$inc": {"runs_count": 1}}
            )
            
            # Return automation commands
            return {
                "success": True,
                "action": "fill_and_run",
                "run_id": run_id,
                "actor_id": actor["id"],
                "actor_name": actor["name"],
                "navigate_to_actor": navigate_to_actor,
                "form_data": {
                    "search_terms": search_terms,
                    "location": location,
                    "max_results": max_results
                },
                "message": f"🤖 Starting {actor['name']} for {', '.join(search_terms)}{' in ' + location if location else ''}..."
            }
        except Exception as e:
            logger.error(f"Error in fill_and_start_scraper: {str(e)}")
            return {"error": str(e)}
    
    async def view_run_details(self, run_id: str) -> Dict[str, Any]:
        """Navigate to run details page."""
        try:
            # Verify run exists and belongs to user
            run = await self.db.runs.find_one(
                {"id": run_id, "user_id": self.user_id},
                {"_id": 0, "id": 1, "actor_name": 1, "status": 1}
            )
            
            if not run:
                return {"error": "Run not found or you don't have access"}
            
            return {
                "success": True,
                "action": "view_run",
                "run_id": run_id,
                "page": "datasets",
                "message": f"Opening results for {run['actor_name']}..."
            }
        except Exception as e:
            logger.error(f"Error viewing run details: {str(e)}")
            return {"error": str(e)}
    
    async def open_actor_detail(self, actor_id: str = None, actor_name: str = None) -> Dict[str, Any]:
        """Open actor detail page."""
        try:
            query = {}
            if actor_id:
                query["id"] = actor_id
            elif actor_name:
                query["name"] = {"$regex": actor_name, "$options": "i"}
            else:
                return {"error": "Either actor_id or actor_name is required"}
            
            query["$or"] = [{"user_id": self.user_id}, {"is_public": True}]
            
            actor = await self.db.actors.find_one(query, {"_id": 0, "id": 1, "name": 1})
            
            if not actor:
                return {"error": "Actor not found"}
            
            return {
                "success": True,
                "action": "open_actor",
                "actor_id": actor["id"],
                "actor_name": actor["name"],
                "page": f"actors/{actor['id']}",
                "message": f"Opening {actor['name']}..."
            }
        except Exception as e:
            logger.error(f"Error opening actor detail: {str(e)}")
            return {"error": str(e)}
    
    async def execute_function(self, function_name: str, arguments: Dict[str, Any]) -> str:
        """Execute a function and return formatted result."""
        try:
            if function_name == "get_user_stats":
                result = await self.get_user_stats()
            elif function_name == "list_recent_runs":
                result = await self.list_recent_runs(**arguments)
            elif function_name == "get_actors":
                result = await self.get_actors()
            elif function_name == "create_scraping_run":
                result = await self.create_scraping_run(**arguments)
            elif function_name == "stop_run":
                result = await self.stop_run(**arguments)
            elif function_name == "delete_run":
                result = await self.delete_run(**arguments)
            elif function_name == "get_dataset_info":
                result = await self.get_dataset_info()
            elif function_name == "navigate_to_page":
                result = await self.navigate_to_page(**arguments)
            elif function_name == "export_dataset":
                result = await self.export_dataset(**arguments)
            elif function_name == "get_page_context":
                result = await self.get_page_context(**arguments)
            elif function_name == "fill_and_start_scraper":
                result = await self.fill_and_start_scraper(**arguments)
            elif function_name == "view_run_details":
                result = await self.view_run_details(**arguments)
            elif function_name == "open_actor_detail":
                result = await self.open_actor_detail(**arguments)
            else:
                result = {"error": f"Unknown function: {function_name}"}
            
            return json.dumps(result, default=str)
        except Exception as e:
            logger.error(f"Error executing function {function_name}: {str(e)}")
            return json.dumps({"error": str(e)})
    
    async def get_conversation_history(self, limit: int = 20) -> List[Dict[str, str]]:
        """Get conversation history from database."""
        try:
            messages = await self.db.global_chat_history.find(
                {"user_id": self.user_id},
                {"_id": 0, "role": 1, "content": 1, "created_at": 1}
            ).sort("created_at", -1).limit(limit).to_list(limit)
            
            # Reverse to get chronological order
            messages.reverse()
            
            return [{"role": msg["role"], "content": msg["content"]} for msg in messages]
        except Exception as e:
            logger.error(f"Error getting conversation history: {str(e)}")
            return []
    
    async def save_message(self, role: str, content: str, function_call: Optional[Dict] = None):
        """Save message to conversation history."""
        try:
            message_doc = {
                "id": str(__import__('uuid').uuid4()),
                "user_id": self.user_id,
                "role": role,
                "content": content,
                "function_call": function_call,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await self.db.global_chat_history.insert_one(message_doc)
        except Exception as e:
            logger.error(f"Error saving message: {str(e)}")
    
    async def clear_history(self):
        """Clear conversation history."""
        try:
            await self.db.global_chat_history.delete_many({"user_id": self.user_id})
            return {"success": True}
        except Exception as e:
            logger.error(f"Error clearing history: {str(e)}")
            return {"error": str(e)}
    
    async def chat(self, message: str) -> Dict[str, Any]:
        """
        Process chat message with function calling support and conversation memory.
        
        Args:
            message: User's message
        
        Returns:
            Dict with response and metadata (run_id if run was created)
        """
        try:
            # Save user message
            await self.save_message("user", message)
            
            # Get conversation history (last 10 messages for context)
            history = await self.get_conversation_history(limit=10)
            
            # Create LLM client with user-specific session
            session_id = f"global_chat_{self.user_id}"
            
            # Build conversation context with history
            conversation_context = ""
            if len(history) > 1:  # More than just the current message
                conversation_context = "\n\n**Previous Conversation:**\n"
                # Include all messages except the last one (which is the current message)
                for msg in history[:-1]:
                    role = msg['role'].upper()
                    content = msg['content']
                    conversation_context += f"{role}: {content}\n"
                conversation_context += "\n**Current User Message:**\n"
            
            # Enhanced system prompt with function calling instructions and context
            enhanced_prompt = f"""{self.system_prompt}

**Available Functions:**
{json.dumps(self.functions, indent=2)}

**When you need data or want to execute actions:**
1. Use function calls in this format: FUNCTION_CALL: {{"name": "function_name", "arguments": {{...}}}}
2. I will execute the function and provide results
3. Then respond naturally to the user with the data

**Examples:**
User: "How many runs do I have?"
You: FUNCTION_CALL: {{"name": "get_user_stats", "arguments": {{}}}}

User: "Run google maps scraper for Hotels in NYC with 50 results"
You: FUNCTION_CALL: {{"name": "create_scraping_run", "arguments": {{"actor_name": "Google Maps", "search_terms": ["Hotels"], "location": "New York, NY", "max_results": 50}}}}

**Important:** 
- Remember the conversation context
- When user asks follow-up questions like "which one is best?", refer to previous messages
- Use pronouns and references from earlier in the conversation
{conversation_context}"""
            
            # Create messages for OpenAI
            messages = [
                {"role": "system", "content": enhanced_prompt},
                {"role": "user", "content": message}
            ]

            # Get response using appropriate client
            if self.use_litellm:
                # Use LiteLLM for Emergent key
                response = litellm.completion(
                    model=self.model,
                    messages=messages,
                    api_key=self.api_key,
                    max_tokens=1000,
                    temperature=0.7
                )
                response = response.choices[0].message.content
            else:
                # Use OpenAI client
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    max_tokens=1000,
                    temperature=0.7
                )
                response = response.choices[0].message.content
            
            # Check if response contains function call
            function_call_match = re.search(r'FUNCTION_CALL:\s*({.*?})\s*(?:\n|$)', response, re.DOTALL)
            
            # Track if a run was created
            created_run_id = None
            created_actor_id = None
            created_input_data = None
            action_metadata = None  # Track UI actions like navigate, export
            
            if function_call_match:
                try:
                    function_call_json = json.loads(function_call_match.group(1))
                    function_name = function_call_json.get("name")
                    arguments = function_call_json.get("arguments", {})
                    
                    # Execute function
                    function_result = await self.execute_function(function_name, arguments)
                    function_result_dict = json.loads(function_result)
                    
                    # If this was a run creation, capture the run_id for task execution
                    if function_name == "create_scraping_run" and function_result_dict.get("success"):
                        created_run_id = function_result_dict.get("run_id")
                        # Fetch run details for task execution
                        if created_run_id:
                            run = await self.db.runs.find_one({"id": created_run_id}, {"_id": 0})
                            if run:
                                created_actor_id = run.get("actor_id")
                                created_input_data = run.get("input_data")
                    
                    # Capture UI action commands (navigate, export)
                    if function_name in ["navigate_to_page", "export_dataset", "fill_and_start_scraper", 
                                        "view_run_details", "open_actor_detail"] and function_result_dict.get("success"):
                        action_metadata = function_result_dict
                        
                    # Special handling for fill_and_start_scraper - also trigger the run
                    if function_name == "fill_and_start_scraper" and function_result_dict.get("success"):
                        created_run_id = function_result_dict.get("run_id")
                        created_actor_id = function_result_dict.get("actor_id")
                        created_input_data = function_result_dict.get("form_data")
                    
                    # Get final response with function result
                    follow_up_messages = [
                        {"role": "system", "content": enhanced_prompt},
                        {"role": "user", "content": message},
                        {"role": "assistant", "content": response},
                        {"role": "user", "content": f"Function result: {function_result}\n\nPlease respond naturally to the user's original question with this data. Remember the conversation context. DO NOT include FUNCTION_CALL in your response."}
                    ]
                    final_response = self.client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=follow_up_messages,
                        max_tokens=1000,
                        temperature=0.7
                    )
                    final_response = final_response.choices[0].message.content
                    
                    # Save assistant response
                    await self.save_message("assistant", final_response, function_call_json)
                    
                    return {
                        "response": final_response,
                        "run_id": created_run_id,
                        "actor_id": created_actor_id,
                        "input_data": created_input_data,
                        "action": action_metadata  # Include action commands
                    }
                except Exception as e:
                    logger.error(f"Error processing function call: {str(e)}")
                    response = f"I tried to fetch data but encountered an error: {str(e)}"
            
            # Save regular response
            await self.save_message("assistant", response)
            
            return {
                "response": response,
                "run_id": None,
                "actor_id": None,
                "input_data": None,
                "action": None
            }
            
        except Exception as e:
            logger.error(f"Global chat error: {str(e)}")
            error_msg = "I apologize, but I encountered an error. Please try again."
            await self.save_message("assistant", error_msg)
            return {
                "response": error_msg,
                "run_id": None,
                "actor_id": None,
                "input_data": None,
                "action": None
            }
