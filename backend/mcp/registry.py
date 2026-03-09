import importlib
import inspect
from typing import Dict, Type, Any, List
from backend.mcp.base import BaseConnector

class MCPRegistry:
    """
    Central registry for MCP connectors.
    Handles dynamic loading and lazy initialization of connector instances.
    """
    
    def __init__(self):
        self._connectors: Dict[str, Type[BaseConnector]] = {}
        self._instances: Dict[str, BaseConnector] = {}

    def register(self, service_name: str, connector_class: Type[BaseConnector]):
        """Explicitly register a connector class."""
        self._connectors[service_name] = connector_class

    async def get_instance(self, service_name: str, config: Dict[str, Any]) -> BaseConnector:
        """
        Retrieve or create a connector instance.
        Lazy initialization ensures we don't waste resources on unused services.
        """
        if service_name not in self._instances:
            if service_name not in self._connectors:
                # Try to discovery in connectors sub-package if not registered
                try:
                    module = importlib.import_module(f"backend.mcp.connectors.{service_name}")
                    for name, obj in inspect.getmembers(module):
                        if inspect.isclass(obj) and issubclass(obj, BaseConnector) and obj is not BaseConnector:
                            self._connectors[service_name] = obj
                            break
                except ImportError:
                    raise ValueError(f"No connector found for service: {service_name}")

            connector_class = self._connectors[service_name]
            instance = connector_class(config)
            await instance.connect()
            self._instances[service_name] = instance
        
        return self._instances[service_name]

    async def shutdown(self):
        """Clean up all active connector instances."""
        for instance in self._instances.values():
            await instance.disconnect()
        self._instances.clear()

mcp_registry = MCPRegistry()
