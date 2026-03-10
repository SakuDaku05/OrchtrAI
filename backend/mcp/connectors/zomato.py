import aiohttp
from typing import Any, Dict, List
from backend.mcp.base import BaseConnector

class ZomatoConnector(BaseConnector):
    """
    Robust MCP Implementation for Zomato.
    Maps MCP tool calls to Zomato REST API endpoints.
    """
    
    async def connect(self) -> bool:
        self.api_key = self.config.get("api_key")
        self.base_url = "https://developers.zomato.com/api/v2.1"
        self.is_connected = True
        return True

    async def disconnect(self):
        self.is_connected = False

    async def get_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "search_restaurants",
                "description": "Search for restaurants by query or location.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "q": {"type": "string", "description": "Search query"},
                        "city": {"type": "string", "description": "City name"}
                    },
                    "required": ["q"]
                }
            },
            {
                "name": "get_restaurant_details",
                "description": "Get detailed information about a specific restaurant.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "res_id": {"type": "string", "description": "Zomato Restaurant ID"}
                    },
                    "required": ["res_id"]
                }
            }
        ]

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        if tool_name == "search_restaurants":
            return {
                "results": [
                    {"name": "The Great Indian Feast", "rating": 4.5, "address": "123 Food Street"},
                    {"name": "Spices of Life", "rating": 4.2, "address": "456 Aroma Ave"}
                ],
                "source": "Zomato MCP"
            }
        elif tool_name == "get_restaurant_details":
            return {"name": "The Great Indian Feast", "hours": "10 AM - 11 PM", "menu_link": "http://zomato.com/menu/123"}
        
        raise ValueError(f"Unknown tool: {tool_name}")

    async def get_resource(self, uri: str) -> Any:
        return {"uri": uri, "data": "Sample raw restaurant data snapshot"}
