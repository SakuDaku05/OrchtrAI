# Definitions for DuckDuckGo and Outlook tools
from autogen_core.tools import FunctionTool
import json

# --- 1. Free Web Search Tool (For Researcher) ---
async def web_search(query: str, max_results: int = 2) -> str:
    """Performs a live web search using Google Serper API."""
    try:
        import aiohttp
        from backend.config import settings
        
        headers = {
            'X-API-KEY': settings.SERPER_API_KEY,
            'Content-Type': 'application/json'
        }
        payload = {"q": query, "num": max_results}
        
        async with aiohttp.ClientSession() as session:
            async with session.post('https://google.serper.dev/search', headers=headers, json=payload) as response:
                if response.status != 200:
                    return f"Search failed: Status {response.status}"
                data = await response.json()
                
        organic = data.get("organic", [])
        if not organic:
            return "No results found."
            
        formatted_results = "\\n".join([f"Title: {r.get('title')}\\nSnippet: {r.get('snippet')}" for r in organic])
        return formatted_results
    except Exception as e:
        return f"Search failed: {str(e)}"

duckduckgo_tool = FunctionTool(web_search, description="Searches the live internet for up-to-date facts and context.")


# --- 2. Action Tool (For Executor) ---
async def schedule_meeting(meeting_topic: str) -> str:
    """
    Returns the Cal.com booking link or embed to schedule a meeting.
    Use this tool whenever the user needs to schedule a call, meeting, or appointment.
    """
    cal_url = "https://cal.com/mayank-raj-1onqta"
    iframe_embed = f'<iframe src="{cal_url}" width="100%" height="700"></iframe>'
    
    return f"SUCCESS: Tell the user to book the meeting here: {cal_url} (or embed this: {iframe_embed})"

calendar_tool = FunctionTool(schedule_meeting, description="Provides the Cal.com scheduling link to book a meeting.")

# --- 3. Hybrid RAG Search Tool (For Researcher) ---
def make_rag_tool(session_id: str):
    async def search_uploaded_documents(query: str) -> str:
        """Searches the uploaded documents for semantic matches to the query using Azure Cosmos DB NoSQL Vector Search."""
        try:
            from backend.database import db_service
            from backend.rag import embed_texts
            # 1. Embed query locally (1 API call saved)
            query_embedding = embed_texts([query])[0]
            # 2. Search Cosmos DB
            results = await db_service.search_chunks(session_id, query_embedding, top_k=3)
            if not results:
                return "No relevant information found in the uploaded documents."
            
            # 3. Format output
            output = "Found the following excerpts from uploaded files:\n\n"
            for r in results:
                metadata = r.get("metadata", {})
                filename = metadata.get("filename", "unknown file")
                text = r.get("text", "")
                output += f"--- Excerpt from {filename} ---\n{text}\n\n"
            return output
        except Exception as e:
            return f"Document search failed: {str(e)}"
            
    return FunctionTool(search_uploaded_documents, description="Searches the user's uploaded documents for information and context.")