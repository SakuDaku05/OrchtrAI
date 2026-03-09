# backend/main.py
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from typing import Dict, Any
import uuid
import datetime
import json
import asyncio

from backend.schemas import TaskRequest, WorkflowState, ApprovalRequest, UserProfile, ChatRequest
from backend.database import db_service
from backend.config import settings
from backend.team import build_orchestrai_team

from backend.rag import extract_text_from_file, chunk_text, embed_texts
from azure.servicebus.aio import ServiceBusClient
from azure.servicebus import ServiceBusMessage

app = FastAPI(title="OrchestrAl API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    await db_service.init_db()
    
    if settings.SPOTIFY_CLIENT_ID and settings.SPOTIFY_CLIENT_SECRET:
        configs = await db_service.get_mcp_configs()
        if not any(c.get("service") == "spotify" for c in configs):
            await db_service.save_mcp_config({
                "id": "mcp-spotify-default",
                "name": "Spotify Music",
                "service": "spotify",
                "config": {
                    "client_id": settings.SPOTIFY_CLIENT_ID,
                    "client_secret": settings.SPOTIFY_CLIENT_SECRET
                },
                "is_active": True
            })

    # EXTRA: Auto-seed Serper if credentials provided in .env
    if settings.SERPER_API_KEY:
        configs = await db_service.get_mcp_configs()
        if not any(c.get("service") == "serper" for c in configs):
            await db_service.save_mcp_config({
                "id": "mcp-serper-default",
                "name": "Google Search (Serper)",
                "service": "serper",
                "config": {
                    "api_key": settings.SERPER_API_KEY
                },
                "is_active": True
            })


# ── Internal: run the AutoGen team and stream results into Cosmos DB (Your Code) ──

async def run_workflow(session_id: str, prompt: str, resume_feedback: str = None):
    """
    Runs the full AutoGen team pipeline and saves every agent message to Cosmos DB.
    This is called as a FastAPI BackgroundTask so it runs without blocking the HTTP response.
    """
    db_state = await db_service.get_state(session_id)
    if not db_state:
        return

    team = build_orchestrai_team(is_approved=db_state.get("is_approved", False))

    if db_state.get("autogen_state"):
        # AutoGen's `TextMentionTermination` searches the entire message history. 
        # We must scrub the old 'STATUS: PENDING_APPROVAL' flags from the state 
        # so it doesn't instantly terminate again upon resuming for the feedback loop.
        def scrub_state(obj):
            if isinstance(obj, str):
                return obj.replace("STATUS: PENDING_APPROVAL", "STATUS: PENDING_APPROVAL (ACKNOWLEDGED)")
            if isinstance(obj, dict):
                return {k: scrub_state(v) for k, v in obj.items()}
            if isinstance(obj, list):
                return [scrub_state(i) for i in obj]
            return obj
            
        clean_state = scrub_state(db_state["autogen_state"])
        await team.load_state(clean_state)

    task_input = resume_feedback if resume_feedback else prompt

    def safe_serialize(obj):
        if isinstance(obj, str): return obj
        if isinstance(obj, dict): return {k: safe_serialize(v) for k, v in obj.items()}
        if isinstance(obj, list): return [safe_serialize(i) for i in obj]
        if hasattr(obj, "model_dump"): return obj.model_dump()
        if hasattr(obj, "__dict__"): return safe_serialize(obj.__dict__)
        return str(obj)

    try:
        async for event in team.run_stream(task=task_input):
            if hasattr(event, "source") and hasattr(event, "content"):
                db_state["chat_history"].append({
                    "agent": event.source,
                    "content": safe_serialize(event.content),
                    "type": type(event).__name__,
                })
                await db_service.save_state(db_state)

        is_approved = db_state.get("is_approved", False)
        reviewer_msgs = [m["content"] for m in db_state["chat_history"] if m["agent"] == "Reviewer"]
        pending_request = reviewer_msgs and "STATUS: PENDING_APPROVAL" in str(reviewer_msgs[-1])

        if pending_request and not is_approved:
            db_state["status"] = "PAUSED_FOR_HITL"
        else:
            db_state["status"] = "COMPLETED"

    except Exception as e:
        db_state["status"] = "FAILED"
        db_state["chat_history"].append({
            "agent": "System",
            "content": f"Fatal Error: {str(e)}",
            "type": "error",
        })

    try:
        db_state["autogen_state"] = await team.save_state()
    except Exception:
        pass

    await db_service.save_state(db_state)


# ── Core Workflow Endpoints ───────────────────────────────────────────────────

@app.post("/api/workflow/start")
async def start_workflow(request: TaskRequest, background_tasks: BackgroundTasks):
    session_id = request.session_id or f"ORCH-{str(uuid.uuid4())[:8].upper()}"
    enabled_mcps = getattr(request, "enabled_mcps", [])
    hitl_enabled = getattr(request, "hitl_enabled", True)

    initial_state = {
        "session_id": session_id,
        "status": "ACTIVE",
        "original_prompt": request.prompt,
        "is_approved": False,
        "chat_history": [
            {"agent": "User", "role": "user", "content": request.prompt}
        ],
        "enabled_mcps": enabled_mcps,
        "hitl_enabled": hitl_enabled,
        "autogen_state": None,
        "created_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat()
    }
    await db_service.save_state(initial_state)

    background_tasks.add_task(run_workflow, session_id, request.prompt)

    try:
        async with ServiceBusClient.from_connection_string(settings.SERVICE_BUS_CONNECTION_STRING) as client:
            sender = client.get_queue_sender(queue_name=settings.SERVICE_BUS_QUEUE_NAME)
            msg_payload = {"session_id": session_id, "action": "START", "prompt": request.prompt}
            message = ServiceBusMessage(json.dumps(msg_payload))
            await sender.send_messages(message)
    except Exception as e:
        print(f"Notice: Service Bus dispatch skipped ({str(e)}). Running locally via BackgroundTasks.")

    return {"session_id": session_id, "status": "Workflow Initialized"}


@app.get("/api/workflow/{session_id}/stream")
async def stream_workflow_status(session_id: str, request: Request, start: int = 0):
    """Server-Sent Events stream — polls Cosmos DB for new agent messages."""
    async def event_generator():
        last_message_count = start
        while True:
            if await request.is_disconnected():
                break
            state = await db_service.get_state(session_id)
            if not state:
                yield f"data: {json.dumps({'error': 'Session not found'})}\n\n"
                break

            current_messages = state.get("chat_history", [])
            status = state.get("status")

            if len(current_messages) > last_message_count or status in ["PAUSED_FOR_HITL", "COMPLETED", "FAILED"]:
                new_msgs = current_messages[last_message_count:]
                last_message_count = len(current_messages)
                payload = {"status": status, "new_logs": new_msgs}
                yield f"data: {json.dumps(payload)}\n\n"

            if status in ["PAUSED_FOR_HITL", "COMPLETED", "FAILED"] and len(current_messages) == last_message_count:
                break
            await asyncio.sleep(1)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/api/workflow/approve")
async def approve_workflow(request: ApprovalRequest, background_tasks: BackgroundTasks):
    state = await db_service.get_state(request.session_id)
    if not state or state["status"] != "PAUSED_FOR_HITL":
        raise HTTPException(status_code=400, detail="Workflow not awaiting approval")

    if request.feedback.strip().lower() == "approve":
        state["is_approved"] = True
        state["status"] = "ACTIVE"
        feedback = "Human Approved. Planners/Researchers/Executors: do nothing, pass to Reviewer. Reviewer: YOU MUST NOT output 'STATUS: PENDING_APPROVAL' anymore. Output the final, well-structured, comprehensive markdown summary of the execution for the user. End your message with exactly the single word COMPLETE_WORKFLOW. Finalizer: Please structure the final output."
    else:
        state["is_approved"] = False
        state["status"] = "ACTIVE"
        feedback = f"User Feedback: {request.feedback}"

    await db_service.save_state(state)

    background_tasks.add_task(run_workflow, request.session_id, state.get("original_prompt", ""), feedback)

    try:
        async with ServiceBusClient.from_connection_string(settings.SERVICE_BUS_CONNECTION_STRING) as client:
            sender = client.get_queue_sender(queue_name=settings.SERVICE_BUS_QUEUE_NAME)
            msg_payload = {"session_id": request.session_id, "action": "RESUME", "feedback": feedback}
            message = ServiceBusMessage(json.dumps(msg_payload))
            await sender.send_messages(message)
    except Exception:
        pass

    return {"status": "Workflow Resumed"}


@app.post("/api/workflow/chat")
async def send_chat_message(request: ChatRequest):
    state = await db_service.get_state(request.session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
        
    state["status"] = "ACTIVE"
    if "chat_history" not in state: state["chat_history"] = []
    state["chat_history"].append({"agent": "User", "role": "user", "content": request.message})
    await db_service.save_state(state)
    
    try:
        async with ServiceBusClient.from_connection_string(settings.SERVICE_BUS_CONNECTION_STRING) as client:
            sender = client.get_queue_sender(queue_name=settings.SERVICE_BUS_QUEUE_NAME)
            msg_payload = {"session_id": request.session_id, "action": "CHAT", "prompt": request.message}
            message = ServiceBusMessage(json.dumps(msg_payload))
            await sender.send_messages(message)
    except Exception:
        pass
        
    return {"status": "Message sent"}


@app.delete("/api/workflow/{session_id}")
async def delete_workflow(session_id: str):
    await db_service.delete_state(session_id)
    return {"status": "success", "session_id": session_id}


@app.post("/api/upload")
async def upload_document(session_id: str = Form(...), file: UploadFile = File(...)):
    try:
        content = await file.read()
        
        # Offload heavy CPU work to threadpool to avoid blocking FastAPI
        def process_doc(c, filename):
            t = extract_text_from_file(c, filename)
            chr = chunk_text(t, chunk_size=800, overlap=100)
            if not chr: return None, None
            emb = embed_texts(chr)
            return chr, emb
            
        chunks, embeddings = await run_in_threadpool(process_doc, content, file.filename)
        
        if not chunks:
            return {"status": "error", "message": "No text extracted from document"}
        
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_id = f"{uuid.uuid4().hex[:8]}"
            metadata = {"filename": file.filename, "chunk_index": i}
            await db_service.save_chunk(session_id, chunk_id, chunk, embedding, metadata)
            
        return {"status": "success", "chunks_processed": len(chunks), "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        

@app.get("/api/mcp")
async def get_mcp_configs():
    configs = await db_service.get_mcp_configs()
    return {"configs": configs}

@app.post("/api/mcp")
async def save_mcp_config(config: Dict[str, Any]):
    if "id" not in config:
        config["id"] = f"mcp-{str(uuid.uuid4())[:8]}"
    await db_service.save_mcp_config(config)
    return config

@app.delete("/api/mcp/{mcp_id}")
async def delete_mcp_config(mcp_id: str):
    await db_service.delete_mcp_config(mcp_id)
    return {"status": "success"}


# ── Existing History, Profile, and Logs Endpoints (Your Code) ─────────────────

@app.get("/api/history")
async def get_history():
    workflows = await db_service.get_all_workflows()
    return {"tasks": workflows}

@app.get("/api/workflow/{session_id}")
async def get_workflow_detail(session_id: str):
    state = await db_service.get_state(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    return state

@app.get("/api/profile")
async def get_profile():
    return await db_service.get_user_profile()

@app.put("/api/profile")
async def update_profile(profile: UserProfile):
    await db_service.save_user_profile(profile.model_dump())
    return {"status": "Profile updated successfully"}

@app.get("/api/logs/recent")
async def get_recent_global_logs():
    recent_runs = await db_service.get_recent_logs()
    global_logs = []
    for run in recent_runs:
        for msg in run.get("chat_history", []):
            global_logs.append({
                "session_id": run.get("session_id"),
                "agent": msg.get("agent"),
                "content": msg.get("content"),
                "type": msg.get("type"),
            })
    return {"logs": global_logs}