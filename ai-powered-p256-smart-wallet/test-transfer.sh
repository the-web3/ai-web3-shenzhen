#!/bin/bash

# Test script for transfer endpoint
# This helps diagnose the "Unexpected non-whitespace" error

echo "🧪 Testing HashKey Chain Smart Wallet Backend"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "1️⃣  Checking if backend is running..."
HEALTH_CHECK=$(curl -s http://localhost:8080/api/health 2>&1)
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend is not running!${NC}"
    echo ""
    echo "To start backend:"
    echo "  cd backend && go run cmd/server/main.go"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Check health response
echo "2️⃣  Health check response:"
echo "$HEALTH_CHECK" | jq . 2>/dev/null || echo "$HEALTH_CHECK"
echo ""

# Test with invalid token (should return 401)
echo "3️⃣  Testing auth requirement..."
TRANSFER_TEST=$(curl -s -w "\n%{http_code}" -X POST http://localhost:8080/api/transfer/simple \
  -H "Content-Type: application/json" \
  -d '{"recipient":"0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1","amount":"10000000000000000"}' \
  2>&1)

HTTP_CODE=$(echo "$TRANSFER_TEST" | tail -n1)
RESPONSE=$(echo "$TRANSFER_TEST" | head -n-1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Auth is required (got 401)${NC}"
    echo "Response:"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
else
    echo -e "${YELLOW}⚠️  Expected 401, got $HTTP_CODE${NC}"
    echo "Response:"
    echo "$RESPONSE"
fi
echo ""

# Check environment variables
echo "4️⃣  Checking environment variables..."
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✅ backend/.env exists${NC}"
    echo ""
    echo "Key variables:"
    grep -E "^(CHAIN_ID|RPC_URL|BUNDLER_PRIVATE_KEY|FACTORY_ADDRESS)" backend/.env | sed 's/BUNDLER_PRIVATE_KEY=.*/BUNDLER_PRIVATE_KEY=***hidden***/'
else
    echo -e "${RED}❌ backend/.env not found${NC}"
fi
echo ""

# Instructions
echo "📝 Next Steps:"
echo "=============="
echo ""
echo "If you see 'Non-JSON response' error in frontend:"
echo "  1. Check backend logs for errors"
echo "  2. Verify RPC_URL is accessible: ${YELLOW}https://hashkeychain-testnet.alt.technology${NC}"
echo "  3. Make sure you have a valid session token (login with Passkey first)"
echo ""
echo "To test with a real session:"
echo "  1. Open browser DevTools (Network tab)"
echo "  2. Login with Passkey"
echo "  3. Copy the 'X-Session-Token' header value"
echo "  4. Run: ${YELLOW}curl -H \"X-Session-Token: YOUR_TOKEN\" ...${NC}"
echo ""
