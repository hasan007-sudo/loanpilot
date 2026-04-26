# LoanPilot Architecture

## Overview

LoanPilot is a single Next.js application that handles both the product UI and the API surface for campaign operations, lead management, and Bolna webhooks.

There is no separate Python or FastAPI backend in the current repository. The API layer is implemented with Next.js route handlers under `app/app/api`, while server-rendered pages can also read directly from Postgres through Prisma.

## Current System Shape

```text
[Bank manager]
      |
      v
[Next.js UI: dashboard, leads, campaigns]
      |
      +------------------------------+
      |                              |
      v                              v
[Server Components]          [Route Handlers /api/*]
      |                              |
      +--------------+---------------+
                     |
                     v
          [Prisma + PrismaPg adapter]
                     |
                     v
                [Postgres / Neon]

[Bolna outbound calls] ---> [/api/webhook/bolna]
                                   |
                                   v
                    [Eligibility + summary services]
                                   |
                                   v
                               [Lead records]
```

## Tech Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| App shell | Next.js 16 App Router | UI pages and API route handlers live in the same app |
| UI | React 19 + Tailwind CSS 4 + shadcn/ui | Dashboard and admin workflows |
| Database access | Prisma 7 + `@prisma/adapter-pg` | Runtime uses Postgres through Prisma's pg adapter |
| Database | PostgreSQL | Configured for Neon-style pooled and direct connections |
| Voice outreach | Bolna | Batch or demo outbound calling |
| Summaries | OpenRouter via OpenAI SDK | Optional; falls back to a mock summary when unset |

## Repository Layout

```text
loanpilot/
├── ARCHITECTURE.md
├── bolna/
│   ├── agent_config.json
│   ├── agent_prompt.md
│   └── SETUP.md
└── app/
    ├── app/
    │   ├── dashboard/page.tsx
    │   ├── leads/page.tsx
    │   ├── leads/[id]/page.tsx
    │   ├── campaigns/page.tsx
    │   ├── campaigns/[id]/page.tsx
    │   └── api/
    │       ├── dashboard/stats/route.ts
    │       ├── leads/route.ts
    │       ├── leads/[id]/route.ts
    │       ├── campaigns/route.ts
    │       ├── campaigns/[id]/batch/route.ts
    │       ├── campaigns/[id]/retrigger/route.ts
    │       └── webhook/bolna/route.ts
    ├── components/
    ├── lib/
    │   ├── api.ts
    │   ├── bolna.ts
    │   ├── config.ts
    │   ├── data.ts
    │   ├── db.ts
    │   └── services/
    │       ├── eligibility.ts
    │       └── summary.ts
    └── prisma/
        ├── schema.prisma
        ├── migrations/
        └── seed.ts
```

## Runtime Responsibilities

### 1. UI Layer

The user-facing product is built inside the Next.js App Router:

- `/dashboard` shows portfolio metrics and qualification charts.
- `/leads` lists leads with status and loan-type filtering.
- `/leads/[id]` exposes transcript, summary, and lead editing controls.
- `/campaigns` creates campaigns and starts batch uploads.
- `/campaigns/[id]` shows campaign-level progress and associated leads.

Server components use `app/lib/data.ts` to query the database directly. This avoids unnecessary internal HTTP calls during page rendering.

### 2. API Layer

The app's API is implemented with Next.js route handlers:

- `GET /api/dashboard/stats`
- `GET /api/leads`
- `POST /api/leads`
- `GET /api/leads/[id]`
- `PATCH /api/leads/[id]`
- `GET /api/campaigns`
- `POST /api/campaigns`
- `POST /api/campaigns/[id]/batch`
- `POST /api/campaigns/[id]/retrigger`
- `POST /api/webhook/bolna`

This is the only backend API layer currently present in the repository.

### 3. Data Access

Prisma is the persistence boundary:

- `app/lib/db.ts` creates the shared Prisma client.
- Runtime queries use `DATABASE_URL`.
- Prisma CLI and migrations use `DIRECT_URL` from `app/prisma.config.ts`.

The app is designed around a Postgres deployment, not SQLite.

### 4. External Integrations

#### Bolna

Bolna is used for outbound loan-calling workflows:

- campaign batch creation
- demo-call fallback
- execution lookup during webhook handling

The integration code lives in `app/lib/bolna.ts`.

#### OpenRouter

OpenRouter is used to summarize transcripts through the OpenAI SDK wrapper in `app/lib/services/summary.ts`.

If `OPENROUTER_API_KEY` is not configured, the app still works and returns a mock summary instead of failing the workflow.

## Main Flows

### Campaign Creation and Launch

```text
Manager creates campaign
  -> POST /api/campaigns
  -> campaign stored in Postgres with status=draft

Manager uploads contacts
  -> POST /api/campaigns/[id]/batch
  -> leads are upserted into Postgres
  -> campaign totals are updated
  -> app attempts Bolna batch trigger
  -> if batch mode is unavailable, app can fall back to a single demo call
```

### Lead Management

```text
Server-rendered pages
  -> app/lib/data.ts
  -> Prisma queries
  -> Postgres

Client-side edits
  -> app/lib/api.ts
  -> PATCH /api/leads/[id]
  -> Postgres update
```

### Bolna Webhook Processing

`POST /api/webhook/bolna` supports two payload families:

1. Tool webhooks
   - `fetch_customer_profile`
   - `check_eligibility`
   - `log_lead`

2. Execution webhooks
   - call completion / transcript-oriented payloads

The route then:

- resolves the phone number from parameters, execution payload, or a Bolna execution lookup
- runs the eligibility rules when needed
- generates a transcript summary when available
- upserts the lead in Postgres

## Service Boundaries

### `app/lib/data.ts`

Server-only data access for App Router pages. This is the preferred path for server components.

### `app/lib/api.ts`

Browser-facing API client used by client components for create/update actions.

### `app/lib/services/eligibility.ts`

Pure rule engine for loan pre-qualification. Current rules are based on:

- loan type
- monthly income thresholds
- employment type
- income-to-loan ratio limits

### `app/lib/services/summary.ts`

Transcript summarization service with graceful fallback behavior when external AI credentials are missing or the request fails.

## Data Model

### Campaign

| Field | Type | Purpose |
| --- | --- | --- |
| `id` | `Int` | Primary key |
| `name` | `String` | Campaign name |
| `bankName` | `String?` | Bank label shown in UI and sent to Bolna |
| `totalLeads` | `Int` | Count captured at batch start |
| `calledCount` | `Int` | Current stored call count summary |
| `interestedCount` | `Int` | Stored interested count |
| `qualifiedCount` | `Int` | Stored qualified count |
| `bolnaBatchId` | `String?` | Batch reference from Bolna |
| `status` | `String` | Draft/running/completed style workflow state |
| `createdAt` | `DateTime` | Creation timestamp |

### Lead

| Field | Type | Purpose |
| --- | --- | --- |
| `id` | `Int` | Primary key |
| `phone` | `String` | Unique customer identifier in the app |
| `name` | `String?` | Optional customer name |
| `campaignId` | `Int?` | Owning campaign |
| `loanType` | `String?` | Home, personal, business, or auto |
| `loanAmount` | `Float?` | Requested amount |
| `monthlyIncome` | `Float?` | Used for eligibility rules |
| `employmentType` | `String?` | Used for eligibility rules |
| `status` | `String` | Pipeline state shown to managers |
| `eligibility` | `String` | Pending, eligible, ineligible, or review-needed style state |
| `callTranscript` | `String?` | Raw transcript |
| `summary` | `String?` | Generated call summary |
| `bolnaCallId` | `String?` | Execution or call reference |
| `createdAt` | `DateTime` | Creation timestamp |
| `updatedAt` | `DateTime` | Last update timestamp |

## Configuration

Environment variables are defined in `app/.env.example`.

Required for normal runtime:

- `DATABASE_URL`
- `DIRECT_URL` for Prisma migrations

Optional integrations:

- `BOLNA_API_KEY`
- `BOLNA_AGENT_ID`
- `BOLNA_FROM_NUMBER`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`

## Current Constraints

- Campaign aggregate counters are stored on the campaign record and are not yet recomputed automatically from lead state changes.
- There is no dedicated auth layer in the current codebase.
- The webhook route currently centralizes multiple webhook behaviors in one handler.
- Without Bolna credentials, campaign actions still save leads but do not start real outbound batches.
- Without OpenRouter credentials, transcript summaries fall back to deterministic mock text.

## Summary

The current repository is a monolithic Next.js application with:

- App Router pages for the manager UI
- Next.js route handlers for the API layer
- Prisma/Postgres for persistence
- Bolna for calling workflows
- OpenRouter for optional transcript summaries

That is the source of truth for the current implementation, and it replaces the earlier FastAPI-based architecture.
