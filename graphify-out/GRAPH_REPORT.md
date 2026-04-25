# Graph Report - /Users/mohammedhasan/Github/Personal/loanpilot  (2026-04-25)

## Corpus Check
- Corpus is ~11,208 words - fits in a single context window. You may not need a graph.

## Summary
- 224 nodes · 284 edges · 25 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Bolna Voice Agent Flow|Bolna Voice Agent Flow]]
- [[_COMMUNITY_Backend Python Modules|Backend Python Modules]]
- [[_COMMUNITY_System Architecture|System Architecture]]
- [[_COMMUNITY_Pydantic Schemas|Pydantic Schemas]]
- [[_COMMUNITY_Frontend API Client|Frontend API Client]]
- [[_COMMUNITY_Select UI Component|Select UI Component]]
- [[_COMMUNITY_Campaign Routes & Bolna Client|Campaign Routes & Bolna Client]]
- [[_COMMUNITY_Database Bootstrap|Database Bootstrap]]
- [[_COMMUNITY_Dialog UI Component|Dialog UI Component]]
- [[_COMMUNITY_Table UI Component|Table UI Component]]
- [[_COMMUNITY_Badge UI Component|Badge UI Component]]
- [[_COMMUNITY_Leads Route Handlers|Leads Route Handlers]]
- [[_COMMUNITY_Summary Generation|Summary Generation]]
- [[_COMMUNITY_Card UI Component|Card UI Component]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_Home Page|Home Page]]
- [[_COMMUNITY_Dashboard Page|Dashboard Page]]
- [[_COMMUNITY_LeadsTable Component|LeadsTable Component]]
- [[_COMMUNITY_StatusBadge Component|StatusBadge Component]]
- [[_COMMUNITY_Sidebar Component|Sidebar Component]]
- [[_COMMUNITY_Button UI Component|Button UI Component]]
- [[_COMMUNITY_Skeleton UI Component|Skeleton UI Component]]
- [[_COMMUNITY_Next.js Agent Rules|Next.js Agent Rules]]
- [[_COMMUNITY_Public SVG Assets|Public SVG Assets]]
- [[_COMMUNITY_Dotenv Requirement|Dotenv Requirement]]

## God Nodes (most connected - your core abstractions)
1. `seed()` - 10 edges
2. `FastAPI Backend` - 10 edges
3. `Bolna Agent config (LoanPilot Pre-Qualification Agent)` - 10 edges
4. `Lead` - 8 edges
5. `Bolna Voice Agent` - 8 edges
6. `apiFetch()` - 7 edges
7. `Campaign` - 7 edges
8. `bolna_webhook()` - 7 edges
9. `POST /webhook/bolna endpoint` - 7 edges
10. `create_campaign()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `OpenAI gpt-4o-mini LLM` --semantically_similar_to--> `Claude claude-haiku-4-5-20251001`  [INFERRED] [semantically similar]
  bolna/SETUP.md → ARCHITECTURE.md
- `fastapi==0.115.0` --implements--> `FastAPI Backend`  [EXTRACTED]
  backend/requirements.txt → ARCHITECTURE.md
- `pydantic==2.9.0` --conceptually_related_to--> `FastAPI Backend`  [EXTRACTED]
  backend/requirements.txt → ARCHITECTURE.md
- `ngrok local dev tunnel` --references--> `FastAPI Backend`  [EXTRACTED]
  bolna/SETUP.md → ARCHITECTURE.md
- `Next.js frontend project` --implements--> `Next.js Dashboard`  [INFERRED]
  frontend/README.md → ARCHITECTURE.md

## Hyperedges (group relationships)
- **Bolna tool-call flow (agent -> webhook -> FastAPI services)** — architecture_bolna_voice_agent, architecture_tool_check_eligibility, architecture_tool_log_lead, architecture_webhook_bolna, architecture_eligibility_service, architecture_summary_service [EXTRACTED 1.00]
- **Priya conversation pipeline (7 stages)** — agent_prompt_stage_greeting, agent_prompt_stage_interest, agent_prompt_stage_details, agent_prompt_stage_eligibility, agent_prompt_stage_outcome, agent_prompt_stage_log, agent_prompt_stage_close [EXTRACTED 1.00]
- **Bolna voice stack (LLM + TTS + STT providers)** — setup_openai_gpt4o_mini, setup_elevenlabs_rachel, setup_deepgram_transcriber, setup_agent_config [EXTRACTED 1.00]

## Communities

### Community 0 - "Bolna Voice Agent Flow"
Cohesion: 0.09
Nodes (31): Priya - Apex Bank loan advisor persona, Rationale: Never quote rates because agent is pre-screening only, Stage 7 - CLOSE, Stage 3 - DETAILS COLLECTION, Stage 4 - ELIGIBILITY CHECK, Stage 1 - GREETING, Stage 2 - INTEREST CHECK, Stage 6 - LOG (+23 more)

### Community 1 - "Backend Python Modules"
Cohesion: 0.13
Nodes (15): Base, Campaign, check(), Run the loan pre-qualification rule engine.      Returns dict with keys: eligibl, Lead, _income(), _loan_amount(), _name() (+7 more)

### Community 2 - "System Architecture"
Cohesion: 0.09
Nodes (24): Campaign data model, FastAPI Backend, Funnel: Called -> Interested -> Pre-qualified -> RM, Lead data model, LoanPilot System, Next.js Dashboard, Problem: Banks waste 80% agent time on unqualified loan leads, Rationale: FastAPI for async + Pydantic models (+16 more)

### Community 3 - "Pydantic Schemas"
Cohesion: 0.27
Nodes (9): BaseModel, CampaignBase, CampaignCreate, CampaignResponse, DashboardStats, LeadBase, LeadCreate, LeadDetail (+1 more)

### Community 4 - "Frontend API Client"
Cohesion: 0.36
Nodes (7): apiFetch(), createCampaign(), fetchCampaigns(), fetchDashboardStats(), fetchLead(), fetchLeads(), handleSubmit()

### Community 5 - "Select UI Component"
Cohesion: 0.33
Nodes (9): SelectContent(), SelectGroup(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger() (+1 more)

### Community 6 - "Campaign Routes & Bolna Client"
Cohesion: 0.36
Nodes (7): create_batch(), Mock Bolna batch-campaign creation.      In production this would POST to Bolna', create_campaign(), dashboard_stats(), _err(), list_campaigns(), _ok()

### Community 7 - "Database Bootstrap"
Cohesion: 0.27
Nodes (6): Base, get_db(), init_db(), DeclarativeBase, health(), on_startup()

### Community 8 - "Dialog UI Component"
Cohesion: 0.48
Nodes (5): cn(), Dialog(), DialogClose(), DialogPortal(), DialogTrigger()

### Community 9 - "Table UI Component"
Cohesion: 0.53
Nodes (4): cn(), Table(), TableBody(), TableHeader()

### Community 10 - "Badge UI Component"
Cohesion: 0.33
Nodes (2): Badge(), cn()

### Community 11 - "Leads Route Handlers"
Cohesion: 0.8
Nodes (4): _err(), get_lead(), list_leads(), _ok()

### Community 12 - "Summary Generation"
Cohesion: 0.83
Nodes (2): generate(), _mock_summary()

### Community 13 - "Card UI Component"
Cohesion: 0.67
Nodes (2): CardAction(), cn()

### Community 14 - "Root Layout"
Cohesion: 0.67
Nodes (1): RootLayout()

### Community 15 - "Home Page"
Cohesion: 0.67
Nodes (1): Home()

### Community 16 - "Dashboard Page"
Cohesion: 0.67
Nodes (1): formatINR()

### Community 17 - "LeadsTable Component"
Cohesion: 0.67
Nodes (1): formatINR()

### Community 18 - "StatusBadge Component"
Cohesion: 0.67
Nodes (1): StatusBadge()

### Community 19 - "Sidebar Component"
Cohesion: 0.67
Nodes (1): Sidebar()

### Community 20 - "Button UI Component"
Cohesion: 0.67
Nodes (1): cn()

### Community 21 - "Skeleton UI Component"
Cohesion: 0.67
Nodes (1): Skeleton()

### Community 22 - "Next.js Agent Rules"
Cohesion: 0.67
Nodes (3): Next.js breaking-change agent rules, Rationale: Read node_modules/next/dist/docs before coding due to breaking changes, CLAUDE.md -> AGENTS.md include

### Community 23 - "Public SVG Assets"
Cohesion: 0.67
Nodes (3): Generic file icon SVG asset, Globe icon SVG asset, Window icon SVG asset

### Community 44 - "Dotenv Requirement"
Cohesion: 1.0
Nodes (1): python-dotenv==1.0.1

## Knowledge Gaps
- **32 isolated node(s):** `Mock Bolna batch-campaign creation.      In production this would POST to Bolna'`, `Run the loan pre-qualification rule engine.      Returns dict with keys: eligibl`, `Problem: Banks waste 80% agent time on unqualified loan leads`, `Tool: generate_summary`, `Eligibility Rules Engine (eligibility.py)` (+27 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Badge UI Component`** (6 nodes): `Badge()`, `badge.tsx`, `utils.ts`, `badge.tsx`, `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Summary Generation`** (4 nodes): `summary.py`, `generate()`, `_mock_summary()`, `summary.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Card UI Component`** (4 nodes): `CardAction()`, `cn()`, `card.tsx`, `card.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Root Layout`** (3 nodes): `layout.tsx`, `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Home Page`** (3 nodes): `page.tsx`, `Home()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard Page`** (3 nodes): `page.tsx`, `formatINR()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `LeadsTable Component`** (3 nodes): `LeadsTable.tsx`, `formatINR()`, `LeadsTable.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `StatusBadge Component`** (3 nodes): `StatusBadge.tsx`, `StatusBadge()`, `StatusBadge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sidebar Component`** (3 nodes): `Sidebar.tsx`, `Sidebar()`, `Sidebar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Button UI Component`** (3 nodes): `cn()`, `button.tsx`, `button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Skeleton UI Component`** (3 nodes): `skeleton.tsx`, `Skeleton()`, `skeleton.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dotenv Requirement`** (1 nodes): `python-dotenv==1.0.1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Lead` connect `Backend Python Modules` to `Database Bootstrap`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `FastAPI Backend` connect `System Architecture` to `Bolna Voice Agent Flow`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `seed()` connect `Backend Python Modules` to `Database Bootstrap`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `seed()` (e.g. with `init_db()` and `Campaign`) actually correct?**
  _`seed()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `Lead` (e.g. with `Base` and `Seed the LoanPilot SQLite database with realistic demo data.  Usage:     python`) actually correct?**
  _`Lead` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Mock Bolna batch-campaign creation.      In production this would POST to Bolna'`, `Run the loan pre-qualification rule engine.      Returns dict with keys: eligibl`, `Problem: Banks waste 80% agent time on unqualified loan leads` to the rest of the system?**
  _32 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Bolna Voice Agent Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._