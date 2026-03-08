# OrchestrAI Presentation

---

## Slide 1: Problem Statement & Context
*(Keep to 5-6 crisp bullet points)*

**The "Tab-Switching" Epidemic for PMs & Ops Leads**

*   **Who the user is:** Project Managers, Ops Leads, and Startup Teams in SMBs.
*   **The Challenge:** Users drown in "tab-switching" (Slack, email, Jira), managing work rather than doing it.
*   **The Gap in Current AI:** Existing generative AI acts as a passive dictionary or typist; it cannot *execute* multi-step tool workflows autonomously.
*   **Why Solve Now?:** 70% of employees want to delegate administrative "busywork" to AI to regain strategic bandwidth (Microsoft Research).
*   **The Missing Link:** A secure, orchestrated framework linking reasoning securely to real-world impact.
*   **Impact if Unsolved:** Crippling "status update fatigue," stalled productivity, and a rigid ceiling on team scaling.

---

## Slide 2: Solution Overview
*(High-level executive summary)*

**OrchestrAI: A Digital Workforce, Not a Chatbot**

*   **What it is:** An autonomous, multi-agent orchestration framework wrapped in a "Mission Control" web interface. 
*   **Primary Value:** Enables **"Delegation at Scale"** by translating natural language goals into researched, coordinated, and executable API actions. 
*   **The Workflow:** 
    1. **Assign:** User inputs a vague objective (e.g., "Set up launch review").
    2. **Orchestrate:** Framework assigns sub-tasks to specialized sub-agents.
    3. **Verify:** System strictly halts, presenting drafted actions for a final "thumbs up".
    4. **Execute:** Target APIs trigger securely.
*   **Our Distinct Advantage:** **Enterprise Safety.** We eliminate hallucination fears via mandated Human-in-the-Loop (HITL) checkpoints and a decoupled asynchronous backend.

---

## Slide 3: Key Features & User Flow
*(3-5 Top Features + Flow Diagram)*

**Top Technical Features**
1.  **Multi-Agent Topology:** Specialized personas (Planner, Researcher, Executor, Reviewer) powered by AutoGen.
2.  **Tiered Model Strategy:** Framework-agnostic routing matching task complexity to cost-effective models (Frontier LLMs vs SLMs).
3.  **Strict HITL Halts:** Agents cannot mutate external states; they must output `PENDING_APPROVAL` for manual sign-off.
4.  **Async Brokering:** Azure Service Bus decouples heavy LLM logic from the UI, ensuring zero timeouts.

**User Flow Diagram** *(Keep it clean and visual)*
```mermaid
sequenceDiagram
    actor User
    participant App as Mission Control (React)
    participant Core as API + Stateful DB
    participant Agents as AutoGen Swarm

    User->>App: Submits Goal
    App->>Core: Queues Task 
    activate Agents
    Core->>Agents: Async Trigger
    Agents->>Agents: Planner > Researcher > Executor > Reviewer
    Agents->>Core: Saves drafted payload + Triggers PAUSE
    deactivate Agents
    Core-->>App: Displays HITL Approval Card
    User->>App: Clicks "Approve"
    App->>Core: Queues Resume Event
    Core->>Agents: Reactivates securely
    Agents-->>Core: Fires external API / Marks COMPLETED
```

---

## Slide 4: Architecture & Technology Approach
*(Conceptual System Design)*

**Built for Azure-Native Scalability and Security**
*   **Frontend Display:** React Dashboard streaming agent telemetry and HITL cards.
*   **Asynchronous Spine:** Azure Service Bus queueing to handle unbounded multi-agent loop latencies.
*   **Stateful Workflows:** Azure Cosmos DB (NoSQL) persists conversational memory across infinite pauses.
*   **Agent Execution:** Scale-to-zero Azure Container Apps running Python worker nodes and AutoGen libraries. 

**System Architecture Visual**
```mermaid
flowchart LR
    A[React Dashboard] <-->|Async Polling| B{FastAPI Gateway}
    
    B -->|Save State| C[(Cosmos DB)]
    B -->|Queue Event| D[[Service Bus]]
    
    D --> E[Azure Container Workers]
    E <-->|Re-hydrate memory| C
    
    subgraph Swarm ["AutoGen Multi-Agent Core"]
        P[Planner] --> R[Researcher]
        R --> X[Executor]
        X --> V[Reviewer]
    end
    E --> Swarm
    
    Swarm -.->|Web Search| Web((Public Web))
    Swarm ==>|Drafts PAUSE Payload| C
    E -.->|Fires Action ON APPROVAL| F((Target APIs))
    
    style B fill:#0078D4,color:#fff
    style C fill:#0078D4,color:#fff
    style D fill:#0078D4,color:#fff
    style E fill:#0078D4,color:#fff
```

---

## Slide 5: Design Decisions & Trade-offs
*(Demonstrate Maturity)*

**Strategic Prioritization vs. Hackathon Realities**

*   **Prioritized:** **Total Decoupling over Monoliths.** We used asynchronous queues (Service Bus) rather than simple synchronous APIs to ensure long LLM reasoning loops wouldn't crash web browsers with timeouts. 
*   **Prioritized:** **Security by Design.** We stripped agents of autonomous writing permissions. Speed is useless without trust; the hard HITL pause is a mandatory feature, not a bug. 
*   **Trade-off:** **Frontend Polling over WebSockets.** Implementing distributed WebSocket state across container workers is complex. We opted for stable Cosmos DB HTTP polling to guarantee reliability over flashy live-typing animations.
*   **Trade-off:** **Curated Tools vs. Open Sandboxes:** We mocked deep OAuth API integrations (like MsGraph) and sandboxed agents to pre-approved wrappers to mitigate immediate security risks during this sprint.

---

## Slide 6: Current Status & Next Steps
*(Honesty on Prototype vs. Product)*

**Where we are, and where we're going:**

*   **Fully Functional Today:** 
    * The AutoGen framework successfully distributes sub-roles. 
    * Asynchronous Service Bus buffering prevents all API timeouts.
    * The Cosmos DB HITL pipeline reliably suspends and resumes memory. 
*   **Known Prototype Limitations:**
    * The "Executor" targets dummy enterprise endpoints for speed.
    * Polling latency under heavy load can feel slower than true sockets.
*   **Planned Refinements (Mentorship Goals):**
    * **OAuth 2.0 Integration:** Passing user tokens (Azure AD) to agents to ensure they execute actions strictly on behalf of the authenticated user.
    * **SignalR Migration:** Upgrading frontend polling to Azure SignalR for true real-time, low-latency telemetry streaming.
    * **"Time-Travel" Memory:** Allowing users to reject an agent's plan, rewind state, and fork a new simulation timeline.
