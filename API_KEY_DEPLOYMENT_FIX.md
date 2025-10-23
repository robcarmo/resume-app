# 🔑 API Key Configuration Fix for Cloud Run Deployment

## 📊 Diagnosis

### The Issue
When users access your deployed Cloud Run application, they see:
> **"The request to the AI service failed due to an API key issue. Please contact support."**

### Root Cause Analysis

✅ **What's Working:**
- Local development works perfectly with API key: `AIzaSyCgOjn1-fgGq93Z_P6KCLscwtTM_taLL4Y`
- The `.env` file contains the correct API key
- All code is correct and properly configured

❌ **What's Not Working:**
- The deployed Cloud Run application doesn't have the API key embedded
- The Cloud Build trigger is missing the `_GEMINI_API_KEY` substitution variable

### Why This Happens

This is a **frontend-only React app** that embeds the API key at **build time**, not runtime. Here's the flow:

```
1. Cloud Build Trigger
   └─> _GEMINI_API_KEY substitution variable
       └─> Passed to Docker as --build-arg API_KEY
           └─> Dockerfile: ENV API_KEY=${API_KEY}
               └─> vite.config.ts: process.env.API_KEY at build time
                   └─> Embedded in JavaScript bundle
                       └─> geminiService.ts: uses process.env.API_KEY
```

**The Problem:** If `_GEMINI_API_KEY` is not set in the Cloud Build trigger, the default value `"your-api-key-here"` from `cloudbuild.yaml` line 58 is used, which is invalid.

---

## 🔧 The Fix

You have **3 options** to fix this issue. Choose the one that best fits your workflow.

### Option 1: Configure Cloud Build Trigger (RECOMMENDED) ⭐

This is the **best long-term solution** because the API key will be used automatically for all future deployments.

#### Steps:

1. **Open Cloud Build Triggers:**
   - Go to: https://console.cloud.google.com/cloud-build/triggers
   - Or navigate: Google Cloud Console → Cloud Build → Triggers

2. **Find or Create Your Trigger:**
   - Look for `resume-app-deploy` or similar
   - If no trigger exists, click **"CREATE TRIGGER"** and configure it:
     - Name: `resume-app-deploy`
     - Event: Push to branch
     - Source: Your GitHub repository
     - Branch: `^main$`
     - Configuration: Cloud Build configuration file
     - File location: `cloudbuild.yaml`

3. **Configure Substitution Variables:**
   - Click **"EDIT"** on your trigger
   - Scroll down to **"Substitution variables"** section
   - Click **"ADD VARIABLE"**
   - Add the following:
     ```
     Variable name: _GEMINI_API_KEY
     Value: AIzaSyCgOjn1-fgGq93Z_P6KCLscwtTM_taLL4Y
     ```
   - Click **"SAVE"**

4. **Trigger a New Build:**
   - Option A: Click **"RUN"** on the trigger
   - Option B: Push a change to the main branch:
     ```bash
     cd /home/ubuntu/github_repos/resume-app
     git checkout main
     git pull origin main
     git push origin main
     ```

---

### Option 2: Manual Deployment with gcloud CLI

If you prefer manual control, you can build and deploy directly using the command line.

#### Prerequisites:
- Google Cloud SDK (gcloud) installed
- Authenticated with your Google Cloud project
- In the project directory

#### Steps:

```bash
# Navigate to the project directory
cd /home/ubuntu/github_repos/resume-app

# Ensure you're on the latest main branch
git checkout main
git pull origin main

# Trigger a build with the API key
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_GEMINI_API_KEY="AIzaSyCgOjn1-fgGq93Z_P6KCLscwtTM_taLL4Y"
```

This will:
1. ✅ Build the Docker image with the API key embedded
2. ✅ Push it to Google Container Registry
3. ✅ Deploy it to Cloud Run automatically

**Estimated time:** 3-5 minutes

---

### Option 3: Build and Push Manually (Advanced)

For maximum control, you can build the Docker image locally and push it to GCR.

#### Prerequisites:
- Docker installed locally
- Google Cloud SDK authenticated
- Docker configured for GCR: `gcloud auth configure-docker`

#### Steps:

```bash
# Navigate to the project directory
cd /home/ubuntu/github_repos/resume-app

# Get your project ID
export PROJECT_ID=$(gcloud config get-value project)

# Build the Docker image with the API key
docker build \
  --build-arg API_KEY="AIzaSyCgOjn1-fgGq93Z_P6KCLscwtTM_taLL4Y" \
  -t gcr.io/$PROJECT_ID/resume-app:latest \
  .

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/resume-app:latest

# Deploy to Cloud Run
gcloud run deploy resume-app \
  --image=gcr.io/$PROJECT_ID/resume-app:latest \
  --region=us-east1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300s
```

---

## ✅ Verification Steps

After deploying with any of the above methods:

### 1. Check Build Status

Go to Cloud Build History:
- URL: https://console.cloud.google.com/cloud-build/builds
- Look for the latest build
- Verify status: ✅ **SUCCESS**
- Check logs for any errors

### 2. Check Cloud Run Service

Go to Cloud Run Console:
- URL: https://console.cloud.google.com/run
- Click on **resume-app** service
- Verify the latest revision is deployed
- Note the service URL

### 3. Test the Application

1. **Open the Cloud Run URL** in your browser
2. **Upload a test resume PDF** (you can use `/home/ubuntu/Uploads/resume-sep-aws-2025.pdf`)
3. **Verify AI features work:**
   - ✅ Resume parsing completes successfully
   - ✅ No "API key issue" error message
   - ✅ Resume data is extracted and displayed
   - ✅ "Improve with AI" features work

### 4. Check Browser Console (Optional)

If you encounter issues:
1. Press **F12** to open browser DevTools
2. Go to **Console** tab
3. Look for any API-related errors
4. Check **Network** tab for failed requests to Gemini API

---

## 🔒 Security Recommendations

### ⚠️ Important: The API Key is Visible in Client-Side Code

Since this is a frontend app, the API key is embedded in the JavaScript bundle and can be extracted by anyone who inspects the code.

### Protect Your API Key:

#### 1. Restrict by HTTP Referrer

1. Go to Google Cloud Console → APIs & Credentials
   - URL: https://console.cloud.google.com/apis/credentials
2. Find your API key: `AIzaSyCgOjn1-fgGq93Z_P6KCLscwtTM_taLL4Y`
3. Click **"Edit"** (pencil icon)
4. Under **"Application restrictions"**, select **"HTTP referrers"**
5. Add your Cloud Run URL patterns:
   ```
   https://resume-app-*.run.app/*
   http://localhost:*/*
   http://127.0.0.1:*/*
   ```
6. Click **"Save"**

#### 2. Restrict to Specific APIs

1. In the same API key edit screen
2. Under **"API restrictions"**, select **"Restrict key"**
3. Select only: **"Generative Language API"**
4. Click **"Save"**

#### 3. Set Usage Quotas

1. Go to: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
2. Review and set appropriate quotas
3. Enable billing alerts to monitor usage

#### 4. Monitor Usage

1. Go to: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/metrics
2. Monitor daily API calls
3. Set up alerts for unusual activity

---

## 🔄 Updating the API Key in the Future

If you need to change the API key later:

### For Cloud Build Trigger:
1. Edit the trigger
2. Update the `_GEMINI_API_KEY` value
3. Trigger a new build

### For Manual Deployment:
1. Use the new API key in the `--substitutions` flag
2. Build and deploy as shown in Option 2

### Remember:
- The API key is **baked into the build**
- You must **rebuild and redeploy** to change it
- Old revisions will still have the old key

---

## 📋 Quick Reference

### Your Configuration Details:

| Setting | Value |
|---------|-------|
| **API Key** | `AIzaSyCgOjn1-fgGq93Z_P6KCLscwtTM_taLL4Y` |
| **Cloud Build Variable** | `_GEMINI_API_KEY` |
| **Docker Build Arg** | `API_KEY` |
| **Vite Environment** | `process.env.API_KEY` |
| **Service Name** | `resume-app` |
| **Region** | `us-east1` |
| **Port** | `8080` |

### Key Files:

| File | Purpose |
|------|---------|
| `cloudbuild.yaml` | Cloud Build configuration |
| `Dockerfile` | Multi-stage Docker build |
| `vite.config.ts` | Embeds API key at build time |
| `services/geminiService.ts` | Uses the API key |

---

## 🐛 Troubleshooting

### Issue: Build succeeds but API still doesn't work

**Check:**
1. Hard refresh browser: **Ctrl+F5** (Windows) or **Cmd+Shift+R** (Mac)
2. Try incognito/private mode to rule out caching
3. Verify the API key is valid at: https://aistudio.google.com/apikey
4. Check if the API key has usage restrictions that block your Cloud Run URL

### Issue: "Substitution variable _GEMINI_API_KEY not found"

**Solution:**
- Make sure you're using the underscore prefix: `_GEMINI_API_KEY` (not `GEMINI_API_KEY`)
- User-defined substitution variables in Cloud Build must start with `_`

### Issue: Build fails with "npm version mismatch"

**Solution:**
This should already be fixed in the main branch, but if it persists:
```bash
cd /home/ubuntu/github_repos/resume-app
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
git push origin main
```

### Issue: Still seeing "PDF library failed to load"

**This is a different issue!** See `FIX_DEPLOYMENT_NOW.md` for the PDF library fix. The API key fix only addresses AI functionality, not PDF processing.

---

## 📞 Need More Help?

### Useful Commands:

```bash
# Check Cloud Run logs
gcloud run logs read resume-app --region=us-east1 --limit=50

# Get Cloud Run service URL
gcloud run services describe resume-app --region=us-east1 --format='value(status.url)'

# List Cloud Build triggers
gcloud builds triggers list

# View recent builds
gcloud builds list --limit=5

# Check current git branch
cd /home/ubuntu/github_repos/resume-app && git branch

# View Cloud Build substitutions
gcloud builds triggers describe <TRIGGER-NAME>
```

### Useful Links:

- [Google AI Studio (Get API Keys)](https://aistudio.google.com/apikey)
- [Cloud Build Triggers Console](https://console.cloud.google.com/cloud-build/triggers)
- [Cloud Run Console](https://console.cloud.google.com/run)
- [API Credentials Console](https://console.cloud.google.com/apis/credentials)
- [Cloud Build History](https://console.cloud.google.com/cloud-build/builds)

---

## 📝 Summary

**The issue:** Cloud Build trigger doesn't have the API key configured.

**The fix:** Set `_GEMINI_API_KEY` to `AIzaSyCgOjn1-fgGq93Z_P6KCLscwtTM_taLL4Y` in the Cloud Build trigger or pass it via command line.

**Expected result:** AI features work correctly in the deployed application.

**Time to fix:** 2-5 minutes

**Action required:** Configure the trigger (Option 1) or manually deploy with the API key (Option 2 or 3).

---

**Last Updated:** October 23, 2025  
**Created by:** DeepAgent AI Assistant  
**Status:** ✅ Ready to Deploy
