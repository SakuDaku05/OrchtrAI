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
    
    db_state = await db_service.get_state(session_id)
    if not db_state:
        return

    extra_tools = []
    enabled_mcps = db_state.get("enabled_mcps", [])
    if enabled_mcps:
        all_configs = await db_service.get_mcp_configs()
        for mcp_id in enabled_mcps:
            config_item = next((c for c in all_configs if c["id"] == mcp_id), None)
            if config_item:
                try:
                    connector = await mcp_registry.get_instance(config_item["service"], config_item["config"])
                    mcp_tools = await get_mcp_tools(connector)
                    extra_tools.extend(mcp_tools)
                except Exception as e:
                    print(f"Failed to load MCP {mcp_id}: {str(e)}")

    is_approved = db_state.get("is_approved", False)
    hitl_enabled = db_state.get("hitl_enabled", True)
    
    team = build_orchestrai_team(
        is_approved=is_approved,
        extra_tools=extra_tools, 
        hitl_enabled=hitl_enabled
    )

    if db_state.get("autogen_state"):
        await team.load_state(db_state["autogen_state"])

    task_input = msg_payload.get("prompt") if action in ["START", "CHAT"] else msg_payload.get("feedback")

    try:
        async for event in team.run_stream(task=task_input):
            if hasattr(event, 'source') and hasattr(event, 'content'):
                
                def safe_serialize(obj):
                    if isinstance(obj, str): return obj
                    if isinstance(obj, dict): return {k: safe_serialize(v) for k, v in obj.items()}
                    if isinstance(obj, list): return [safe_serialize(i) for i in obj]
                    if hasattr(obj, 'model_dump'): return obj.model_dump()
                    if hasattr(obj, '__dict__'): return safe_serialize(obj.__dict__)
                    return str(obj)

                serialized_content = safe_serialize(event.content)

                db_state["chat_history"].append({
                    "agent": event.source,
                    "role": "assistant",
                    "content": serialized_content,
                    "type": type(event).__name__
                })
                
                try:
                    content_str = str(serialized_content)
                    log_msg = content_str if len(content_str) < 200 else content_str[:197] + "..."
                    print(f"[{event.source}] -> {log_msg}")
                except UnicodeEncodeError:
                    print(f"[{event.source}] -> [Content contains non-encodable characters]")
                
                await db_service.save_state(db_state)
        

        final_msgs = [m["content"] for m in db_state["chat_history"] if m["agent"] == "Reviewer"]
        if final_msgs and "STATUS: PENDING_APPROVAL" in str(final_msgs[-1]):
            db_state["status"] = "PAUSED_FOR_HITL"
        else:
            db_state["status"] = "COMPLETED"

    except Exception as e:
        print(f"Workflow Error: {str(e)}")
        db_state["status"] = "FAILED"
        if "chat_history" not in db_state: db_state["chat_history"] = []
        db_state["chat_history"].append({"agent": "System", "content": f"Fatal Error: {str(e)}"})

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
                    print(f"Processing Job: {payload['session_id']} | Action: {payload.get('action', 'UNKNOWN')}")
                    await process_message(payload)
                    await receiver.complete_message(msg)
                except Exception as e:
                    print(f"Failed to process message: {str(e)}")
                    await receiver.dead_letter_message(msg, reason="ProcessingError", error_description=str(e))

if __name__ == "__main__":
    asyncio.run(main())