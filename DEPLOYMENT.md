# Deployment Guide - AI Resume Formatter

This guide explains how to deploy the AI Resume Formatter to Google Cloud Run using Docker and Nginx.

## Overview

This application uses a **multi-stage Docker build** approach:
1. **Build Stage**: Compiles the React/TypeScript application using Vite
2. **Serve Stage**: Serves the static files using Nginx

## Prerequisites

- Google Cloud SDK (gcloud) installed and authenticated
- Docker installed on your local machine
- A Google Cloud Project with billing enabled
- Gemini API key from [Google AI Studio](https://aistudio.google.com/)

## Architecture Changes

### Previous Approach (Buildpacks)
- Used Google Cloud Buildpacks
- Required Express.js server
- Had Procfile and server.js
- Deployment kept failing

### New Approach (Dockerfile + Nginx)
- Multi-stage Docker build
- Nginx serves static files
- More reliable and follows best practices
- Better performance and scalability

## Step-by-Step Deployment

### 1. Enable Required APIs

```bash
# Enable Cloud Run and Artifact Registry APIs
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### 2. Create Artifact Registry Repository

```bash
# Create a Docker repository (only needed once)
gcloud artifacts repositories create my-app-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker repository for AI Resume Formatter"
```

### 3. Configure Docker Authentication

```bash
# Authenticate Docker to push to Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### 4. Build and Push the Docker Image

**IMPORTANT**: You must provide your Gemini API key during the build process.

```bash
# Set environment variables for convenience
export PROJECT_ID=$(gcloud config get-value project)
export REGION=us-central1
export REPO=my-app-repo
export IMAGE_NAME=ai-resume-formatter
export IMAGE_TAG=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE_NAME}:latest

# Replace YOUR_GEMINI_API_KEY with your actual API key
export GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Build the Docker image with the API key as a build argument
docker build --build-arg API_KEY=${GEMINI_API_KEY} -t ${IMAGE_TAG} .

# Push the image to Artifact Registry
docker push ${IMAGE_TAG}
```

### 5. Deploy to Cloud Run

```bash
# Deploy the image to Cloud Run
gcloud run deploy ai-resume-formatter-service \
  --image=${IMAGE_TAG} \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated
```

**Note**: Unlike server-side applications, the `--set-env-vars` flag is NOT needed for Cloud Run deployment because the API key is embedded in the client-side code during the Docker build step.

## Local Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
# Create a .env file with your API key
echo "VITE_API_KEY=your_gemini_api_key_here" > .env

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production (Local Testing)

```bash
# Build the app with API key
export API_KEY=your_gemini_api_key_here
npm run build

# Preview the production build
npm run preview
```

## Security Considerations

### API Key Security

⚠️ **IMPORTANT**: This application is a **client-side React SPA** that makes direct API calls to Google's Gemini API from the browser. This means:

1. **The API key is embedded in the JavaScript bundle** and is visible to anyone who inspects the code
2. **API key restrictions are critical**: You MUST configure API key restrictions in Google Cloud Console:
   - Restrict by HTTP referrer (your domain)
   - Restrict to Generative Language API only
   - Set up usage quotas

### Recommended API Key Configuration

1. Go to [Google Cloud Console - API Credentials](https://console.cloud.google.com/apis/credentials)
2. Select your API key
3. Under "Application restrictions":
   - Choose "HTTP referrers (web sites)"
   - Add your Cloud Run URL (e.g., `https://your-service-*.run.app/*`)
   - Add your local development URL (e.g., `http://localhost:*/*`)
4. Under "API restrictions":
   - Choose "Restrict key"
   - Select "Generative Language API"

## Troubleshooting

### Build Fails

- Ensure you have the correct Node.js version (20+)
- Check that all dependencies are installed: `npm install`
- Verify your API key is set correctly

### Docker Build Fails

- Ensure Docker is running
- Check that you're passing the API key: `--build-arg API_KEY=...`
- Verify package.json and package-lock.json are in sync

### Deployment Fails

- Verify you have the necessary GCP permissions
- Check that the Artifact Registry repository exists
- Ensure Docker authentication is configured: `gcloud auth configure-docker us-central1-docker.pkg.dev`

### App Doesn't Load in Browser

- Check Cloud Run logs: `gcloud run services logs read ai-resume-formatter-service --region=us-central1`
- Verify the API key was embedded during build
- Check browser console for errors

## Files Structure

### New Files (Docker/Nginx Approach)
- `Dockerfile` - Multi-stage Docker build configuration
- `nginx.conf` - Nginx configuration for serving the SPA
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `main.css` - CSS file with Tailwind directives

### Updated Files
- `package.json` - Removed Express, added Tailwind dependencies
- `index.html` - Removed CDN scripts, using local builds
- `vite.config.ts` - Simplified configuration with API key handling

### Removed Files (No Longer Needed)
- `server.js` - No longer using Express server
- `Procfile` - No longer using Buildpacks

## Updating the Deployment

To deploy updates:

```bash
# Pull latest changes
git pull origin main

# Rebuild and push the image
docker build --build-arg API_KEY=${GEMINI_API_KEY} -t ${IMAGE_TAG} .
docker push ${IMAGE_TAG}

# Deploy the new version
gcloud run deploy ai-resume-formatter-service \
  --image=${IMAGE_TAG} \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated
```

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Gemini API Documentation](https://ai.google.dev/docs)
