#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Resume App - Shutdown Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if container is running
if [ ! "$(docker ps -q -f name=resume-app)" ]; then
    echo -e "${YELLOW}⚠️  Resume app is not running${NC}"
    
    # Check if container exists but stopped
    if [ "$(docker ps -aq -f name=resume-app)" ]; then
        echo -e "${BLUE}🧹 Removing stopped container...${NC}"
        docker rm resume-app > /dev/null 2>&1
        echo -e "${GREEN}✓ Cleanup complete${NC}"
    fi
    exit 0
fi

echo -e "${BLUE}🛑 Stopping resume app...${NC}"
docker stop resume-app > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Container stopped${NC}"
else
    echo -e "${RED}❌ Failed to stop container${NC}"
    exit 1
fi

echo -e "${BLUE}🧹 Removing container...${NC}"
docker rm resume-app > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Container removed${NC}"
else
    echo -e "${RED}❌ Failed to remove container${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Resume app stopped successfully${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}💡 To start again, run: ./start.sh${NC}"
echo ""