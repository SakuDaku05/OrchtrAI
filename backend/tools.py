from autogen_core.tools import FunctionTool
from duckduckgo_search import DDGS
from pydantic import BaseModel, Field
import json
import datetime

# --- 0. Helper Tools ---
async def get_current_datetime() -> str:
    """Returns the current date and time. Use this to resolve relative time requests like 'tomorrow' or 'next week'."""
    now = datetime.datetime.now()
    return f"Today is {now.strftime('%A, %B %d, %Y')}. The current time is {now.strftime('%H:%M:%S')}."

current_time_tool = FunctionTool(get_current_datetime, description="Returns the current date and time for temporal context.")

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

# --- 3. Global Storage Tools (Shared Intelligence) ---
class GlobalEventParams(BaseModel):
    title: str = Field(..., description="Short title of the event or reminder.")
    start_time: str = Field(..., description="ISO 8601 formatted start time (e.g., 2024-03-25T10:00:00).")
    end_time: str | None = Field(None, description="Optional ISO 8601 formatted end time.")
    description: str | None = Field(None, description="Additional context or details.")
    type: str = Field("MEETING", description="Type of event: MEETING or REMINDER.")

async def add_global_event(params: GlobalEventParams) -> str:
    """
    Saves an event or reminder to the OrchestrAI Global Calendar. 
    This is visible across all user workflows as a shared timeline.
    """
    import uuid
    from backend.database import db_service
    
    event_id = f"EVT-{uuid.uuid4().hex[:8].upper()}"
    event_data = {
        "id": event_id,
        "title": params.title,
        "start_time": params.start_time,
        "end_time": params.end_time,
        "description": params.description,
        "type": params.type
    }
    
    try:
        await db_service.save_calendar_event(event_data)
        return f"SUCCESS: Global {params.type.lower()} scheduled: '{params.title}' at {params.start_time}. ID: {event_id}"
    except Exception as e:
        return f"ERROR: Failed to save to global calendar: {str(e)}"

global_calendar_tool = FunctionTool(add_global_event, description="Adds an event or reminder to the shared Global Calendar and Timeline.")
