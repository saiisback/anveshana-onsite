#!/bin/bash
# Create and publish Resend email templates

API_KEY="re_cVdVXaJ3_75Y4bdvCwstiS3mkJPQ1HSnf"
BASE="https://api.resend.com"
TEMPLATE_DIR="src/lib/resend-templates"

create_and_publish() {
  local name="$1"
  local file="$2"
  local subject="$3"
  local variables="$4"

  echo "--- Creating template: $name ---"

  # Read HTML and escape for JSON
  html_content=$(python3 -c "
import json, sys
with open('$file', 'r') as f:
    print(json.dumps(f.read()))
")

  # Build JSON payload
  payload=$(python3 -c "
import json
html = $html_content
variables = json.loads('$variables')
payload = {
    'name': '$name',
    'subject': '$subject',
    'html': html,
    'variables': variables
}
print(json.dumps(payload))
")

  # Create template
  response=$(curl -s -X POST "$BASE/templates" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload")

  echo "Create response: $response"

  # Extract template ID
  template_id=$(echo "$response" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))")

  if [ -z "$template_id" ] || [ "$template_id" = "None" ]; then
    echo "ERROR: Failed to create template $name"
    return 1
  fi

  echo "Template ID: $template_id"

  # Publish template
  publish_response=$(curl -s -X POST "$BASE/templates/$template_id/publish" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json")

  echo "Publish response: $publish_response"
  echo ""
  echo "$name=$template_id"
}

echo "=== Publishing Resend Templates ==="
echo ""

# 1. Invitation
create_and_publish "anveshana-invitation" \
  "$TEMPLATE_DIR/invitation.html" \
  "You're Invited to Anveshana 3.0!" \
  '[{"key":"registerUrl","type":"string","fallback_value":"https://anveshana.com/register"}]'

echo ""

# 2. Team Approved
create_and_publish "anveshana-team-approved" \
  "$TEMPLATE_DIR/team-approved.html" \
  "Your Team Has Been Approved - Anveshana 3.0" \
  '[{"key":"leadName","type":"string","fallback_value":"Team Lead"},{"key":"teamName","type":"string","fallback_value":"Team"},{"key":"stallNumber","type":"number","fallback_value":0}]'

echo ""

# 3. Team Rejected
create_and_publish "anveshana-team-rejected" \
  "$TEMPLATE_DIR/team-rejected.html" \
  "Anveshana 3.0 - Application Update" \
  '[{"key":"leadName","type":"string","fallback_value":"Participant"},{"key":"teamName","type":"string","fallback_value":"Team"}]'

echo ""

# 4. Password Setup
create_and_publish "anveshana-password-setup" \
  "$TEMPLATE_DIR/password-setup.html" \
  "Set Your Password - Anveshana 3.0" \
  '[{"key":"name","type":"string","fallback_value":"Participant"},{"key":"setupUrl","type":"string","fallback_value":"https://anveshana.com/set-password"}]'

echo ""
echo "=== Done! Add these template IDs to your .env ==="
