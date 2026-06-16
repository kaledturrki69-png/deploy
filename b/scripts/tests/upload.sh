#!/usr/bin/env bash
# -------------------------------------------------------------------
# Upload all documents in ./files folder using existing JWT token
# -------------------------------------------------------------------

set -euo pipefail

# ======= CONFIGURATION =======
BASE="https://brain.getajob.com/api/v1"       # adjust if needed
DOCS_ENDPOINT="$BASE/documents/"
FILES_DIR="./files"
TOKEN_FILE="token.txt"
OUTPUT_FILE="upload_results.json"
# ==============================

# --- Check token ---
if [[ ! -f "$TOKEN_FILE" ]]; then
  echo "❌ Token file not found: $TOKEN_FILE"
  echo "Please create it with your access token."
  exit 1
fi
ACCESS=$(<"$TOKEN_FILE")

# --- Check files directory ---
if [[ ! -d "$FILES_DIR" ]]; then
  echo "❌ Folder not found: $FILES_DIR"
  exit 1
fi

FILES=("$FILES_DIR"/*)
if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "⚠️ No files found in $FILES_DIR"
  exit 0
fi

echo "📂 Found ${#FILES[@]} file(s) to upload:"
for f in "${FILES[@]}"; do
  echo "  - $(basename "$f")"
done

# --- Build curl command dynamically ---
echo "⬆️ Uploading files to $DOCS_ENDPOINT ..."
CURL_CMD=(curl -s -X POST "$DOCS_ENDPOINT"
  -H "Authorization: Bearer $ACCESS")

for f in "${FILES[@]}"; do
  CURL_CMD+=(-F "files=@$f")
done

# --- Run upload and save response ---
"${CURL_CMD[@]}" > "$OUTPUT_FILE"

# --- Output summary ---
echo "✅ Upload completed."
echo "📄 Results saved in: $OUTPUT_FILE"

# Optional: pretty print
if command -v jq >/dev/null 2>&1; then
  echo
  jq . "$OUTPUT_FILE"
else
  echo
  cat "$OUTPUT_FILE"
fi
