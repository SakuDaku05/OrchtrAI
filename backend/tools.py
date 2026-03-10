from autogen_core.tools import FunctionTool
from duckduckgo_search import DDGS
from pydantic import BaseModel, Field
import json
import datetime

async def get_current_datetime() -> str:
    """Returns the current date and time. Use this to resolve relative time requests like 'tomorrow' or 'next week'."""
    now = datetime.datetime.now()
    return f"Today is {now.strftime('%A, %B %d, %Y')}. The current time is {now.strftime('%H:%M:%S')}."

current_time_tool = FunctionTool(get_current_datetime, description="Returns the current date and time for temporal context.")


class SearchParams(BaseModel):
    query: str = Field(..., description="The search query to look up on the internet.")
    max_results: int = Field(default=5, description="Number of results to return.")

async def web_search(params: SearchParams) -> str:
    """Performs a live web search using DuckDuckGo."""
    try:
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(params.query, max_results=params.max_results):
                results.append(r)
        return json.dumps(results)
    except Exception as e:
        return f"Search failed: {str(e)}"

duckduckgo_tool = FunctionTool(web_search, description="Searches the live internet for up-to-date facts and context.")


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
    return f"SUCCESS: Outlook Calendar payload staged for execution: {json.dumps(payload)}"

calendar_tool = FunctionTool(book_outlook_meeting, description="Drafts and stages a Microsoft Outlook calendar invite.")


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

async def delete_global_event(event_id: str, event_type: str = "MEETING") -> str:
    """
    Removes an event or reminder from the OrchestrAI Global Calendar.
    Pass the ID of the event to delete it.
    """
    from backend.database import db_service
    try:
        await db_service.delete_calendar_event(event_id, event_type)
        return f"SUCCESS: Event {event_id} deleted from global calendar."
    except Exception as e:
        return f"ERROR: Failed to delete event: {str(e)}"

global_calendar_tool = FunctionTool(add_global_event, description="Adds an event or reminder to the shared Global Calendar and Timeline.")
delete_calendar_tool = FunctionTool(delete_global_event, description="Deletes an event or reminder from the shared Global Calendar using its ID.")


def search_pageindex(query: str, tree: dict) -> list:
    """Traverse PageIndex tree and find relevant sections."""
    matches = []
    
    def traverse(node):
        title = node.get("title", "")
        summary = node.get("summary", "")
        pages = node.get("page_range", "")

        if query.lower() in title.lower() or query.lower() in summary.lower():
            matches.append({
                "title": title,
                "summary": summary,
                "pages": pages
            })

        for child in node.get("children", []):
            traverse(child)

    if tree:
        traverse(tree)
    return matches[:5]

async def query_document_index(query: str, session_id: str) -> str:
    """
    Searches the pre-processed PageIndex tree of the uploaded document(s).
    Use this to find relevant sections and summaries from the context.
    """
    from backend.database import db_service
    
    state = await db_service.get_state(session_id)
    if not state or "page_index" not in state:
        return "No document index found for this session."
    
    tree = state["page_index"]
    results = search_pageindex(query, tree)

    if not results:
        return "No relevant sections found in the document index."

    context = "### Relevant Document Sections:\n"
    for r in results:
        context += f"- **{r['title']}** (Pages: {r['pages']}): {r['summary']}\n"

    return context

pageindex_tool = FunctionTool(query_document_index, description="Queries the document's PageIndex for relevant information using a natural language query.")


class EmailParams(BaseModel):
    recipient: str = Field(..., description="Recipient email address.")
    subject: str = Field(..., description="Subject of the email.")
    body: str = Field(..., description="Content of the email (HTML supported).")

async def send_brevo_email(params: EmailParams) -> str:
    """
    Sends a transactional email using the Brevo (Sendinblue) API.
    Use this for notifications, invites, or professional outreach.
    """
    import sib_api_v3_sdk
    from sib_api_v3_sdk.rest import ApiException
    from backend.config import settings

    if not settings.BREVO_API_KEY:
        return "ERROR: Brevo API Key not configured in .env."

    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = settings.BREVO_API_KEY

    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    sender = {"name": settings.BREVO_SENDER_NAME, "email": settings.BREVO_SENDER_EMAIL}
    to = [{"email": params.recipient}]
    
    html_content = f"<html><body><div style='font-family: sans-serif; line-height: 1.5;'>{params.body.replace(chr(10), '<br>')}</div></body></html>"
    
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to,
        html_content=html_content,
        sender=sender,
        subject=params.subject
    )

    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        return f"SUCCESS: Email sent via Brevo. Message ID: {api_response.message_id}"
    except ApiException as e:
        return f"ERROR: Brevo API Exception: {str(e)}"
    except Exception as e:
        return f"ERROR: Unexpected error sending email: {str(e)}"

email_tool = FunctionTool(send_brevo_email, description="Sends a professional email to a recipient using the Brevo API.")