# LoanPilot App

LoanPilot is a bank outreach dashboard for managing outbound loan campaigns, tracking lead qualification, and processing Bolna webhook activity from a single Next.js application.

This app handles both:

- the product UI under the App Router
- the API layer through Next.js route handlers in `app/api/*`

## Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- Prisma 7 with Postgres
- Bolna for outbound calling
- OpenRouter for optional transcript summaries

## Local Development

From this directory:

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Required:

- `DATABASE_URL`
- `DIRECT_URL`

Optional:

- `BOLNA_API_KEY`
- `BOLNA_AGENT_ID`
- `BOLNA_FROM_NUMBER`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`

## Main Routes

- `/dashboard` for summary metrics
- `/leads` for lead filtering and review
- `/leads/[id]` for transcript and lead editing
- `/campaigns` for campaign creation and batch launch
- `/campaigns/[id]` for campaign detail and re-triggering

## API Routes

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

## Notes

- There is no separate FastAPI service in the current implementation.
- Server-rendered pages query Postgres directly through `lib/data.ts`.
- If Bolna credentials are missing, campaign actions still save leads locally.
- If OpenRouter credentials are missing, the app returns a mock summary instead of failing.

See `../ARCHITECTURE.md` for the deeper system breakdown.
