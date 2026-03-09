# Assembles the Planner, Researcher, Executor, etc.
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import SelectorGroupChat
from autogen_agentchat.conditions import TextMessageTermination, MaxMessageTermination
from autogen_ext.models.openai import OpenAIChatCompletionClient
from backend.config import settings
from backend.tools import duckduckgo_tool, calendar_tool, make_rag_tool

def build_orchestrai_team(session_id: str):
    # model_info is required for non-OpenAI model names
    from autogen_core.models import ModelInfo
    
    def make_client(api_key: str, model_name: str) -> OpenAIChatCompletionClient:
        return OpenAIChatCompletionClient(
            model=model_name,
            api_key=api_key,
            base_url=settings.GROQ_BASE_URL,
            model_info=ModelInfo(
                vision=False,
                function_calling=True,
                json_output=False,
                family="unknown",
                structured_output=False,
            ),
        )

    # Model 1: gpt-oss-120b (Researcher / Executor)
    # Model 2: llama-3.3-70b-versatile (Planner / Reviewer)
    # Model 3: qwen-2.5-32b (Finalizer)
    smart_client      = make_client(settings.GROQ_API_KEY_2, settings.GROQ_MODEL_2)
    fast_client       = make_client(settings.GROQ_API_KEY_1, settings.GROQ_MODEL_1)
    qwen_client       = make_client(settings.GROQ_API_KEY_1, settings.FINALIZER_MODEL)

    # -- Define Agents --
    planner = AssistantAgent(
        name="Planner",
        model_client=smart_client,
        system_message="""You are the Architect. Decompose the user's objective into a step-by-step plan (MAXIMUM 3 steps). Be extremely concise. Do NOT write long paragraphs.
        Assign steps to Researcher or Executor. Do NOT execute tools yourself."""
    )

    researcher = AssistantAgent(
        name="Researcher",
        model_client=fast_client,
        tools=[make_rag_tool(session_id), duckduckgo_tool],
        system_message="""You are the Researcher.
        Use web search or internal document search to find facts and answer deep questions. Always cite your sources. Make EXACTLY ONE tool call at a time. Wait for the result before analyzing or making another.
        BE EXTREMELY CONCISE. Do not exceed 2 short paragraphs per turn."""
    )

    executor = AssistantAgent(
        name="Executor",
        model_client=fast_client,
        tools=[calendar_tool],
        system_message="""You are the Executor. You manage tools like scheduling calendars and invoking webhooks.
        Execute the physical tasks requested by the user or planned by the Planner. Keep your responses highly concise."""
    )

    reviewer = AssistantAgent(
        name="Reviewer",
        model_client=fast_client,
        system_message="""You are Quality Control. Review the Executor's output. Keep it very short. If flawed, provide 1 sentence of feedback. If the task is correct, instruct the Finalizer to generate the final summary."""
    )

    finalizer = AssistantAgent(
        name="Finalizer",
        model_client=qwen_client,
        system_message="""You are the Finalizer. Provide a versatile, comprehensive summary of the entire operation combining the views and conclusions of the Planner, Researcher, and Executor.
        You MUST format your response beautifully in Markdown. You should use tables and graphs (e.g. ASCII or Markdown tables) to present data clearly whenever applicable.
        Make it highly readable for the user. Once your summary is fully complete, you MUST end your message exactly with the string 'STATUS: PENDING_APPROVAL' on a new line to request human approval."""
    )

    # -- Terminations --
    # Stop if the Reviewer calls for HITL, or as a fallback stop after max messages.
    from autogen_agentchat.conditions import TextMentionTermination
    hitl_termination = TextMentionTermination("STATUS: PENDING_APPROVAL")
    max_term = MaxMessageTermination(6) # Cap turns to strictly prevent context blowouts
    termination = hitl_termination | max_term
    
    # -- Create Team using RoundRobin routing --
    # This forces a strict sequence: Planner -> Researcher -> Executor -> Reviewer -> Finalizer
    from autogen_agentchat.teams import RoundRobinGroupChat
    team = RoundRobinGroupChat(
        [planner, researcher, executor, reviewer, finalizer],
        termination_condition=termination
    )
    
    return team