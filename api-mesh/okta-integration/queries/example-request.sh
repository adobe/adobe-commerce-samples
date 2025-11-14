#!/bin/bash

# Example script to test Okta integration with API Mesh
# Replace the values below with your actual configuration

# Configuration
OKTA_DOMAIN="your-domain.okta.com"
OKTA_CLIENT_ID="your_client_id"
OKTA_CLIENT_SECRET="your_client_secret"
API_MESH_ENDPOINT="https://your-mesh-id.adobeioruntime.net/graphql"

echo "🔐 Step 1: Getting Okta access token..."
echo ""

# Get Okta access token using OAuth 2.0 Client Credentials flow
TOKEN_RESPONSE=$(curl -s --request POST \
  --url "https://${OKTA_DOMAIN}/oauth2/default/v1/token" \
  --header 'content-type: application/x-www-form-urlencoded' \
  --data "client_id=${OKTA_CLIENT_ID}" \
  --data "client_secret=${OKTA_CLIENT_SECRET}" \
  --data "grant_type=client_credentials" \
  --data "scope=openid profile email")

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
  "query": "{ currentUser { email firstName lastName } }"
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

