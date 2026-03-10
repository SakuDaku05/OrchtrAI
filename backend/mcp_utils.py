from typing import Any, Dict, List
from autogen_core.tools import FunctionTool
from backend.mcp.base import BaseConnector

def create_autogen_tool(connector: BaseConnector, tool_def: Dict[str, Any]) -> FunctionTool:
    """
    Wraps an MCP connector's tool into an AutoGen FunctionTool.
    """
    tool_name = tool_def["name"]
    
    async def tool_fn(**kwargs) -> Any:
        return await connector.execute_tool(tool_name, kwargs)
    
    return FunctionTool(
        tool_fn,
        name=tool_name,
        description=tool_def["description"]
    )

async def get_mcp_tools(connector: BaseConnector) -> List[FunctionTool]:
    """
    Retrieves all tools from a connector and wraps them for AutoGen.
    """
    tools_defs = await connector.get_tools()
    return [create_autogen_tool(connector, td) for td in tools_defs]
