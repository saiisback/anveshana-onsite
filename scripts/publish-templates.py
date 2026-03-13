import json
import subprocess
import sys

API_KEY = "re_cVdVXaJ3_75Y4bdvCwstiS3mkJPQ1HSnf"
BASE = "https://api.resend.com"

def api_post(path, data=None):
    url = f"{BASE}{path}"
    cmd = [
        "curl", "-s", "-X", "POST", url,
        "-H", f"Authorization: Bearer {API_KEY}",
        "-H", "Content-Type: application/json",
    ]
    if data:
        cmd += ["-d", json.dumps(data)]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(result.stdout)
    except:
        print(f"  Raw response: {result.stdout}")
        return {}

def create_and_publish(name, file_path, subject, variables):
    print(f"--- {name} ---")

    with open(file_path, "r") as f:
        html = f.read()

    result = api_post("/templates", {
        "name": name,
        "subject": subject,
        "html": html,
        "variables": variables,
    })
    print(f"  Create: {json.dumps(result)}")

    tid = result.get("id")
    if not tid:
        print(f"  ERROR: Failed to create")
        return None

    pub = api_post(f"/templates/{tid}/publish")
    print(f"  Publish: {json.dumps(pub)}")
    print(f"  ID: {tid}")
    return tid

print("=== Publishing Resend Templates ===\n")

ids = {}

ids["invitation"] = create_and_publish(
    "anveshana-invitation",
    "src/lib/resend-templates/invitation.html",
    "You're Invited to Anveshana 3.0!",
    [{"key": "registerUrl", "type": "string", "fallback_value": "https://anveshana.com/register"}],
)

ids["teamApproved"] = create_and_publish(
    "anveshana-team-approved",
    "src/lib/resend-templates/team-approved.html",
    "Your Team Has Been Approved - Anveshana 3.0",
    [
        {"key": "leadName", "type": "string", "fallback_value": "Team Lead"},
        {"key": "teamName", "type": "string", "fallback_value": "Team"},
        {"key": "stallNumber", "type": "number", "fallback_value": 0},
    ],
)

ids["teamRejected"] = create_and_publish(
    "anveshana-team-rejected",
    "src/lib/resend-templates/team-rejected.html",
    "Anveshana 3.0 - Application Update",
    [
        {"key": "leadName", "type": "string", "fallback_value": "Participant"},
        {"key": "teamName", "type": "string", "fallback_value": "Team"},
    ],
)

ids["passwordSetup"] = create_and_publish(
    "anveshana-password-setup",
    "src/lib/resend-templates/password-setup.html",
    "Set Your Password - Anveshana 3.0",
    [
        {"key": "name", "type": "string", "fallback_value": "Participant"},
        {"key": "setupUrl", "type": "string", "fallback_value": "https://anveshana.com/set-password"},
    ],
)

print("\n=== Add these to your .env ===")
print(f'RESEND_TEMPLATE_INVITATION="{ids.get("invitation", "FAILED")}"')
print(f'RESEND_TEMPLATE_TEAM_APPROVED="{ids.get("teamApproved", "FAILED")}"')
print(f'RESEND_TEMPLATE_TEAM_REJECTED="{ids.get("teamRejected", "FAILED")}"')
print(f'RESEND_TEMPLATE_PASSWORD_SETUP="{ids.get("passwordSetup", "FAILED")}"')
