#!/bin/bash

# Example script to test Azure AD integration with API Mesh
# Replace the values below with your actual configuration

# Configuration
AZURE_TENANT_ID="your-tenant-id"
AZURE_CLIENT_ID="your-client-id"
AZURE_CLIENT_SECRET="your-client-secret"
AZURE_SCOPE="https://graph.microsoft.com/.default"
API_MESH_ENDPOINT="https://your-mesh-id.adobeioruntime.net/graphql"

echo "🔐 Step 1: Getting Azure AD access token..."
echo ""

# Get Azure AD access token using OAuth 2.0 Client Credentials flow
TOKEN_RESPONSE=$(curl -s --request POST \
  --url "https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token" \
  --header 'content-type: application/x-www-form-urlencoded' \
  --data "client_id=${AZURE_CLIENT_ID}" \
  --data "client_secret=${AZURE_CLIENT_SECRET}" \
  --data "scope=${AZURE_SCOPE}" \
  --data "grant_type=client_credentials")

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
  "query": "{ currentUser { mail displayName givenName surname } }"
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

