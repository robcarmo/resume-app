#!/bin/bash

# Quick Deploy Script for Resume App with API Key
# This script deploys your resume app to Cloud Run with the correct API key configuration

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Resume App - Quick Deploy${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Your API key
API_KEY="AIzaSyCgOjn1-fgGq93Z_P6KCLscwtTM_taLL4Y"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${RED}❌ Error: Not authenticated with gcloud${NC}"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: No project configured${NC}"
    echo "Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${YELLOW}📋 Configuration:${NC}"
echo -e "  Project: ${GREEN}$PROJECT_ID${NC}"
echo -e "  API Key: ${GREEN}${API_KEY:0:20}...${NC}"
echo -e "  Region: ${GREEN}us-east1${NC}"
echo ""

# Ask for confirmation
read -p "Do you want to proceed with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🚀 Starting deployment...${NC}"
echo ""

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Check if we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}📍 Current branch: ${GREEN}$CURRENT_BRANCH${NC}"

# Ensure we have the latest code
echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
git pull origin $CURRENT_BRANCH || echo "⚠️  Could not pull latest changes, proceeding anyway..."

echo ""
echo -e "${YELLOW}🔨 Triggering Cloud Build...${NC}"
echo ""

# Submit the build with the API key
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_GEMINI_API_KEY="$API_KEY"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    
    # Get the service URL
    echo -e "${YELLOW}📍 Getting Cloud Run service URL...${NC}"
    SERVICE_URL=$(gcloud run services describe resume-app --region=us-east1 --format='value(status.url)' 2>/dev/null)
    
    if [ -n "$SERVICE_URL" ]; then
        echo ""
        echo -e "${GREEN}================================${NC}"
        echo -e "${GREEN}🎉 Your app is deployed!${NC}"
        echo -e "${GREEN}================================${NC}"
        echo ""
        echo -e "${GREEN}URL: ${SERVICE_URL}${NC}"
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo "1. Open the URL in your browser"
        echo "2. Test uploading a resume PDF"
        echo "3. Verify AI features work correctly"
        echo ""
        echo -e "${YELLOW}Security:${NC}"
        echo "Don't forget to restrict your API key!"
        echo "See: https://console.cloud.google.com/apis/credentials"
        echo ""
    else
        echo -e "${YELLOW}⚠️  Could not retrieve service URL${NC}"
        echo "You can find it at: https://console.cloud.google.com/run"
    fi
else
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo ""
    echo "Check the logs at: https://console.cloud.google.com/cloud-build/builds"
    echo ""
    exit 1
fi
