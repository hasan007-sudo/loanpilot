# LoanPilot — Architecture & Coding Guide

## Problem Statement
Banks make millions of outbound loan marketing calls. Human agents waste 80% of time on unqualified leads.
LoanPilot deploys a Bolna voice agent that calls customers, pre-qualifies them for Home / Personal / Business / Auto loans,
and gives bank managers a dashboard with lead status + AI-generated conversation summaries.

---

## System Overview

```
[Bank uploads CSV] → [Bolna Batch Campaign]
                              ↓
                    [Bolna Voice Agent calls customer]
                              ↓
              Customer expresses interest / declines
                              ↓
                    [Agent fires tool calls → FastAPI backend]
                      - fetch_customer_profile()
                      - check_eligibility()
                      - log_lead()
                      - generate_summary()
                              ↓
                    [Next.js Dashboard]
                    Bank manager sees:
                    - Leads table (loan type, amount, eligibility)
                    - Conversation summary per lead
                    - Funnel: Called → Interested → Pre-qualified → Passed to RM
```

---

## Tech Stack

| Layer       | Technology              | Reason                                      |
|-------------|-------------------------|---------------------------------------------|
| Frontend    | Next.js 14 (App Router) | File-based routing, server components       |
| UI          | Tailwind CSS + shadcn/ui| Fast, consistent enterprise UI              |
| Backend     | Python FastAPI          | Fast async, clean Pydantic models           |
| Database    | SQLite via SQLAlchemy   | Zero-config, sufficient for demo scale      |
| Voice Agent | Bolna                   | Outbound calling, batch campaigns           |
| AI Summary  | Claude API (claude-haiku-4-5-20251001) | Cheap, fast call summarization  |
| HTTP Client | httpx (async)           | For Bolna API calls from backend            |

---

## Project Structure

```
loanpilot/
├── ARCHITECTURE.md
├── frontend/
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── app/
│   │   ├── layout.tsx               # Root layout with sidebar nav
│   │   ├── page.tsx                 # Dashboard home → redirect to /leads
│   │   ├── leads/
│   │   │   ├── page.tsx             # Leads table with filters
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Lead detail: summary + transcript
│   │   └── campaigns/
│   │       └── page.tsx             # Create campaign (upload CSV + trigger Bolna batch)
│   └── components/
│       ├── LeadsTable.tsx           # Sortable/filterable table
│       ├── FunnelChart.tsx          # Called→Interested→Qualified→RM funnel
│       ├── ConversationSummary.tsx  # Expandable AI summary card
│       ├── StatusBadge.tsx          # Color-coded lead status pill
│       └── Sidebar.tsx              # Nav: Dashboard, Leads, Campaigns
├── backend/
│   ├── requirements.txt
│   ├── main.py                      # FastAPI app entry, CORS, router registration
│   ├── database.py                  # SQLAlchemy engine + session + Base
│   ├── models/
│   │   ├── lead.py                  # Lead ORM model
│   │   └── campaign.py              # Campaign ORM model
│   ├── schemas/
│   │   ├── lead.py                  # Pydantic request/response schemas
│   │   └── campaign.py
│   ├── routes/
│   │   ├── webhook.py               # POST /webhook/bolna — receives tool call events
│   │   ├── leads.py                 # GET /leads, GET /leads/{id}
│   │   └── campaigns.py             # POST /campaigns, GET /campaigns
│   └── services/
│       ├── eligibility.py           # Pre-qualification rules engine
│       ├── summary.py               # Claude API call → generate summary
│       └── bolna_client.py          # Bolna REST API wrapper
└── bolna/
    ├── agent_prompt.md              # Full system prompt for Bolna agent
    └── agent_config.json            # Bolna agent creation payload (tools + TTS config)
```

---

## Data Models

### Lead
```
id              INTEGER PRIMARY KEY
phone           TEXT NOT NULL
name            TEXT
campaign_id     INTEGER FK → Campaign
loan_type       TEXT  -- "home" | "personal" | "business" | "auto" | null
loan_amount     REAL  -- requested amount in INR
monthly_income  REAL
employment_type TEXT  -- "salaried" | "self_employed" | "business_owner"
status          TEXT  -- "called" | "not_interested" | "interested" | "pre_qualified" | "passed_to_rm"
eligibility     TEXT  -- "eligible" | "ineligible" | "review_needed" | "pending"
call_transcript TEXT  -- raw transcript from Bolna webhook
summary         TEXT  -- AI-generated summary (Claude)
bolna_call_id   TEXT  -- Bolna's call ID for reference
created_at      DATETIME
updated_at      DATETIME
```

### Campaign
```
id              INTEGER PRIMARY KEY
name            TEXT NOT NULL
bank_name       TEXT
total_leads     INTEGER
called_count    INTEGER DEFAULT 0
interested_count INTEGER DEFAULT 0
qualified_count INTEGER DEFAULT 0
bolna_batch_id  TEXT
status          TEXT  -- "draft" | "running" | "completed"
created_at      DATETIME
```

---

## API Contracts

### Bolna Webhook (Bolna → Backend)
Bolna calls our backend when the agent invokes a tool. All tool calls hit:
```
POST /webhook/bolna
Content-Type: application/json

{
  "tool_name": "check_eligibility" | "log_lead" | "fetch_customer_profile",
  "call_id": "bolna_call_xyz",
  "parameters": { ...tool-specific fields }
}
```

Tool-specific parameter shapes:

**fetch_customer_profile**
```json
{ "phone": "+919876543210" }
```
Response: `{ "name": "Rahul Sharma", "existing_loans": 1, "relationship": "existing_customer" }`

**check_eligibility**
```json
{
  "phone": "+919876543210",
  "loan_type": "home",
  "loan_amount": 5000000,
  "monthly_income": 80000,
  "employment_type": "salaried"
}
```
Response: `{ "eligible": true, "reason": "Income meets 40x loan amount criteria", "max_amount": 6400000 }`

**log_lead**
```json
{
  "phone": "+919876543210",
  "loan_type": "home",
  "loan_amount": 5000000,
  "monthly_income": 80000,
  "employment_type": "salaried",
  "status": "pre_qualified",
  "call_transcript": "Agent: Hi... Customer: Yes I'm interested..."
}
```
Response: `{ "lead_id": 42, "summary": "Customer Rahul expressed strong interest in ₹50L home loan..." }`

### Frontend → Backend REST API
```
GET  /api/leads                     # List leads, supports ?status=&loan_type=&campaign_id=
GET  /api/leads/{id}                # Lead detail with full transcript + summary
GET  /api/campaigns                 # List campaigns with funnel counts
POST /api/campaigns                 # Create campaign + trigger Bolna batch
GET  /api/dashboard/stats           # { total_called, interested, qualified, conversion_rate }
```

---

## Bolna Agent Design

### Conversation Flow
```
1. GREETING     → Introduce as bank AI, ask if they have 2 minutes
2. INTEREST     → "Are you looking for a loan? (Home/Personal/Business/Auto)"
3. DETAILS      → Collect: loan amount, monthly income, employment type
4. TOOL CALL    → check_eligibility() mid-conversation
5. OUTCOME      → If eligible: inform + offer RM callback. If not: polite decline.
6. LOG          → log_lead() always, regardless of outcome
7. CLOSE        → Thank customer, confirm next steps
```

### Key Prompt Principles
- Speak in simple English (or Hindi if customer switches)
- Never promise approval — only "pre-qualification"
- If customer asks interest rate / EMI → say "our Relationship Manager will share exact details"
- If customer says not interested → log immediately, don't push
- Max call duration: 3 minutes
- Collect minimum viable data: loan_type, loan_amount, monthly_income, employment_type

### Tools defined in Bolna agent config
```json
[
  {
    "name": "fetch_customer_profile",
    "description": "Fetch existing customer data from bank CRM",
    "url": "https://your-backend.com/webhook/bolna",
    "method": "POST"
  },
  {
    "name": "check_eligibility",
    "description": "Check if customer pre-qualifies based on income and loan type",
    "url": "https://your-backend.com/webhook/bolna",
    "method": "POST"
  },
  {
    "name": "log_lead",
    "description": "Save lead data and generate conversation summary",
    "url": "https://your-backend.com/webhook/bolna",
    "method": "POST"
  }
]
```

---

## Eligibility Rules (eligibility.py)

Simple rule engine — no ML needed for demo:

| Loan Type    | Min Income (monthly) | Max Loan-to-Income Ratio | Employment Types Accepted           |
|--------------|----------------------|--------------------------|-------------------------------------|
| Home         | ₹40,000              | 80x monthly income       | salaried, self_employed             |
| Personal     | ₹25,000              | 20x monthly income       | salaried, self_employed, business   |
| Business     | ₹50,000              | 30x monthly income       | business_owner, self_employed       |
| Auto         | ₹20,000              | 15x monthly income       | all                                 |

Status mapping:
- Meets all criteria → `eligible` → lead status `pre_qualified`
- Fails income → `ineligible` → lead status `not_qualified`
- Borderline (within 20% of threshold) → `review_needed` → lead status `interested`

---

## AI Summary Generation (summary.py)

Use Claude claude-haiku-4-5-20251001 (fast + cheap) to generate a 3-sentence summary:

```python
prompt = f"""
You are a bank loan officer assistant. Summarize this loan pre-qualification call in 3 sentences:
1. Customer interest and loan type requested
2. Financial profile (income, employment)
3. Eligibility outcome and recommended next step

Transcript:
{transcript}
"""
```

---

## Coding Conventions

### Python (FastAPI)
- Use `async def` for all route handlers
- Pydantic v2 models for all request/response schemas
- SQLAlchemy 2.0 style (use `select()`, not `query()`)
- No global state — use FastAPI `Depends()` for DB sessions
- All responses use consistent shape: `{ "data": ..., "error": null }`
- Environment variables via `python-dotenv` — never hardcode secrets

### TypeScript (Next.js)
- App Router only — no `pages/` directory
- Fetch data in Server Components where possible (no unnecessary client-side fetching)
- Client components only when interactivity needed — mark with `"use client"`
- Use `fetch` with `{ cache: 'no-store' }` for dashboard data (always fresh)
- Tailwind only for styling — no inline styles, no CSS modules
- shadcn/ui components as base — don't rebuild what shadcn provides

### General
- No `any` types in TypeScript
- No `print()` debugging left in Python — use `logging`
- Every API route has a try/catch with proper HTTP error codes
- Seed file (`seed.py`) must create realistic demo data (5 campaigns, 50 leads across all statuses)

---

## Environment Variables

### Backend (.env)
```
DATABASE_URL=sqlite:///./loanpilot.db
ANTHROPIC_API_KEY=sk-ant-...
BOLNA_API_KEY=...
BOLNA_BASE_URL=https://api.bolna.dev
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Demo Flow (for recording)

1. Open dashboard → show existing campaign with 50 leads
2. Click a lead → show conversation summary + eligibility outcome
3. Show funnel chart — conversion rates
4. Create new campaign → upload mock CSV → trigger Bolna batch
5. Simulate incoming webhook (Postman/curl) → show lead appearing live
6. Open lead detail → AI summary generated

---

## Out of Scope (do not build)
- Real payment processing
- Actual Bolna API integration (use mock/simulated webhooks for demo)
- Authentication / login
- Multi-bank tenancy
- Real credit bureau integration
