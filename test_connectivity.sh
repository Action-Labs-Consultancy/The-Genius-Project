#!/bin/bash

echo "=== TAIGA N8N CONNECTIVITY TEST ==="

# Test 1: Basic connectivity
echo "1. Testing basic connectivity..."
docker exec n8n-fixed ping -c 1 taiga-docker-taiga-back-1

# Test 2: HTTP response
echo -e "\n2. Testing HTTP response..."
docker exec n8n-fixed sh -c 'echo -e "GET /api/v1/ HTTP/1.1\r\nHost: taiga-docker-taiga-back-1:8000\r\n\r\n" | nc -w 3 taiga-docker-taiga-back-1 8000'

# Test 3: Authentication endpoint
echo -e "\n3. Testing authentication endpoint..."
docker exec n8n-fixed sh -c 'echo -e "POST /api/v1/auth HTTP/1.1\r\nHost: taiga-docker-taiga-back-1:8000\r\nContent-Type: application/json\r\nContent-Length: 56\r\n\r\n{\"username\":\"admin\",\"password\":\"admin123\",\"type\":\"normal\"}" | nc -w 5 taiga-docker-taiga-back-1 8000'

echo -e "\n=== TEST COMPLETE ==="
