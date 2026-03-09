# Assembles the Planner, Researcher, Executor, etc.
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import SelectorGroupChat
from autogen_agentchat.conditions import TextMentionTermination, MaxMessageTermination
from autogen_ext.models.openai import OpenAIChatCompletionClient
from backend.config import settings
from backend.tools import duckduckgo_tool, calendar_tool

def build_orchestrai_team(is_approved: bool = False, extra_tools: list = None, hitl_enabled: bool = True):
    # model_info is required for non-OpenAI model names
    from autogen_core.models import ModelInfo

    if extra_tools is None:
        extra_tools = []
        
    def make_client(api_key: str, model_name: str) -> OpenAIChatCompletionClient:
        return OpenAIChatCompletionClient(
            model=model_name,
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

    # Retaining your distinct model choices for different cognitive loads
    planner_client    = make_client(settings.GROQ_API_KEY_2, settings.GROQ_MODEL_2)
    reviewer_client   = make_client(settings.GROQ_API_KEY_2, settings.GROQ_MODEL_2)
    researcher_client = make_client(settings.GROQ_API_KEY_1, settings.GROQ_MODEL_1)
    executor_client   = make_client(settings.GROQ_API_KEY_1, settings.GROQ_MODEL_1)
    finalizer_client  = make_client(settings.GROQ_API_KEY_2, getattr(settings, "FINALIZER_MODEL", settings.GROQ_MODEL_2))

    # -- Define Agents --
    planner = AssistantAgent(
        name="Planner",
        model_client=planner_client,
        description="Plans the workflow. Route to this agent first, or when the user provides new Feedback.",
        system_message="You are the Architect. Decompose the user's objective into a step-by-step plan. Assign steps to Researcher or Executor. Do NOT execute tools yourself."
    )

    researcher = AssistantAgent(
        name="Researcher",
        model_client=researcher_client,
        tools=[duckduckgo_tool],
        description="Gathers facts. Route here when the Planner asks for research.",
        system_message="""You are the Context Gatherer. Use search tools to find facts. Return clear data for the Executor to use.
        NOTE: If search returns no results, try broader or different keywords before giving up."""
    )

    executor = AssistantAgent(
        name="Executor",
        model_client=executor_client,
        tools=[calendar_tool] + extra_tools, # Dynamic tool injection!
        description="Executes APIs. Route here when the Planner asks for an action to be performed.",
        system_message="You are the Executor. You execute APIs based on the Planner's instructions and Researcher's data."
    )

    hitl_instruction = "IMPORTANT: For EVERY task, once the Executor has produced the desired result, you MUST output exactly 'STATUS: PENDING_APPROVAL' to ask for human approval. You must do this for every request before proceeding." if hitl_enabled else "NOTE: Human-In-The-Loop approval is DISABLED."

    reviewer = AssistantAgent(
        name="Reviewer",
        model_client=reviewer_client,
        description="Quality control. Route here only when the Executor has finished its task.",
        system_message=f"""You are Quality Control. Review the Executor's output.
        1. {hitl_instruction}
        2. If the human has explicitly approved the work (message contains "Human Approved"), you may pass it to the finalizer: 'Quality Control: approved. Finalizer, please output the final summary.'
        3. If the human provides feedback (message contains "User Feedback"), instruct the team to address the feedback.
        4. If there are errors, provide feedback to the Executor."""
    )

    finalizer = AssistantAgent(
        name="Finalizer",
        model_client=finalizer_client,
        description="Formats final output. Route here ONLY when the Reviewer has fully approved the work and tasks are complete.",
        system_message="""You are the Presenter. Convert technical results into a premium, beautiful summary.
        1. USE RICH MARKDOWN: Use tables for lists, bold headers, and clean bullet points.
        2. STYLISH PRESENTATION: Organize information clearly. If providing songs or data, ALWAYS use a Markdown Table.
        3. FONT & TONE: Use a classy, professional, and helpful tone.
        4. End your message with exactly: COMPLETE_WORKFLOW""" 
    )

    # -- Terminations --
    fallback_termination = MaxMessageTermination(max_messages=30)
    done_termination = TextMentionTermination("COMPLETE_WORKFLOW")

    if hitl_enabled and not is_approved:
        hitl_termination = TextMentionTermination("STATUS: PENDING_APPROVAL")
        termination_condition = hitl_termination | done_termination | fallback_termination
    else:
        termination_condition = done_termination | fallback_termination

    # -- Create Team --
    team = SelectorGroupChat(
        participants=[planner, researcher, executor, reviewer, finalizer], # Added finalizer to the group chat
        model_client=planner_client,
        termination_condition=termination_condition
    )
    
    return team