BASE="https://brain.getajob.com/api/v1"
EMAIL="adnane.benyoussef@gmail.com"
PASS="raniaber"

# --- Login ---
curl -X POST "$BASE/accounts/login/" \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"$EMAIL\", \"password\":\"$PASS\"}" \
     | jq -r '.access' > token.txt

# --- Confirm token saved ---
cat token.txt
