#!/bin/bash
# Usage: ./create_agent.sh <BOLNA_API_KEY> <BACKEND_URL>
# Example: ./create_agent.sh bolna_key_xxx https://abc.ngrok.io

set -e

BOLNA_API_KEY="${1:?Usage: ./create_agent.sh <BOLNA_API_KEY> <BACKEND_URL>}"
BACKEND_URL="${2:?Usage: ./create_agent.sh <BOLNA_API_KEY> <BACKEND_URL>}"

# Inject backend URL into import file
PAYLOAD=$(sed "s|https://YOUR_BACKEND_URL|${BACKEND_URL}|g" agent_import.json)

echo "Creating LoanPilot agent on Bolna..."

RESPONSE=$(curl -s -X POST https://api.bolna.ai/v2/agent \
  -H "Authorization: Bearer ${BOLNA_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}")

AGENT_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('agent_id','ERROR'))")

if [ "$AGENT_ID" = "ERROR" ]; then
  echo "Failed. Response:"
  echo "$RESPONSE"
  exit 1
fi

echo ""
echo "Agent created successfully!"
echo "Agent ID: ${AGENT_ID}"
echo ""
echo "Next steps:"
echo "  1. Go to https://app.bolna.ai and find your agent"
echo "  2. Add your phone number under My Numbers"
echo "  3. Test with a single call before batch"
echo "  4. Upload your CSV batch under the Batches tab"
echo ""
echo "Save your agent ID: ${AGENT_ID}"
