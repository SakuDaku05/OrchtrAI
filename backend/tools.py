# Definitions for DuckDuckGo and Outlook tools
from autogen_core.tools import FunctionTool
from duckduckgo_search import DDGS
from pydantic import BaseModel, Field
import json

# --- 1. Free Web Search Tool (For Researcher) ---
async def web_search(query: str, max_results: int = 5) -> str:
    """Performs a live web search using DuckDuckGo."""
    try:
        results = []
        with DDGS() as ddgs:
            # text() is the new standard method in duckduckgo_search
            for r in ddgs.text(query, max_results=max_results):
                results.append(r)
        return json.dumps(results)
    except Exception as e:
        return f"Search failed: {str(e)}"

duckduckgo_tool = FunctionTool(web_search, description="Searches the live internet for up-to-date facts and context.")


# --- 2. Enterprise Action Tool (For Executor) ---
class CalendarParams(BaseModel):
    attendees: list[str] = Field(..., description="List of email addresses.")
    subject: str = Field(..., description="Meeting subject.")
    start_time: str = Field(..., description="ISO 8601 formatted start time.")

async def book_outlook_meeting(params: CalendarParams) -> str:
    """
    MOCK IMPLEMENTATION: In production, use azure-identity and msgraph-sdk here.
    This formats the payload for the Microsoft Graph API.
    """
    payload = {
        "subject": params.subject,
        "start": {"dateTime": params.start_time, "timeZone": "UTC"},
        "attendees": [{"emailAddress": {"address": email}, "type": "required"} for email in params.attendees]
    }
    # Log the action (In real app, await graph_client.users[id].events.post(payload))
    return f"SUCCESS: Outlook Calendar payload staged for execution: {json.dumps(payload)}"

calendar_tool = FunctionTool(book_outlook_meeting, description="Drafts and stages a Microsoft Outlook calendar invite.")