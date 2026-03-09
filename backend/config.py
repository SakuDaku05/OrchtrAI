# Loads environment variables
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Groq API Configuration
    GROQ_API_KEY_1: str
    GROQ_MODEL_1: str = "openai/gpt-oss-20b"
    GROQ_API_KEY_2: str
    GROQ_MODEL_2: str = "llama-3.3-70b-versatile"
    FINALIZER_MODEL: str = "qwen/qwen3-32b"         
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    SERPER_API_KEY: str = ""                        
    
    # Azure Phi-4 LLM (optional - not required for core workflow)
    PHI4_API_KEY: Optional[str] = None
    PHI4_ENDPOINT: Optional[str] = None
    PHI4_TARGET_URI: Optional[str] = None
    PHI4_MODEL: str = "phi-4"
    
    # Azure Infrastructure
    COSMOS_DB_ENDPOINT: str
    COSMOS_DB_KEY: str
    COSMOS_DB_DATABASE: str = "orchestrai_db"
    COSMOS_DB_CONTAINER: str = "workflow_states"
    
    SERVICE_BUS_CONNECTION_STRING: str
    SERVICE_BUS_QUEUE_NAME: str = "agent-tasks"

    # Spotify MCP
    SPOTIFY_CLIENT_ID: str = ""
    SPOTIFY_CLIENT_SECRET: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()