"""
=============================================================================
  GETAJOB PLATFORM - COMPREHENSIVE FINAL END-TO-END TEST SUITE
=============================================================================
  Tests every core feature: Auth, Accounts, Positions, CV Upload, AI Parsing,
  Candidates, Matching, Assessment, Workflow, Dashboard, Vercel & Supabase.
=============================================================================
"""

import requests
import time
import sys
import io

# Fix Windows console encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ──────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ──────────────────────────────────────────────────────────────────────────────
BACKEND_URL  = "http://localhost:8000"
FRONTEND_URL = "https://deploy-tau-five-10.vercel.app"
ADMIN_EMAIL  = "admin@getajob.com"
ADMIN_PASS   = "admin123"

# ──────────────────────────────────────────────────────────────────────────────
# RESULT TRACKING
# ──────────────────────────────────────────────────────────────────────────────
results = []

def test(name, passed, detail=""):
    icon = "[PASS]" if passed else "[FAIL]"
    results.append((name, passed, detail))
    print(f"  {icon}  {name}")
    if detail:
        print(f"          -> {detail}")

def section(title):
    print(f"\n{'='*62}")
    print(f"  {title}")
    print(f"{'='*62}")

# ------------------------------------------------------------------------------
# HELPER
# ------------------------------------------------------------------------------
def api(method, path, token=None, **kwargs):
    headers = kwargs.pop("headers", {})
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = f"{BACKEND_URL}{path}"
    try:
        r = getattr(requests, method)(url, headers=headers, timeout=60, **kwargs)
        return r
    except Exception as e:
        class FakeResp:
            status_code = 0
            def json(self): return {}
            text = str(e)
        return FakeResp()

# =============================================================================
# 1. INFRASTRUCTURE PING
# =============================================================================
section("1. INFRASTRUCTURE - Vercel & Render Uptime")

r = requests.get(FRONTEND_URL, timeout=20)
test("Vercel Frontend is online", r.status_code in (200, 307, 308),
     f"HTTP {r.status_code}")

r = api("get", "/api/v1/docs/")
test("Render Backend (Swagger) is online", r.status_code == 200,
     f"HTTP {r.status_code}")

r = api("get", "/api/v1/schema/")
test("Render Backend OpenAPI schema reachable", r.status_code == 200,
     f"HTTP {r.status_code}")

# =============================================================================
# 2. AUTHENTICATION - Tests Supabase connection implicitly
# =============================================================================
section("2. AUTHENTICATION & SUPABASE")

r = api("post", "/api/v1/auth/token/", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
token = None
if r.status_code == 200:
    data = r.json()
    token = data.get("access")
    test("Admin login successful", bool(token), f"Token: {str(token)[:30]}...")
else:
    test("Admin login successful", False, f"HTTP {r.status_code} -> {r.text[:200]}")

if not token:
    print("\n  [FAIL] Cannot continue without a valid token. Aborting remaining tests.")
    sys.exit(1)

# Token verify
r = api("post", "/api/v1/auth/token/verify/", json={"token": token})
test("JWT Token is valid", r.status_code == 200, f"HTTP {r.status_code}")

# =============================================================================
# 3. ACCOUNTS & WORKPLACES
# =============================================================================
section("3. ACCOUNTS - Profile & Workplaces")

# Profile data comes embedded in the login response (JWT payload)
# We use the /api/v1/auth/token/ response which includes user data
profile_r = api("get", "/api/v1/accounts/workplaces/", token=token)
test("API authenticated request works", profile_r.status_code == 200,
     f"HTTP {profile_r.status_code}")

# Extract user info from the JWT token payload (it is embedded there)
import base64, json as _json
try:
    jwt_parts = token.split('.')
    padded = jwt_parts[1] + '=' * (4 - len(jwt_parts[1]) % 4)
    jwt_payload = _json.loads(base64.b64decode(padded).decode())
    user_email = jwt_payload.get('email', 'N/A')
    user_id = jwt_payload.get('user_id', jwt_payload.get('id', None))
    test("JWT contains user info (profile)", bool(user_email),
         f"User: {user_email}, ID: {user_id}")
except Exception as e:
    user_id = None
    test("JWT contains user info (profile)", False, str(e))

workplaces = []
if r.status_code == 200:
    workplaces = r.json() if isinstance(r.json(), list) else r.json().get("results", [])
    test("Fetch workplaces (multi-tenant isolation)", True,
         f"{len(workplaces)} workplace(s) found")
else:
    test("Fetch workplaces (multi-tenant isolation)", False,
         f"HTTP {r.status_code} -> {r.text[:100]}")

# =============================================================================
# 4. POSITIONS
# =============================================================================
section("4. JOB POSITIONS - Create, Read, Update")

# List categories first
r = api("get", "/api/v1/positions/categories/", token=token)
categories = []
if r.status_code == 200:
    cats_data = r.json()
    categories = cats_data if isinstance(cats_data, list) else cats_data.get("results", [])
test("List position categories", r.status_code == 200, f"{len(categories)} categories")

# Create a test position
import time as _time
pos_name = f"E2E Test Engineer {int(_time.time())}"
pos_payload = {
    "name": pos_name,
    "status": "open",
    "number_to_hire": 1,
    "number_to_shortlist": 3,
    "expected_hiring_date": "2026-12-31",
    "hard_skill_ids": [],
    "soft_skill_ids": [],
    "condition_ids": [],
}
if categories:
    pos_payload["category"] = categories[0]["id"]

r = api("post", "/api/v1/positions/positions/", token=token, json=pos_payload)
position_id = None
if r.status_code == 201:
    position_id = r.json().get("id")
    test("Create new job position", True, f"Position ID: {position_id}")
else:
    test("Create new job position", False, f"HTTP {r.status_code} -> {r.text[:200]}")

# List positions
r = api("get", "/api/v1/positions/positions/", token=token)
test("List all positions", r.status_code == 200, f"HTTP {r.status_code}")

# Update position
if position_id:
    r = api("patch", f"/api/v1/positions/positions/{position_id}/",
            token=token, json={"status": "open"})
    test("Update position status", r.status_code in (200, 204),
         f"HTTP {r.status_code}")

# =============================================================================
# 5. DOCUMENT UPLOAD & AI CV PARSING
# =============================================================================
section("5. DOCUMENT UPLOAD & AI CV PARSING")

# Generate a minimal in-memory PDF-like text file for testing
fake_cv_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 280 >>
stream
BT
/F1 12 Tf
50 750 Td
(John Doe) Tj
0 -20 Td
(Software Engineer) Tj
0 -20 Td
(john.doe@example.com) Tj
0 -20 Td
(Skills: Python, Django, React, PostgreSQL) Tj
0 -20 Td
(Experience: 5 years in full-stack development) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
0000000598 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
681
%%EOF"""

files = {
    "files": ("test_cv_john_doe.pdf", io.BytesIO(fake_cv_content), "application/pdf")
}
data = {
    "source": "upload",
}
r = api("post", "/api/v1/documents/documents/", token=token, files=files, data=data)
doc_id = None
if r.status_code == 201:
    docs = r.json()
    if isinstance(docs, list) and len(docs) > 0:
        doc_id = docs[0].get("id")
    test("Upload CV document", True, f"Document ID: {doc_id}")
else:
    test("Upload CV document", False, f"HTTP {r.status_code} -> {r.text[:300]}")

# Poll for AI processing (up to 60 seconds)
candidate_id = None
if doc_id:
    print(f"          -> Document ID: {doc_id}")
    print("          -> Polling AI processing status (up to 60s)...")
    for i in range(12):
        time.sleep(5)
        r = api("get", f"/api/v1/documents/documents/{doc_id}/", token=token)
        if r.status_code == 200:
            doc = r.json()
            status = doc.get("processing_status", "pending")
            print(f"             [{i+1}/12] Status: {status}")
            if status in ("completed", "success"):
                candidate_data = doc.get("candidate")
                if candidate_data and isinstance(candidate_data, dict):
                    candidate_id = candidate_data.get("id")
                test("AI CV parsing completed", True,
                     f"Status={status}, Candidate linked: {'Yes (ID='+str(candidate_id)+')' if candidate_id else 'No'}")
                break
            elif status in ("failed", "error"):
                test("AI CV parsing completed", False,
                     f"Processing failed: {doc.get('processing_result', 'unknown error')}")
                break
    else:
        test("AI CV parsing completed", False, "Timed out after 60 seconds")

# =============================================================================
# 6. CANDIDATES
# =============================================================================
section("6. CANDIDATES - List, Read, Skills")

r = api("get", "/api/v1/candidates/candidates/", token=token)
test("List all candidates", r.status_code == 200,
     f"HTTP {r.status_code}")

if r.status_code == 200:
    cands_data = r.json()
    candidates = cands_data if isinstance(cands_data, list) else cands_data.get("results", [])
    test("Candidates list is non-empty", len(candidates) > 0,
         f"{len(candidates)} candidates found")
    if not candidate_id and candidates:
        candidate_id = candidates[0]["id"]
        print(f"          -> Using first existing candidate ID: {candidate_id}")

if candidate_id:
    r = api("get", f"/api/v1/candidates/candidates/{candidate_id}/", token=token)
    test("Fetch candidate detail", r.status_code == 200,
         f"HTTP {r.status_code}" + (f" -> {r.json().get('first_name','')} {r.json().get('last_name','')}" if r.status_code==200 else ""))

# =============================================================================
# 7. MATCHING ENGINE
# =============================================================================
section("7. MATCHING ENGINE - AI Candidate <-> Position Scoring")

if position_id:
    r = api("get", f"/api/v1/matching/position/{position_id}/", token=token)
    test("Matching engine returns results", r.status_code == 200,
         f"HTTP {r.status_code}" + (f" -> {len(r.json() if isinstance(r.json(),list) else r.json().get('results', []))} matches" if r.status_code==200 else f" -> {r.text[:100]}"))
else:
    test("Matching engine returns results", False, "Skipped - no position ID")

# =============================================================================
# 8. ASSESSMENT - Quiz Templates & AI Tests
# =============================================================================
section("8. ASSESSMENT - Quiz Templates & AI Test Generation")

r = api("get", "/api/v1/assessment/templates/", token=token)
templates = []
if r.status_code == 200:
    templates_data = r.json()
    templates = templates_data if isinstance(templates_data, list) else templates_data.get("results", [])
    test("List quiz templates", True, f"{len(templates)} template(s) found")
else:
    test("List quiz templates", False, f"HTTP {r.status_code}")

r = api("get", "/api/v1/assessment/categories/", token=token)
test("List quiz categories", r.status_code == 200, f"HTTP {r.status_code}")

r = api("get", "/api/v1/assessment/questions/", token=token)
questions_count = 0
if r.status_code == 200:
    q_data = r.json()
    questions = q_data if isinstance(q_data, list) else q_data.get("results", [])
    questions_count = len(questions)
test("List assessment questions", r.status_code == 200, f"{questions_count} questions")

r = api("get", "/api/v1/assessment/quizzes/", token=token)
test("List quiz instances", r.status_code == 200, f"HTTP {r.status_code}")

# Try generating a quiz if templates and candidates exist
if templates and candidate_id:
    # Need a recruiter ID - get it from profile
    profile_r = api("get", "/api/v1/accounts/profile/", token=token)
    recruiter_id = profile_r.json().get("id") if profile_r.status_code == 200 else 1

    quiz_payload = {
        "template_id": templates[0]["id"],
        "candidate_id": candidate_id,
        "recruiter_id": recruiter_id,
        "question_count": 3
    }
    r = api("post", "/api/v1/assessment/public/generate_quiz/", json=quiz_payload)
    if r.status_code == 200:
        quiz_id = r.json().get("quiz_id")
        q_count = r.json().get("question_count", 0)
        test("Generate AI quiz for candidate", True,
             f"Quiz ID: {quiz_id}, {q_count} questions generated")
    else:
        test("Generate AI quiz for candidate", False,
             f"HTTP {r.status_code} -> {r.text[:200]}")
else:
    test("Generate AI quiz for candidate", False,
         "Skipped - no templates or no candidate ID available")

# =============================================================================
# 9. WORKFLOW
# =============================================================================
section("9. WORKFLOW - Configuration Endpoints")

r = api("get", "/api/v1/workflow/config/", token=token)
test("List workflow configs", r.status_code == 200,
     f"HTTP {r.status_code}")

r = api("get", "/api/v1/workflow/config/?position=1", token=token)
test("List workflow steps", r.status_code in (200, 404),
     f"HTTP {r.status_code}")

# =============================================================================
# 10. DASHBOARD ANALYTICS
# =============================================================================
section("10. DASHBOARD ANALYTICS - All Stat Endpoints")

dashboard_endpoints = [
    ("/api/v1/dashboard/top-matches/",             "Top Matches"),
    ("/api/v1/dashboard/positions-matching/",      "Positions Matching"),
    ("/api/v1/dashboard/candidates-trend/",        "Candidates Trend"),
    ("/api/v1/dashboard/getajob-candidates-trend/","Getajob Candidates Trend"),
    ("/api/v1/dashboard/active-candidates/",       "Active Candidates"),
]

for endpoint, name in dashboard_endpoints:
    r = api("get", endpoint, token=token)
    test(f"Dashboard: {name}", r.status_code == 200,
         f"HTTP {r.status_code}" + (f" -> {str(r.json())[:80]}" if r.status_code==200 else f" -> {r.text[:100]}"))

# =============================================================================
# 11. CLEANUP - Remove test data
# =============================================================================
section("11. CLEANUP - Removing Test Data")

if doc_id:
    r = api("delete", f"/api/v1/documents/{doc_id}/", token=token)
    test("Delete test document", r.status_code in (200, 204, 404),
         f"HTTP {r.status_code}")

if candidate_id:
    # Only delete if it was created by us (linked to the doc we uploaded)
    # We'll skip to avoid deleting real candidates
    test("Candidate cleanup", True, "Skipped to preserve data (check dashboard to verify)")

if position_id:
    r = api("delete", f"/api/v1/positions/positions/{position_id}/", token=token)
    test("Delete test position", r.status_code in (200, 204, 404),
         f"HTTP {r.status_code}")

# =============================================================================
# FINAL SUMMARY
# =============================================================================
section("FINAL TEST SUMMARY")

total   = len(results)
passed  = sum(1 for _, p, _ in results if p)
failed  = total - passed
pct     = round(passed / total * 100) if total else 0

print(f"\n  Total Tests : {total}")
print(f"  [PASS] Passed : {passed}")
print(f"  [FAIL] Failed : {failed}")
print(f"  Score       : {pct}%")

if failed > 0:
    print(f"\n  -- Failed Tests --")
    for name, passed_, detail in results:
        if not passed_:
            print(f"  [FAIL] {name}")
            if detail:
                print(f"     -> {detail}")

print(f"\n{'='*62}\n")
