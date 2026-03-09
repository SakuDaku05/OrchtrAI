# The background script that runs the AutoGen team
import asyncio
import json
from azure.servicebus.aio import ServiceBusClient
from backend.config import settings
from backend.database import db_service
from backend.team import build_orchestrai_team

async def process_message(msg_payload: dict):
    session_id = msg_payload["session_id"]
    action = msg_payload["action"]
    
    # 1. Load State from Cosmos
    db_state = await db_service.get_state(session_id)
    if not db_state:
        return

    # 2. Build the AutoGen Team
    team = build_orchestrai_team(session_id)

    # 3. Restore memory if resuming
    if db_state.get("autogen_state"):
        await team.load_state(db_state["autogen_state"])

    # 4. Determine Task
    if action in ["START", "CHAT"]:
        task_input = msg_payload.get("prompt")
    else:
        task_input = msg_payload.get("feedback")

    # 5. Run the Team
    try:
        # Run the workflow. It will yield messages until termination condition hits.
        async for event in team.run_stream(task=task_input):
            if hasattr(event, 'source') and hasattr(event, 'content'):
                # Append to Cosmos chat history for React UI to poll
                db_state["chat_history"].append({
                    "agent": event.source,
                    "content": event.content,
                    "type": type(event).__name__
                })
                await db_service.save_state(db_state)
        
        # 6. Check why it terminated (HITL vs Completed)
        final_msgs = [m["content"] for m in db_state["chat_history"] if m["agent"] == "Reviewer"]
        if final_msgs and "STATUS: PENDING_APPROVAL" in final_msgs[-1]:
            db_state["status"] = "PAUSED_FOR_HITL"
        else:
            db_state["status"] = "COMPLETED"

    except Exception as e:
        db_state["status"] = "FAILED"
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