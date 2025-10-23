# ✅ API Key Configuration Checklist

## Quick Diagnosis

**Problem:** "The request to the AI service failed due to an API key issue. Please contact support."

**Root Cause:** Cloud Build trigger doesn't have the API key configured.

---

## 🎯 Choose Your Fix Method

### Method 1: Use the Quick Deploy Script (EASIEST) ⭐

```bash
cd /home/ubuntu/github_repos/resume-app
./QUICK_DEPLOY_WITH_API_KEY.sh
```

**Time:** 3-5 minutes  
**Pros:** Automated, includes verification  
**Cons:** Requires gcloud CLI installed and authenticated

---

### Method 2: Configure Cloud Build Trigger (BEST FOR LONG-TERM)

Follow these steps:

- [ ] **Step 1:** Go to https://console.cloud.google.com/cloud-build/triggers
- [ ] **Step 2:** Find your `resume-app` trigger (or create one)
- [ ] **Step 3:** Click "EDIT"
- [ ] **Step 4:** Scroll to "Substitution variables"
- [ ] **Step 5:** Add variable:
  ```
  Variable: _GEMINI_API_KEY
  Value: AIzaSyCgOjn1-fgGq93Z_P6KCLscwtTM_taLL4Y
  ```
- [ ] **Step 6:** Click "SAVE"
- [ ] **Step 7:** Click "RUN" to trigger deployment
- [ ] **Step 8:** Wait 3-5 minutes for build to complete
- [ ] **Step 9:** Test your Cloud Run URL

**Time:** 5-10 minutes  
**Pros:** Set it once, works forever  
**Cons:** Requires Cloud Console access

---

### Method 3: Manual Command-Line Deployment

```bash
cd /home/ubuntu/github_repos/resume-app
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_GEMINI_API_KEY="AIzaSyCgOjn1-fgGq93Z_P6KCLscwtTM_taLL4Y"
```

**Time:** 3-5 minutes  
**Pros:** Quick one-off deployment  
**Cons:** Must repeat for each deployment

---

## 🔍 Verification Checklist

After deployment, verify these:

- [ ] Build completed successfully (check: https://console.cloud.google.com/cloud-build/builds)
- [ ] Cloud Run service is running (check: https://console.cloud.google.com/run)
- [ ] Open Cloud Run URL in browser
- [ ] Upload a test PDF resume
- [ ] Verify: No "API key issue" error appears
- [ ] Verify: Resume data is extracted correctly
- [ ] Verify: "Improve with AI" buttons work

---

## 🔒 Security Checklist (Do This After Deployment!)

Protect your API key from abuse:

- [ ] **Step 1:** Go to https://console.cloud.google.com/apis/credentials
- [ ] **Step 2:** Find API key: `AIzaSyCgOjn1-fgGq93Z_P6KCLscwtTM_taLL4Y`
- [ ] **Step 3:** Click "Edit" (pencil icon)
- [ ] **Step 4:** Set "Application restrictions" → "HTTP referrers"
- [ ] **Step 5:** Add allowed URLs:
  ```
  https://resume-app-*.run.app/*
  http://localhost:*/*
  ```
- [ ] **Step 6:** Set "API restrictions" → "Generative Language API" only
- [ ] **Step 7:** Click "Save"
- [ ] **Step 8:** Monitor usage regularly

---

## 📊 Status Check Commands

Use these to check deployment status:

```bash
# Check recent builds
gcloud builds list --limit=5

# Check Cloud Run service
gcloud run services list

# Get Cloud Run URL
gcloud run services describe resume-app --region=us-east1 --format='value(status.url)'

# View Cloud Run logs
gcloud run logs read resume-app --region=us-east1 --limit=20
```

---

## ❓ FAQ

### Q: Why does local development work but deployment doesn't?

**A:** Local development uses the `.env` file which has the API key. The deployed app needs the key embedded during the Docker build process, which requires passing it through Cloud Build.

### Q: Is the API key secure?

**A:** No, it's embedded in the client-side JavaScript and can be extracted. That's why you MUST:
1. Restrict it by HTTP referrer (your Cloud Run URL)
2. Restrict it to only the Generative Language API
3. Monitor usage regularly

### Q: Do I need to redeploy to change the API key?

**A:** Yes. The API key is baked into the build. To change it, update the Cloud Build trigger variable and redeploy.

### Q: Can I use runtime environment variables instead?

**A:** No. This is a frontend-only app (React + Vite + Nginx). The JavaScript bundle is created at build time, so the API key must be embedded during the build.

### Q: What if I see "PDF library failed to load" instead?

**A:** That's a different issue. See `FIX_DEPLOYMENT_NOW.md` for the PDF library fix.

---

## 🆘 Still Having Issues?

### If deployment succeeds but API still fails:

1. **Hard refresh your browser:** Ctrl+F5 or Cmd+Shift+R
2. **Try incognito mode** to rule out caching
3. **Check browser console** (F12 → Console) for errors
4. **Verify API key** at https://aistudio.google.com/apikey

### If build fails:

1. **Check Cloud Build logs:** https://console.cloud.google.com/cloud-build/builds
2. **Verify cloudbuild.yaml** is correct
3. **Check substitution variables** are spelled correctly (`_GEMINI_API_KEY` with underscore)

---

## 📚 Additional Resources

- **Full Fix Documentation:** `API_KEY_DEPLOYMENT_FIX.md`
- **README:** `README.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Cloud Build Console:** https://console.cloud.google.com/cloud-build
- **Cloud Run Console:** https://console.cloud.google.com/run
- **API Credentials:** https://console.cloud.google.com/apis/credentials

---

**Last Updated:** October 23, 2025  
**Issue:** API key not configured in Cloud Build  
**Fix:** Set `_GEMINI_API_KEY` substitution variable  
**Estimated Time:** 3-10 minutes depending on method
