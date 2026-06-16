curl -X GET \
  https://brain.getajob.com/api/v1/documents/ \
  -H "accept: application/json" \
  -H "Authorization: Bearer $(cat token.txt)"
