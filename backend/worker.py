# The background script that runs the AutoGen team
import asyncio
import json
from azure.servicebus.aio import ServiceBusClient
from backend.config import settings
from backend.database import db_service
from backend.team import build_orchestrai_team
from backend.mcp.registry import mcp_registry
from backend.mcp_utils import get_mcp_tools

async def process_message(msg_payload: dict):
    session_id = msg_payload["session_id"]
    action = msg_payload["action"]
    
    # 1. Load State from Cosmos
    db_state = await db_service.get_state(session_id)
    if not db_state:
        return

    # 2. Load MCP Tools if enabled
    extra_tools = []
    enabled_mcps = db_state.get("enabled_mcps", [])
    if enabled_mcps:
        all_configs = await db_service.get_mcp_configs()
        for mcp_id in enabled_mcps:
            # Find the config for this MCP
            config_item = next((c for c in all_configs if c["id"] == mcp_id), None)
            if config_item:
                try:
                    connector = await mcp_registry.get_instance(config_item["service"], config_item["config"])
                    mcp_tools = await get_mcp_tools(connector)
                    extra_tools.extend(mcp_tools)
                except Exception as e:
                    print(f"Failed to load MCP {mcp_id}: {str(e)}")

    # 3. Build the AutoGen Team
    hitl_enabled = db_state.get("hitl_enabled", True)
    team = build_orchestrai_team(extra_tools=extra_tools, hitl_enabled=hitl_enabled)

    # 4. Restore memory if resuming
    if db_state.get("autogen_state"):
        await team.load_state(db_state["autogen_state"])

    # 4. Determine Task
    task_input = msg_payload.get("prompt") if action == "START" else msg_payload.get("feedback")

    # 5. Run the Team
    try:
        # Run the workflow. It will yield messages until termination condition hits.
        async for event in team.run_stream(task=task_input):
            if hasattr(event, 'source') and hasattr(event, 'content'):
                # Ensure content is a string for JSON serialization (handles FunctionCall objects/lists)
                content_str = str(event.content)
                
                # Append to Cosmos chat history for React UI to poll
                db_state["chat_history"].append({
                    "agent": event.source,
                    "role": "assistant",
                    "content": content_str,
                    "type": type(event).__name__
                })
                
                # Use careful printing for Windows console
                try:
                    log_msg = content_str if len(content_str) < 200 else content_str[:197] + "..."
                    print(f"[{event.source}] -> {log_msg}")
                except UnicodeEncodeError:
                    print(f"[{event.source}] -> [Content contains non-encodable characters]")
                
                await db_service.save_state(db_state)
        
        # 6. Check why it terminated (HITL vs Completed)
        final_msgs = [m["content"] for m in db_state["chat_history"] if m["agent"] == "Reviewer" or m["agent"] == "Reviewer"]
        if final_msgs and "STATUS: PENDING_APPROVAL" in str(final_msgs[-1]):
            db_state["status"] = "PAUSED_FOR_HITL"
        else:
            db_state["status"] = "COMPLETED"

    except Exception as e:
        print(f"Workflow Error: {str(e)}")
        db_state["status"] = "FAILED"
        if "chat_history" not in db_state: db_state["chat_history"] = []
        db_state["chat_history"].append({"agent": "System", "content": f"Fatal Error: {str(e)}"})

    # 7. Save Final Checkpoint
    db_state["autogen_state"] = await team.save_state()
    await db_service.save_state(db_state)


async def main():
    await db_service.init_db()
    print("Worker Started. Listening for Service Bus messages...")
    
    async with ServiceBusClient.from_connection_string(settings.SERVICE_BUS_CONNECTION_STRING) as client:
        receiver = client.get_queue_receiver(queue_name=settings.SERVICE_BUS_QUEUE_NAME)
        async with receiver:
            async for msg in receiver:
                try:
                    payload = json.loads(str(msg))
                    print(f"Processing Job: {payload['session_id']}")
                    await process_message(payload)
                    await receiver.complete_message(msg)
                except Exception as e:
                    print(f"Failed to process message: {str(e)}")
                    # Move to dead-letter queue if it critically fails
                    await receiver.dead_letter_message(msg, reason="ProcessingError", error_description=str(e))

if __name__ == "__main__":
    asyncio.run(main())