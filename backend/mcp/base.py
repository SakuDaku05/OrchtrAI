from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

class BaseConnector(ABC):
    """
    Abstract Base Class for all MCP Connectors.
    All methods are asynchronous to ensure non-blocking execution.
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.is_connected = False

    @abstractmethod
    async def connect(self) -> bool:
        """Initialize connection to the service."""
        pass

    @abstractmethod
    async def disconnect(self):
        """Clean up connection resources."""
        pass

    @abstractmethod
    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """Invoke a specific tool provided by this connector."""
        pass

    @abstractmethod
    async def get_tools(self) -> List[Dict[str, Any]]:
        """Return a list of available tools in AutoGen/OpenAI format."""
        pass

    @abstractmethod
    async def get_resource(self, uri: str) -> Any:
        """Read a specific resource (GET data)."""
        pass
