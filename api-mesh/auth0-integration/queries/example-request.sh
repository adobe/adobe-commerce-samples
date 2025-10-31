#!/bin/bash

# Example script to test Auth0 integration with API Mesh
# Replace the values below with your actual configuration

# Configuration
AUTH0_DOMAIN="your-tenant.auth0.com"
AUTH0_CLIENT_ID="your_client_id"
AUTH0_CLIENT_SECRET="your_client_secret"
AUTH0_AUDIENCE="https://commerce.example.com/api"
API_MESH_ENDPOINT="https://your-mesh-id.adobeioruntime.net/graphql"

echo "🔐 Step 1: Getting Auth0 access token..."
echo ""

# Get Auth0 access token
TOKEN_RESPONSE=$(curl -s --request POST \
  --url "https://${AUTH0_DOMAIN}/oauth/token" \
  --header 'content-type: application/json' \
  --data "{
    \"client_id\": \"${AUTH0_CLIENT_ID}\",
    \"client_secret\": \"${AUTH0_CLIENT_SECRET}\",
    \"audience\": \"${AUTH0_AUDIENCE}\",
    \"grant_type\": \"client_credentials\"
  }")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get access token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Got access token: ${ACCESS_TOKEN:0:20}..."
echo ""

echo "📊 Step 2: Querying API Mesh..."
echo ""

# Query API Mesh with the token
QUERY='{
  "query": "{ currentUser { email name picture } }"
}'

MESH_RESPONSE=$(curl -s --request POST \
  --url "${API_MESH_ENDPOINT}" \
  --header "Authorization: Bearer ${ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --data "$QUERY")

echo "✅ Response from API Mesh:"
echo "$MESH_RESPONSE" | jq '.'

echo ""
echo "🎉 Done!"

