**Name of your Institute:** IIT (Indian School of Mines), Dhanbad  
**Your Team Name:** Claude_Grok_Grok_Grok  
**Challenge Area:** Track 4 Agent Teamwork  
**Registered Email ID:** 23je0569@iitism.ac.in  
**Project Title:** OrchestrAI  

---

## The Team

We’re a mix of developers and AI geeks who just really love building things that automate real world problems. Between us, we’ve got backend engineers who wrangle distributed systems, frontend folks who care about how things actually feel to use, and AI practitioners who spend way too much time tweaking large language models.

When we saw AI Unlocked, we knew we had to jump in. Honestly, we think the whole "single chatbot" phase is just the tip of the iceberg. The real magic happens when multiple AI agents can actually work together to plan and pull off complex workflows. Track 4 caught our eye right away because we’re all about multi agent setups. It basically gave us the perfect excuse to get our hands dirty and build a solid, real world agent framework using Microsoft’s tech stack.

## The Concept

Let’s be honest: most of us spend way too much time just managing work. We bounce between emails, docs, and calendars just to get one thing moving. Chatbots are great for answering questions, but they’re passive; they don't actually finish the job for you.

### Our Fix (TaskWeaver):

We wanted to stop talking about automation and actually build it. We created a system where specialized agents work together like a mini team, rather than one big model trying to do it all:

- **The Planner:** Acts as the strategist. It takes a messy human request and turns it into a logical step by step plan.
- **The Researcher:** Handles the context. It digs through documents or the web so the output isn't just generic fluff.
- **The Executor:** The "hands" of the operation. It hits the APIs to actually send the email, book the slot, or generate the report.
- **The Reviewer:** The safety net. It sanity checks the work because nobody wants to accidentally send a hallucination to their boss.

### How it works in practice:

If you say, "Set up a project kickoff for next Tuesday," the system doesn't just give you a text response. Instead, the agents team up to:

- Figure out the agenda items.
- Find a focused time slot and send the invite.
- Draft the summary email.
- Hand it to you for a final "thumbs up."

It’s less about generating text and more about acting like a functional teammate.

## Target Audience or Market

We’re targeting the people who are tired of "managing" work instead of doing it:

- Startup teams (who are usually drowning in chaos).
- Project Managers (who spend half their day just chasing updates).
- Operations teams (who need real workflows, not just chat).
- SMBs (Small businesses that can't afford a massive staff).
- Remote teams (where "async" work is the only way to survive).

### Where it lives:

- **Right now:** It’s a standalone Web App.
- **Next up:** Deep integration into Microsoft Teams (because that’s where the enterprise actually lives).

### Why the timing is right:

The market is basically screaming for this:

- **The need is real:** Microsoft found that 70% of employees would happily hand off their busywork to AI just to get some time back.
- **The scale is massive:** In India alone, there are over 63 million small businesses looking for efficiency.
- **The growth is there:** The project management space is racing toward $15 billion by 2030.

We aren't just building a tool; we're tapping into a massive desire to automate the boring stuff.

## Personas

### The Real People We’re Solving For:

**Priya Sharma (The Overwhelmed PM)**
- **Who she is:** A 29 year old in Bangalore trying to wrangle a remote team of 12.
- **The daily grind:** She spends half her day just "tab switching" jumping between Slack, email, and docs trying to figure out where the project actually stands.
- **What she craves:** Speed. She wants the busywork to disappear so she can actually manage the product, not just the people.
- **The big headache:** She feels like a "human nagger," constantly chasing people for updates manually.

**Arjun Mehta (The Buried Ops Lead)**
- **Who he is:** A 35 year old in Pune keeping the lights on for a growing SME.
- **The daily grind:** He’s stuck doing the heavy lifting on the unglamorous stuff compliance, reporting, and endless scheduling.
- **What he craves:** Structure. He needs documentation that is clean, reliable, and doesn't require him to fix it every time.
- **The big headache:** He knows he should be focusing on strategy, but he's too bogged down in admin work to even think about the big picture.

## How it works:

We built TaskWeaver AI as a distributed multi-agent system powered by Microsoft technologies.

### Step-by-Step Flow:
1. The user submits a high-level request via web interface.
2. The Planner Agent decomposes it into subtasks.
3. Specialized agents are triggered in sequence or parallel.
4. Agents communicate through a structured message bus.
5. Final output is validated by the Reviewer Agent.
6. Users receive consolidated results.

Microsoft technologies make this feasible by providing:
- Enterprise-grade LLMs
- Scalable cloud hosting
- Secure identity management
- Observability and monitoring

## Core Technologies

- Microsoft AutoGen (multi-agent orchestration)
- Azure OpenAI Service (LLM reasoning)
- Azure Container Apps (scalable agent deployment)
- Azure Service Bus (agent communication)
- Azure Cosmos DB (state management)
- React (frontend)
- Node.js / Python FastAPI (backend)
- Docker (containerization)

## The Business Plan:

### Revenue Model:
- **Freemium SaaS model**
- **Tiered subscriptions:**
  - **Free Tier:** limited tasks per month
  - **Pro Tier:** unlimited workflows + integrations
  - **Enterprise Tier:** custom agent workflows + on-prem deployment

### Go-To-Market:
- Target startup communities
- Integrate with Microsoft Teams and productivity tools
- Offer API access for businesses

### Competitive Advantage:
- True multi agent orchestration (not just chatbot)
- Modular agent architecture
- Enterprise-ready security via Microsoft Azure

---

**GitHub Repository:** [https://github.com/5AIhil/OrchestrAI](https://github.com/5AIhil/OrchestrAI)  
**Demo Video:** [https://drive.google.com/drive/folders/1LCTMgrhP5KUz7tVAzE-617uCzoN7W3Vj?usp=sharing](https://drive.google.com/drive/folders/1LCTMgrhP5KUz7tVAzE-617uCzoN7W3Vj?usp=sharing)