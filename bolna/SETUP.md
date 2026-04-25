# Bolna Agent Setup Guide — LoanPilot

Source: https://docs.bolna.ai (fetched April 2026)

---

## Prerequisites

- Bolna account at https://app.bolna.ai
- A phone number purchased/linked in **My Numbers**
- Your backend deployed and publicly accessible (use ngrok for local dev)
- OpenAI API key (for LLM) and ElevenLabs API key (for voice) added under **Providers**

---

## Step 1 — Add Providers

Before creating an agent, add your API keys:

1. Go to **Providers** in the sidebar
2. Add **OpenAI** key (for gpt-4o-mini)
3. Add **ElevenLabs** key (for Rachel voice)
4. Add **Deepgram** key (for transcription)

---

## Step 2 — Create the Agent

1. Click **Agent Setup** → **Create New Agent**
2. Fill the **Agent Tab**:
   - **Agent Name**: `LoanPilot Pre-Qualification Agent`
   - **Agent Welcome Message**:
     ```
     Hello! This is Priya calling from Apex Bank. Do you have 2 minutes?
     I'd like to share a pre-approved loan offer tailored for you.
     ```
   - **Agent Prompt**: use the canonical prompt embedded in `agent_import.json`
   - **Hangup Condition**: `The customer has clearly indicated they are not interested or the conversation has concluded`

3. Fill the **LLM Tab**:
   - Provider: OpenAI
   - Model: `gpt-4o-mini`
   - Temperature: `0.3`
   - Max tokens: `200`

4. Fill the **Audio Tab**:
   - Transcriber: Deepgram, Language: `en-IN`
   - Synthesizer: ElevenLabs, Voice: `Rachel`, Model: `eleven_flash_v2_5`

5. Fill the **Engine Tab**:
   - Hangup after silence: `15` seconds

---

## Step 3 — Add Tools (Function Calls)

> Prompt source of truth: `agent_import.json` is the only canonical Bolna prompt file in this repo. `agent_prompt.md` is deprecated and kept only as a pointer file.

Go to the **Tools Tab** and add 3 custom tools. For each tool, use **Custom Function** and fill exactly as below.

> **Critical**: The `key` field must always be `custom_task`. Replace `YOUR_BACKEND_URL` with your actual deployed URL (e.g. `https://abc123.ngrok.io`).

### Tool 1: fetch_customer_profile

| Field | Value |
|-------|-------|
| Name | `fetch_customer_profile` |
| Description | `Fetch existing customer data from the bank CRM using their phone number. Call this at the very start of the conversation.` |
| Pre-call message | `Let me pull up your account details.` |
| Method | POST |
| URL | `https://YOUR_BACKEND_URL/api/webhook/bolna` |

Parameters:
```json
{
  "type": "object",
  "properties": {
    "phone": {
      "type": "string",
      "description": "Customer phone number in E.164 format"
    }
  },
  "required": ["phone"]
}
```

Request body mapping:
```
tool_name = "fetch_customer_profile"
phone = %(phone)s
```

---

### Tool 2: check_eligibility

| Field | Value |
|-------|-------|
| Name | `check_eligibility` |
| Description | `Check if the customer pre-qualifies for the loan based on income and loan type. Call after collecting all 4 data points: loan_type, loan_amount, monthly_income, employment_type.` |
| Pre-call message | `Let me quickly check your eligibility. Just a moment.` |
| Method | POST |
| URL | `https://YOUR_BACKEND_URL/api/webhook/bolna` |

Parameters:
```json
{
  "type": "object",
  "properties": {
    "loan_type": { "type": "string", "description": "home, personal, business, or auto" },
    "loan_amount": { "type": "number", "description": "Requested loan amount in INR" },
    "monthly_income": { "type": "number", "description": "Monthly income in INR" },
    "employment_type": { "type": "string", "description": "salaried, self_employed, or business_owner" }
  },
  "required": ["loan_type", "loan_amount", "monthly_income", "employment_type"]
}
```

Request body mapping:
```
tool_name = "check_eligibility"
loan_type = %(loan_type)s
loan_amount = %(loan_amount)f
monthly_income = %(monthly_income)f
employment_type = %(employment_type)s
```

---

### Tool 3: log_lead

| Field | Value |
|-------|-------|
| Name | `log_lead` |
| Description | `Save the lead data and call outcome to the CRM. ALWAYS call this at the end of every call, even if not interested.` |
| Pre-call message | `Let me save your details.` |
| Method | POST |
| URL | `https://YOUR_BACKEND_URL/api/webhook/bolna` |

Parameters:
```json
{
  "type": "object",
  "properties": {
    "loan_type": { "type": "string" },
    "loan_amount": { "type": "number" },
    "monthly_income": { "type": "number" },
    "employment_type": { "type": "string" },
    "status": { "type": "string", "description": "not_interested, interested, pre_qualified, or called" },
    "phone": { "type": "string", "description": "Customer phone number in E.164 format" },
    "call_transcript": { "type": "string", "description": "Brief summary of the call" }
  },
  "required": ["status"]
}
```

Request body mapping:
```
tool_name = "log_lead"
loan_type = %(loan_type)s
loan_amount = %(loan_amount)f
monthly_income = %(monthly_income)f
employment_type = %(employment_type)s
status = %(status)s
phone = %(phone)s
call_transcript = %(call_transcript)s
```

---

## Step 4 — Add Webhook (Post-Call Analytics)

Go to the **Analytics Tab**:

- **Webhook URL**: `https://YOUR_BACKEND_URL/api/webhook/bolna`

This sends the full call data (transcript, duration, recording) to your backend when a call completes.

---

## Step 5 — Test with a Single Call

Before running a batch, test manually:

1. Go to **Agent Setup** → find your agent → click **Test Call**
2. Enter your own mobile number
3. Answer and walk through the conversation
4. Check `GET http://localhost:3000/api/leads` to confirm the lead was logged
5. Check the dashboard at `http://localhost:3000/leads`

---

## Step 6 — Run a Batch Campaign

### Prepare your CSV

File must use `contact_number` as the header. Numbers must be in E.164 format:

```csv
contact_number,first_name,last_name
+919876543210,Rahul,Sharma
+918765432109,Priya,Mehta
+917654321098,Amit,Patel
```

> In Excel: prefix the `+` with an apostrophe (`'+919876543210`) to prevent number formatting issues.

### Upload and Run

1. Go to your agent → **Batches** tab → **Upload Batch**
2. Drag in your CSV file
3. Select your phone number from **From Number**
4. Choose **Run Now** or schedule for a future time
5. Enable **Auto Retry** (up to 3 attempts) for numbers that don't pick up
6. Add your webhook URL for real-time status updates

### Via API

```bash
# Create batch
curl -X POST https://api.bolna.ai/batches \
  -H "Authorization: Bearer YOUR_BOLNA_API_KEY" \
  -F "agent_id=YOUR_AGENT_ID" \
  -F "file=@leads.csv" \
  -F "from_phone_numbers=['+919XXXXXXXXX']"

# Schedule batch (replace BATCH_ID and timestamp)
curl -X POST https://api.bolna.ai/batches/BATCH_ID/schedule \
  -H "Authorization: Bearer YOUR_BOLNA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"time": "2026-04-25T10:00:00+05:30"}'
```

---

## Local Development with ngrok

To expose your local backend to Bolna:

```bash
# Terminal 1 — start app
npm run dev

# Terminal 2 — expose via ngrok
ngrok http 3000
```

Copy the `https://xxxxx.ngrok.io` URL and replace `YOUR_BACKEND_URL` everywhere in the Bolna dashboard tool configs. In this app the correct public endpoint is `/api/webhook/bolna`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Tool not triggering | Check that `key: "custom_task"` is set in tool config |
| Webhook 422 error | Verify `tool_name` field is in the POST body and matches exactly |
| Lead not appearing in dashboard | Check `/api/webhook/bolna` logs; ensure the Next app and ngrok tunnel are running |
| Agent not speaking Hindi | Customer must initiate — agent will match language |
| Call ends too quickly | Increase `hangup_after_silence` in Engine Tab |
