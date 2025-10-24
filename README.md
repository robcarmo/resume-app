<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://i.ytimg.com/vi/xvkKr0kzWd4/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLB6QZktas_LC66zXsP2yzF0bmlUpA" />
<img width="1200" height="475" alt="GHBanner" src="https://www.resumebuilder.com/wp-content/uploads/2022/12/Professional-Illustrator-Resume-Example-Banner-Image.png" />
</div>

# AI Resume Formatter

An AI-powered resume improvement application built with React, TypeScript, and Google's Gemini API. This app helps users optimize and format their resumes with intelligent suggestions.

View your app in AI Studio: https://ai.studio/apps/drive/170r_ZB3kyHo8jhtmkdwk4qcGwJU7Kvw8

## 📋 Table of Contents

- [Run Locally](#run-locally)
- [Development Scripts](#development-scripts)
- [Deployment Options](#deployment-options)
  - [Option 1: Automated Deployment with Cloud Build (Recommended)](#option-1-automated-deployment-with-cloud-build-recommended)
  - [Option 2: Manual Deployment with gcloud](#option-2-manual-deployment-with-gcloud)
- [Testing Docker Image Locally](#testing-docker-image-locally)
- [Configuration](#configuration)
- [Architecture](#architecture)

---

## 🚀 Run Locally

**Prerequisites:** Node.js 20+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set the Gemini API key:**
   Copy the example environment file and add your API key:
   ```bash
   cp .env.example .env
   # Then edit .env and replace 'your_gemini_api_key_here' with your actual API key
   # Or use this command:
   echo "VITE_API_KEY=your_gemini_api_key_here" > .env
   ```
   
   Get your API key from [Google AI Studio](https://aistudio.google.com/)

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

---

## 🛠️ Development Scripts

Utility scripts are provided to streamline local development workflows.

### start-stop.sh

Manage the development server easily:

```bash
# Start the development server
./start-stop.sh start

# Check server status
./start-stop.sh status

# Stop the development server
./start-stop.sh stop

# Restart the development server
./start-stop.sh restart

# Show help
./start-stop.sh help
```

**Features:**
- ✅ Starts server in background with PID tracking
- ✅ Checks if server is already running
- ✅ Graceful shutdown with fallback to force kill
- ✅ Status checking with port monitoring
- ✅ Automatic dependency installation if needed
- ✅ Logs output to `dev-server.log`

### build.sh

Manage production builds:

```bash
# Build the application
./build.sh build

# Clean the build directory
./build.sh clean

# Clean and rebuild
./build.sh rebuild

# Preview the production build
./build.sh preview

# Show help
./build.sh help
```

**Features:**
- ✅ Clean build artifacts (`dist/` directory)
- ✅ Production build with size reporting
- ✅ Combined clean + build for fresh rebuilds
- ✅ Local preview of production build
- ✅ Automatic dependency installation if needed
- ✅ Colored output for better readability

---

## 🌐 Deployment Options

### Option 1: Automated Deployment with Cloud Build (Recommended)

This method uses Cloud Build triggers to automatically build and deploy your app whenever you push to GitHub.

#### Prerequisites

- Google Cloud Project with billing enabled
- Google Cloud Build API enabled
- Gemini API key from [Google AI Studio](https://aistudio.google.com/)

#### Step 1: Enable Required APIs

```bash
# Enable Cloud Build, Cloud Run, and Container Registry APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### Step 2: Set Up Cloud Build Trigger

1. **Go to Cloud Build Triggers in Google Cloud Console:**
   ```
   https://console.cloud.google.com/cloud-build/triggers
   ```

2. **Click "CREATE TRIGGER"**

3. **Configure the trigger:**
   - **Name:** `resume-app-deploy`
   - **Description:** `Build and deploy resume-app to Cloud Run`
   - **Event:** Push to a branch
   - **Source:** Connect your GitHub repository (`robcarmo/resume-app`)
   - **Branch:** `^main$` (or use a regex pattern like `^main$` to match the main branch)
   - **Build Configuration:** Cloud Build configuration file (yaml or json)
   - **Cloud Build configuration file location:** `cloudbuild.yaml`

4. **Add Substitution Variables:**
   Scroll down to the "Substitution variables" section and add:
   
   | Variable | Value |
   |----------|-------|
   | `_GEMINI_API_KEY` | Your Gemini API key from AI Studio |

   ⚠️ **Important:** This is where you set your API key. The underscore prefix (`_`) makes it a user-defined substitution variable.

5. **Click "CREATE"**

#### Step 3: Trigger the Build

Now, every time you push to the main branch, Cloud Build will automatically:
1. Build the Docker image with your API key
2. Tag it with the commit SHA and 'latest'
3. Push it to Google Container Registry
4. Deploy it to Cloud Run in the `us-east1` region
5. Make it publicly accessible

You can also **manually trigger** a build:
```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_GEMINI_API_KEY="your_gemini_api_key_here"
```

#### Step 4: View Your Deployed App

After the build completes, get your Cloud Run service URL:
```bash
gcloud run services describe resume-app --region=us-east1 --format='value(status.url)'
```

---

### Option 2: Manual Deployment with gcloud

If you prefer manual control or want to test locally before deploying, use this method.

#### Prerequisites

- Docker installed on your local machine
- Google Cloud SDK (gcloud) installed and authenticated

#### Step 1: Build the Docker Image Locally

```bash
# Set your project ID
export PROJECT_ID=$(gcloud config get-value project)

# Build the Docker image with your Gemini API key
docker build \
  --build-arg API_KEY="your_gemini_api_key_here" \
  -t gcr.io/$PROJECT_ID/resume-app:latest \
  .
```

#### Step 2: Push to Google Container Registry

```bash
# Configure Docker to authenticate with GCR
gcloud auth configure-docker

# Push the image
docker push gcr.io/$PROJECT_ID/resume-app:latest
```

#### Step 3: Deploy to Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy resume-app \
  --image=gcr.io/$PROJECT_ID/resume-app:latest \
  --region=us-east1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1
```

#### Step 4: Get Your Service URL

```bash
gcloud run services describe resume-app --region=us-east1 --format='value(status.url)'
```

---

## 🐳 Testing Docker Image Locally

Before deploying to Cloud Run, you can test the Docker image on your local machine.

### Build the Image

```bash
docker build \
  --build-arg API_KEY="your_gemini_api_key_here" \
  -t resume-app:test \
  .
```

### Run the Container

```bash
docker run -p 8080:8080 resume-app:test
```

### Test in Your Browser

Open `http://localhost:8080` in your browser to test the application.

### Stop the Container

```bash
# Find the container ID
docker ps

# Stop the container
docker stop <container_id>
```

### Clean Up

```bash
# Remove the container
docker rm <container_id>

# Remove the image (optional)
docker rmi resume-app:test
```

---

## ⚙️ Configuration

### Substitution Variables in Cloud Build

The `cloudbuild.yaml` file uses the following substitution variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `_GEMINI_API_KEY` | Your Gemini API key for the AI service | Yes |
| `PROJECT_ID` | Your Google Cloud Project ID (automatically set by Cloud Build) | Yes (Auto) |
| `COMMIT_SHA` | Git commit SHA (automatically set by Cloud Build) | Yes (Auto) |

### Environment Variables in Dockerfile

The Dockerfile accepts the following build argument:

| Build Arg | Environment Variable | Description |
|-----------|---------------------|-------------|
| `API_KEY` | `API_KEY` | Gemini API key embedded in the built application |

⚠️ **Security Note:** The API key is embedded in the client-side JavaScript bundle and is visible to users. Always:
- Restrict your API key by HTTP referrer in Google Cloud Console
- Restrict to Generative Language API only
- Set usage quotas to prevent abuse

📖 **For detailed security guidance**, see [SECURITY.md](SECURITY.md)

### API Key Security Best Practices

1. **Go to Google Cloud Console:**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Select your API key and configure restrictions:**
   - **Application restrictions:** HTTP referrers
     - Add your Cloud Run URL: `https://resume-app-*.run.app/*`
     - Add localhost for testing: `http://localhost:*/*`
   - **API restrictions:** Restrict to "Generative Language API"

---

## 🏗️ Architecture

This application uses a **multi-stage Docker build** approach:

1. **Build Stage (Node.js 20):**
   - Installs npm dependencies
   - Embeds the Gemini API key at build time
   - Compiles the React/TypeScript application using Vite
   - Produces optimized static files in the `dist` folder

2. **Serve Stage (Nginx):**
   - Uses a lightweight Nginx Alpine image
   - Copies the built static files from the build stage
   - Serves the application on port 8080
   - Configured for Single Page Application (SPA) routing

### Key Files

- `cloudbuild.yaml` - Cloud Build configuration for automated deployment
- `Dockerfile` - Multi-stage Docker build configuration
- `nginx.conf` - Nginx configuration for serving the SPA
- `package.json` - Node.js dependencies and build scripts
- `vite.config.ts` - Vite build configuration

---

## 📚 Additional Resources

- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Container Registry Documentation](https://cloud.google.com/container-registry/docs)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Detailed Deployment Guide](DEPLOYMENT.md)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
