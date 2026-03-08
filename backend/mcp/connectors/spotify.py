import aiohttp
import base64
from typing import Any, Dict, List, Optional
from backend.mcp.base import BaseConnector

class SpotifyConnector(BaseConnector):
    """
    MCP Implementation for Spotify.
    Maps MCP tool calls to Spotify Web API endpoints using Client Credentials flow.
    """
    
    async def connect(self) -> bool:
        self.client_id = self.config.get("client_id")
        self.client_secret = self.config.get("client_secret")
        self.base_url = "https://api.spotify.com/v1"
        self.token_url = "https://accounts.spotify.com/api/token"
        self.access_token = None
        
        if not self.client_id or not self.client_secret:
            print("Spotify MCP: Missing client_id or client_secret")
            return False
            
        return await self._refresh_token()

    async def _refresh_token(self) -> bool:
        auth_str = f"{self.client_id}:{self.client_secret}"
        encoded_auth = base64.b64encode(auth_str.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded_auth}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {"grant_type": "client_credentials"}
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.token_url, headers=headers, data=data) as resp:
                if resp.status == 200:
                    res_json = await resp.json()
                    self.access_token = res_json.get("access_token")
                    self.is_connected = True
                    return True
                else:
                    print(f"Spotify MCP: Failed to get token: {resp.status}")
                    return False

    async def disconnect(self):
        self.access_token = None
        self.is_connected = False

    async def get_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "spotify_search",
                "description": "Search for tracks, artists, or albums on Spotify.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "q": {"type": "string", "description": "Search query"},
                        "type": {"type": "string", "enum": ["track", "artist", "album"], "description": "Type of item to search for"},
                        "limit": {"type": "integer", "default": 5}
                    },
                    "required": ["q", "type"]
                }
            },
            {
                "name": "spotify_get_item",
                "description": "Get detailed information about a specific track, album, or playlist by ID.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string", "description": "Spotify ID of the item"},
                        "type": {"type": "string", "enum": ["track", "album", "playlist"], "description": "Type of item"}
                    },
                    "required": ["id", "type"]
                }
            },
            {
                "name": "spotify_browse_featured",
                "description": "Get a list of featured playlists on Spotify.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "limit": {"type": "integer", "default": 10}
                    }
                }
            }
        ]

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        if not self.access_token:
            await self._refresh_token()
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        async with aiohttp.ClientSession() as session:
            if tool_name == "spotify_search":
                q = arguments.get("q")
                search_type = arguments.get("type")
                limit = arguments.get("limit", 5)
                url = f"{self.base_url}/search?q={q}&type={search_type}&limit={limit}"
                async with session.get(url, headers=headers) as resp:
                    return await resp.json()
                    
            elif tool_name == "spotify_get_item":
                item_id = arguments.get("id")
                item_type = arguments.get("type")
                # playlist uses plural 'playlists' in endpoint but others use singular? 
                # Actually: tracks/{id}, albums/{id}, playlists/{id}
                endpoint = f"{item_type}s" if item_type != "playlist" else "playlists"
                url = f"{self.base_url}/{endpoint}/{item_id}"
                async with session.get(url, headers=headers) as resp:
                    return await resp.json()
                    
            elif tool_name == "spotify_browse_featured":
                limit = arguments.get("limit", 10)
                url = f"{self.base_url}/browse/featured-playlists?limit={limit}"
                async with session.get(url, headers=headers) as resp:
                    return await resp.json()
                    
        raise ValueError(f"Unknown tool: {tool_name}")

    async def get_resource(self, uri: str) -> Any:
        return {"uri": uri, "data": "Spotify Raw Resource Data"}
