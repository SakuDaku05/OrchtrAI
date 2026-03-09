# Assembles the Planner, Researcher, Executor, etc.
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.conditions import TextMentionTermination, MaxMessageTermination
from autogen_ext.models.openai import OpenAIChatCompletionClient
from backend.config import settings
from backend.tools import duckduckgo_tool, calendar_tool

def build_orchestrai_team(extra_tools: list = None, hitl_enabled: bool = True):
    # model_info is required for non-OpenAI model names
    from autogen_core.models import ModelInfo

    if extra_tools is None:
        extra_tools = []

    def make_client(api_key: str) -> OpenAIChatCompletionClient:
        return OpenAIChatCompletionClient(
            # Use Groq for speed and reliable tool use
            model=settings.GROQ_MODEL_1,
            api_key=api_key,
            base_url=settings.GROQ_BASE_URL,
            model_info=ModelInfo(
                vision=False,
                function_calling=True,
                json_output=True,
                family="unknown",
                structured_output=False,
            ),
        )

    # Use GROQ keys to distribute rate limits
    planner_client   = make_client(settings.GROQ_API_KEY_1)
    researcher_client = make_client(settings.GROQ_API_KEY_1)
    executor_client  = make_client(settings.GROQ_API_KEY_2)
    reviewer_client  = make_client(settings.GROQ_API_KEY_2)

    # -- Define Agents --
    planner = AssistantAgent(
        name="Planner",
        model_client=planner_client,
        system_message="You are the Architect. Decompose the user's objective into a step-by-step plan. Assign steps to Researcher or Executor. Do NOT execute tools yourself."
    )

    researcher = AssistantAgent(
        name="Researcher",
        model_client=researcher_client,
        tools=[duckduckgo_tool],
        system_message="""You are the Context Gatherer. Use search tools to find facts. Return clear data for the Executor to use.
        NOTE: If search returns no results, try broader or different keywords before giving up."""
    )

    # Executor gets standard tools + any dynamic MCP tools
    executor = AssistantAgent(
        name="Executor",
        model_client=executor_client,
        tools=[calendar_tool] + extra_tools,
        system_message="You are the Executor. You execute APIs based on the Planner's instructions and Researcher's data."
    )

    # Determine reviewer instruction based on HITL setting
    hitl_instruction = "IMPORTANT: If the work requires human approval, output exactly: STATUS: PENDING_APPROVAL" if hitl_enabled else "NOTE: Human-In-The-Loop approval is DISABLED. Proceed immediately to approval if the executor's output is factually correct."

    reviewer = AssistantAgent(
        name="Reviewer",
        model_client=reviewer_client,
        system_message=f"""You are Quality Control.
        1. {hitl_instruction}
        2. If the work is already approved or complete, output exactly: Quality Control: approved. Finalizer, please output the final summary.
        3. If there are errors, provide feedback to the Executor."""
    )

    finalizer = AssistantAgent(
        name="Finalizer",
        model_client=make_client(settings.GROQ_API_KEY_2),
        system_message="""You are the Presenter. Convert technical results into a premium, beautiful summary.
        1. USE RICH MARKDOWN: Use tables for lists, bold headers, and clean bullet points.
        2. STYLISH PRESENTATION: Organize information clearly. If providing songs or data, ALWAYS use an MKDN Table.
        3. FONT & TONE: Use a classy, professional, and helpful tone.
        4. End your message with exactly: TERMINATE"""
    )

    # -- Terminations --
    # Stop if Reviewer asks for HITL, or if Finalizer outputs TERMINATE.
    hitl_termination = TextMentionTermination("STATUS: PENDING_APPROVAL")
    done_termination = TextMentionTermination("TERMINATE")
    fallback_termination = MaxMessageTermination(max_messages=25)
    termination_condition = hitl_termination | done_termination | fallback_termination

    # -- Create Team --
    team = RoundRobinGroupChat(
        participants=[planner, researcher, executor, reviewer, finalizer],
        termination_condition=termination_condition
    )
    
    return team
