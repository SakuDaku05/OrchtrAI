from fastapi import FastAPI, HTTPException, BackgroundTasks, File, UploadFile, Form
from fastapi.concurrency import run_in_threadpool
from backend.schemas import TaskRequest, WorkflowState, ApprovalRequest, ChatRequest
from backend.database import db_service
from backend.rag import extract_text_from_file, chunk_text, embed_texts
from azure.servicebus.aio import ServiceBusClient
from azure.servicebus import ServiceBusMessage
from backend.config import settings
import uuid
import datetime
import json

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="OrchestrAI API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await db_service.init_db()

@app.get("/api/history")
async def get_workflow_history():
    sessions = await db_service.get_recent_sessions()
    return {"sessions": sessions}


@app.post("/api/workflow/start")
async def start_workflow(request: TaskRequest):
    session_id = request.session_id or f"ORCH-{str(uuid.uuid4())[:8].upper()}"
    
    # 1. Initialize State in Cosmos DB
    initial_state = {
        "session_id": session_id,
        "status": "ACTIVE",
        "chat_history": [{"role": "user", "agent": "User", "content": request.prompt}],
        "created_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat()
    }
    await db_service.save_state(initial_state)

    # 2. Push Job to Azure Service Bus
    async with ServiceBusClient.from_connection_string(settings.SERVICE_BUS_CONNECTION_STRING) as client:
        sender = client.get_queue_sender(queue_name=settings.SERVICE_BUS_QUEUE_NAME)
        msg_payload = {"session_id": session_id, "action": "START", "prompt": request.prompt}
        message = ServiceBusMessage(json.dumps(msg_payload))
        await sender.send_messages(message)

    return {"session_id": session_id, "status": "Workflow Initialized in Background"}

@app.get("/api/workflow/{session_id}")
async def get_workflow_status(session_id: str):
    state = await db_service.get_state(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    return state

@app.post("/api/workflow/approve")
async def approve_workflow(request: ApprovalRequest):
    state = await db_service.get_state(request.session_id)
    if not state or state["status"] != "PAUSED_FOR_HITL":
        raise HTTPException(status_code=400, detail="Workflow not awaiting approval")

    # Send Resume command to Service Bus
    async with ServiceBusClient.from_connection_string(settings.SERVICE_BUS_CONNECTION_STRING) as client:
        sender = client.get_queue_sender(queue_name=settings.SERVICE_BUS_QUEUE_NAME)
        msg_payload = {
            "session_id": request.session_id, 
            "action": "RESUME", 
            "feedback": request.feedback if not request.approved else "Human Approved. Execute final."
        }
        message = ServiceBusMessage(json.dumps(msg_payload))
        await sender.send_messages(message)
    
    state["status"] = "ACTIVE"
    await db_service.save_state(state)
    return {"status": "Workflow Resumed"}

@app.post("/api/workflow/chat")
async def send_chat_message(request: ChatRequest):
    state = await db_service.get_state(request.session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
        
    state["status"] = "ACTIVE"
    await db_service.save_state(state)
    
    # Send CHAT command to Service Bus
    async with ServiceBusClient.from_connection_string(settings.SERVICE_BUS_CONNECTION_STRING) as client:
        sender = client.get_queue_sender(queue_name=settings.SERVICE_BUS_QUEUE_NAME)
        msg_payload = {"session_id": request.session_id, "action": "CHAT", "prompt": request.message}
        message = ServiceBusMessage(json.dumps(msg_payload))
        await sender.send_messages(message)
        
    return {"status": "Message sent"}

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
        
        import uuid
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_id = f"{uuid.uuid4().hex[:8]}"
            metadata = {"filename": file.filename, "chunk_index": i}
            await db_service.save_chunk(session_id, chunk_id, chunk, embedding, metadata)
            
        return {"status": "success", "chunks_processed": len(chunks), "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))