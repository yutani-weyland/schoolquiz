#!/bin/bash

# Test script for Zod validation on migrated API routes
# This script tests the validation behavior of migrated endpoints

BASE_URL="${BASE_URL:-http://localhost:3001}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Zod Validation Implementation"
echo "Base URL: $BASE_URL"
echo ""

test_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
}

test_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    if [ -n "$2" ]; then
        echo "   Response: $2"
    fi
}

test_info() {
    echo -e "${YELLOW}ℹ️  INFO${NC}: $1"
}

# Test helper function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${BASE_URL}${endpoint}")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "$expected_status" ]; then
        test_pass "$description (expected $expected_status, got $http_code)"
        return 0
    else
        test_fail "$description (expected $expected_status, got $http_code)" "$body"
        return 1
    fi
}

echo "=========================================="
echo "1. Testing /api/auth/signup"
echo "=========================================="

# Test: Valid email signup
test_endpoint "POST" "/api/auth/signup" \
    '{"method":"email","email":"test@example.com","password":"testpass123"}' \
    200 \
    "Valid email signup"

# Test: Missing email for email method
test_endpoint "POST" "/api/auth/signup" \
    '{"method":"email","password":"testpass123"}' \
    400 \
    "Missing email for email method"

# Test: Invalid email format
test_endpoint "POST" "/api/auth/signup" \
    '{"method":"email","email":"not-an-email","password":"testpass123"}' \
    400 \
    "Invalid email format"

# Test: Missing method
test_endpoint "POST" "/api/auth/signup" \
    '{"email":"test@example.com"}' \
    400 \
    "Missing method"

# Test: Invalid JSON
test_endpoint "POST" "/api/auth/signup" \
    '{"invalid": json}' \
    400 \
    "Invalid JSON body"

echo ""
echo "=========================================="
echo "2. Testing /api/auth/signin"
echo "=========================================="

# Test: Valid signin
test_endpoint "POST" "/api/auth/signin" \
    '{"method":"email","email":"test@example.com","password":"abc123"}' \
    200 \
    "Valid signin"

# Test: Invalid JSON
test_endpoint "POST" "/api/auth/signin" \
    '{"invalid": json}' \
    400 \
    "Invalid JSON body"

echo ""
echo "=========================================="
echo "3. Testing /api/admin/quizzes (POST)"
echo "=========================================="

# Test: Valid quiz creation
test_endpoint "POST" "/api/admin/quizzes" \
    '{
        "number": 999,
        "title": "Test Quiz",
        "description": "A test quiz",
        "status": "draft",
        "rounds": [
            {
                "category": "Test Category",
                "title": "Round 1",
                "questions": [
                    {"question": "Q1?", "answer": "A1"}
                ]
            }
        ]
    }' \
    200 \
    "Valid quiz creation"

# Test: Missing title
test_endpoint "POST" "/api/admin/quizzes" \
    '{
        "number": 999,
        "status": "draft",
        "rounds": []
    }' \
    400 \
    "Missing quiz title"

# Test: Missing rounds
test_endpoint "POST" "/api/admin/quizzes" \
    '{
        "number": 999,
        "title": "Test Quiz",
        "status": "draft",
        "rounds": []
    }' \
    400 \
    "Missing rounds"

# Test: Invalid status
test_endpoint "POST" "/api/admin/quizzes" \
    '{
        "number": 999,
        "title": "Test Quiz",
        "status": "invalid_status",
        "rounds": [
            {
                "category": "Test",
                "title": "Round 1",
                "questions": [{"question": "Q?", "answer": "A"}]
            }
        ]
    }' \
    400 \
    "Invalid status value"

echo ""
echo "=========================================="
echo "4. Testing /api/admin/users (POST)"
echo "=========================================="

# Test: Valid user creation
test_endpoint "POST" "/api/admin/users" \
    '{"email":"newuser@example.com","name":"New User","tier":"basic"}' \
    201 \
    "Valid user creation"

# Test: Invalid email
test_endpoint "POST" "/api/admin/users" \
    '{"email":"not-an-email","name":"User"}' \
    400 \
    "Invalid email format"

# Test: Missing email
test_endpoint "POST" "/api/admin/users" \
    '{"name":"User"}' \
    400 \
    "Missing required email"

echo ""
echo "=========================================="
echo "5. Testing /api/admin/organisations (POST)"
echo "=========================================="

# Test: Missing required fields
test_endpoint "POST" "/api/admin/organisations" \
    '{"name":"Test Org"}' \
    400 \
    "Missing ownerUserId"

# Test: Missing name
test_endpoint "POST" "/api/admin/organisations" \
    '{"ownerUserId":"user-123"}' \
    400 \
    "Missing organisation name"

echo ""
echo "=========================================="
echo "6. Testing Query Parameter Validation"
echo "=========================================="

# Test: Valid query params
test_endpoint "GET" "/api/admin/users?page=1&limit=20&search=test" \
    "" \
    200 \
    "Valid query parameters"

# Test: Invalid page number (should reject invalid values)
test_endpoint "GET" "/api/admin/users?page=0" \
    "" \
    400 \
    "Invalid page number (should reject < 1)"

# Test: Invalid sort order
test_endpoint "GET" "/api/admin/users?sortOrder=invalid" \
    "" \
    400 \
    "Invalid sort order"

echo ""
echo "=========================================="
echo "Testing Complete!"
echo "=========================================="
echo ""
test_info "Note: Some tests may fail due to database/auth requirements"
test_info "The important thing is that validation errors return 400 status"
echo ""

