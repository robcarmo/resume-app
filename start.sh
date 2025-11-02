#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Resume App - Startup Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Gemini API Key (modify if needed)
GEMINI_API_KEY="AIzaSyCgOjn1-fgGq93Z_P6KCLscwtTM_taLL4Y"

if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${RED}❌ Error: GEMINI_API_KEY is not set${NC}"
    echo -e "${YELLOW}Set your Gemini API key in this script${NC}"
    exit 1
fi

# Check if already running
if [ "$(docker ps -q -f name=resume-app)" ]; then
    echo -e "${YELLOW}⚠️  Resume app is already running${NC}"
    echo ""
    echo -e "${GREEN}📍 Access Details:${NC}"
    echo -e "   ${BLUE}Local:${NC}    http://localhost:8080"
    NETWORK_IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}')
    [ -n "$NETWORK_IP" ] && echo -e "   ${BLUE}Network:${NC}  http://$NETWORK_IP:8080"
    exit 0
fi

echo -e "${BLUE}🔨 Building Docker image...${NC}"
docker build --build-arg GEMINI_API_KEY="$GEMINI_API_KEY" -t resume-app:local . --quiet

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Remove old container if exists
[ "$(docker ps -aq -f name=resume-app)" ] && docker rm resume-app > /dev/null 2>&1

echo -e "${BLUE}🚀 Starting resume app...${NC}"
docker run -d -p 8080:8080 --name resume-app resume-app:local > /dev/null

sleep 2

if [ "$(docker ps -q -f name=resume-app)" ]; then
    echo -e "${GREEN}✓ Resume app started successfully!${NC}"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}📍 Access Details:${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "   ${BLUE}Local:${NC}    http://localhost:8080"
    
    NETWORK_IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}')
    [ -n "$NETWORK_IP" ] && echo -e "   ${BLUE}Network:${NC}  http://$NETWORK_IP:8080"
    
    echo ""
    echo -e "${YELLOW}💡 Useful Commands:${NC}"
    echo -e "   ${BLUE}View logs:${NC}     docker logs -f resume-app"
    echo -e "   ${BLUE}Stop app:${NC}      ./stop.sh"
    echo -e "   ${BLUE}Restart:${NC}       ./stop.sh && ./start.sh"
    echo ""
    echo -e "${GREEN}========================================${NC}"
else
    echo -e "${RED}❌ Container failed to start${NC}"
    exit 1
fi