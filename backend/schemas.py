# Pydantic models for data validation
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class TaskRequest(BaseModel):
    prompt: str = Field(..., description="The user's high-level objective")
    session_id: Optional[str] = None

class WorkflowState(BaseModel):
    session_id: str
    status: str = Field(default="PENDING", description="PENDING, ACTIVE, PAUSED_FOR_HITL, COMPLETED, FAILED")
    original_prompt: str
    autogen_state: Optional[Dict[str, Any]] = Field(default=None, description="Serialized AutoGen team state")
    chat_history: List[Dict[str, Any]] = []
    created_at: str
    updated_at: str

class ApprovalRequest(BaseModel):
    session_id: str
    approved: bool
    feedback: Optional[str] = None

class ChatRequest(BaseModel):
    session_id: str
    message: str = Field(..., description="The user's follow-up message")