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
                "name": "searchTrack",
                "description": "Search for tracks on Spotify.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search query"},
                        "limit": {"type": "integer", "default": 5}
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "searchArtist",
                "description": "Search for artists on Spotify.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search query"},
                        "limit": {"type": "integer", "default": 5}
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "searchAlbum",
                "description": "Search for albums on Spotify.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search query"},
                        "limit": {"type": "integer", "default": 5}
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "getTrack",
                "description": "Get detailed information about a specific track by ID.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string", "description": "Spotify ID of the track"}
                    },
                    "required": ["id"]
                }
            },
            {
                "name": "getAlbum",
                "description": "Get detailed information about a specific album by ID.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string", "description": "Spotify ID of the album"}
                    },
                    "required": ["id"]
                }
            },
            {
                "name": "browseCategories",
                "description": "Get a list of categories on Spotify.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "limit": {"type": "integer", "default": 10}
                    }
                }
            },
            {
                "name": "featuredPlaylists",
                "description": "Get a list of featured playlists on Spotify.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "limit": {"type": "integer", "default": 10},
                        "country": {"type": "string", "description": "ISO 3166-1 alpha-2 country code (e.g. US, IN)"}
                    }
                }
            },
            {
                "name": "browseNewReleases",
                "description": "Get a list of new album releases.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "limit": {"type": "integer", "default": 10},
                        "country": {"type": "string"}
                    }
                }
            },
            {
                "name": "getArtistTopTracks",
                "description": "Get an artist's top tracks.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "artist_id": {"type": "string", "description": "Spotify ID of the artist"},
                        "market": {"type": "string", "default": "US"}
                    },
                    "required": ["artist_id"]
                }
            },
            {
                "name": "getPlaylist",
                "description": "Get details of a specific public playlist by ID.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "playlist_id": {"type": "string", "description": "Spotify ID of the playlist"}
                    },
                    "required": ["playlist_id"]
                }
            }
        ]

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        if not self.access_token:
            await self._refresh_token()
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        async with aiohttp.ClientSession() as session:
            if tool_name == "searchTrack":
                query = arguments.get("query")
                limit = arguments.get("limit", 5)
                url = f"{self.base_url}/search?q={query}&type=track&limit={limit}"
                async with session.get(url, headers=headers) as resp:
                    return await resp.json()

            elif tool_name == "searchArtist":
                query = arguments.get("query")
                limit = arguments.get("limit", 5)
                url = f"{self.base_url}/search?q={query}&type=artist&limit={limit}"
                async with session.get(url, headers=headers) as resp:
                    return await resp.json()

            elif tool_name == "searchAlbum":
                query = arguments.get("query")
                limit = arguments.get("limit", 5)
                url = f"{self.base_url}/search?q={query}&type=album&limit={limit}"
                async with session.get(url, headers=headers) as resp:
                    return await resp.json()
                    
            elif tool_name == "getTrack":
                item_id = arguments.get("id") or arguments.get("track_id")
                url = f"{self.base_url}/tracks/{item_id}"
                async with session.get(url, headers=headers) as resp:
                    return await resp.json()

            elif tool_name == "getAlbum":
                item_id = arguments.get("id") or arguments.get("album_id")
                url = f"{self.base_url}/albums/{item_id}"
                async with session.get(url, headers=headers) as resp:
                    return await resp.json()

            elif tool_name == "browseCategories":
                limit = arguments.get("limit", 10)
                url = f"{self.base_url}/browse/categories?limit={limit}"
                async with session.get(url, headers=headers) as resp:
                    return await resp.json()
                    
            elif tool_name == "featuredPlaylists":
                limit = arguments.get("limit", 10)
                country = arguments.get("country", "")
                url = f"{self.base_url}/browse/featured-playlists?limit={limit}"
                if country: url += f"&country={country}"
                async with session.get(url, headers=headers) as resp:
                    data = await resp.json()
                    if resp.status == 403:
                        return {"error": "403 Forbidden. This endpoint may require a User Token or is restricted in your region with Client Credentials."}
                    return data

            elif tool_name == "browseNewReleases":
                limit = arguments.get("limit", 10)
                country = arguments.get("country", "")
                url = f"{self.base_url}/browse/new-releases?limit={limit}"
                if country: url += f"&country={country}"
                async with session.get(url, headers=headers) as resp:
                    return await resp.json()

            elif tool_name == "getArtistTopTracks":
                artist_id = arguments.get("artist_id")
                market = arguments.get("market", "US")
                url = f"{self.base_url}/artists/{artist_id}/top-tracks?market={market}"
                async with session.get(url, headers=headers) as resp:
                    return await resp.json()

            elif tool_name == "getPlaylist":
                item_id = arguments.get("playlist_id") or arguments.get("id")
                url = f"{self.base_url}/playlists/{item_id}"
                async with session.get(url, headers=headers) as resp:
                    return await resp.json()
                    
        raise ValueError(f"Unknown tool: {tool_name}")

    async def get_resource(self, uri: str) -> Any:
        return {"uri": uri, "data": "Spotify Raw Resource Data"}
