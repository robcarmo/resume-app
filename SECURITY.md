# Security Policy

## 🔒 Security Best Practices

This document outlines security considerations and best practices for the AI Resume Formatter application.

---

## Table of Contents

- [Reporting Security Issues](#reporting-security-issues)
- [API Key Security](#api-key-security)
- [Environment Variables](#environment-variables)
- [What to Do If You Accidentally Commit a Secret](#what-to-do-if-you-accidentally-commit-a-secret)
- [Development Security Guidelines](#development-security-guidelines)
- [Production Deployment Security](#production-deployment-security)
- [Security Checklist](#security-checklist)

---

## 🚨 Reporting Security Issues

If you discover a security vulnerability in this project, please **DO NOT** open a public issue. Instead:

1. **Contact the maintainers privately** via:
   - GitHub Security Advisories: https://github.com/robcarmo/resume-app/security/advisories/new
   - Or email the repository owner directly

2. **Include in your report:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)

3. **Response time:**
   - We aim to acknowledge security reports within 48 hours
   - We'll work with you to understand and address the issue

---

## 🔑 API Key Security

### Understanding the Risk

⚠️ **IMPORTANT**: This application uses client-side API key authentication, which means the Gemini API key is **embedded in the JavaScript bundle** and is **visible to anyone** who inspects the application.

### Required API Key Restrictions

**You MUST restrict your API key in Google Cloud Console to prevent abuse:**

1. **Go to Google Cloud Console:**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Select your API key and configure restrictions:**

   #### Application Restrictions
   - **Type**: HTTP referrers (websites)
   - **Add referrers**:
     - Production: `https://your-app-domain.run.app/*`
     - Development: `http://localhost:*/*`
     - Development: `http://127.0.0.1:*/*`

   #### API Restrictions
   - **Restrict key**: Yes
   - **Select APIs**: Only "Generative Language API"

3. **Set Usage Quotas:**
   - Go to: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
   - Set reasonable limits to prevent abuse
   - Enable billing alerts

### API Key Best Practices

✅ **DO:**
- Restrict API keys by HTTP referrer
- Restrict to only the APIs you need
- Set usage quotas and alerts
- Rotate API keys periodically
- Use separate keys for development and production
- Monitor API usage regularly

❌ **DON'T:**
- Use unrestricted API keys
- Share API keys in public channels
- Commit API keys to version control
- Reuse the same key across multiple projects
- Ignore usage spikes or anomalies

---

## 📝 Environment Variables

### For Local Development

Create a `.env` file in the project root:

```bash
# Copy from example
cp .env.example .env

# Edit and add your API key
VITE_API_KEY=your_gemini_api_key_here
```

### For Production (Docker/Cloud Run)

Use build arguments or Cloud Build substitution variables:

```bash
# Docker build
docker build --build-arg API_KEY=your_api_key_here -t app .

# Cloud Build (set in trigger)
_GEMINI_API_KEY=your_api_key_here
```

### Environment Variable Naming

- **Local Development**: Use `VITE_API_KEY` (Vite will expose it)
- **Production Build**: Use `API_KEY` (passed as build arg)
- **Never commit**: `.env`, `.env.local`, `.env.production`
- **Always commit**: `.env.example` (with placeholders)

---

## ⚠️ What to Do If You Accidentally Commit a Secret

If you accidentally commit an API key or other secret to Git:

### Immediate Actions (Within Minutes)

1. **Revoke the exposed secret immediately:**
   ```
   Go to Google Cloud Console → API Credentials
   Find the exposed API key → Delete it
   Generate a new API key
   ```

2. **Update your local environment:**
   ```bash
   # Update .env with new key
   echo "VITE_API_KEY=new_api_key_here" > .env
   ```

3. **Alert team members** if working in a team

### Clean Git History

⚠️ **WARNING**: These commands rewrite git history. Coordinate with your team first!

#### Option 1: Remove from recent commits (if not pushed)

```bash
# Undo the commit (keeps changes)
git reset HEAD~1

# Remove the file with secrets
git rm --cached .env

# Commit again without the secret
git add .
git commit -m "Remove accidentally added secrets"
```

#### Option 2: Remove from history (if already pushed)

```bash
# Install git-filter-repo (recommended over filter-branch)
pip install git-filter-repo

# Remove file from all history
git filter-repo --path .env --invert-paths

# Force push (⚠️ coordinate with team!)
git push origin --force --all
```

#### Option 3: Use BFG Repo-Cleaner

```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files .env

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

### After Cleaning History

1. **Verify the secret is gone:**
   ```bash
   git log --all --full-history --source --pretty=format:"%H" -- .env
   ```

2. **All team members must re-clone:**
   ```bash
   cd ..
   rm -rf resume-app
   git clone https://github.com/robcarmo/resume-app.git
   ```

3. **Update documentation** about the incident (privately)

---

## 👨‍💻 Development Security Guidelines

### Pre-commit Checklist

Before every commit, verify:

- [ ] No `.env` files are staged (`git status`)
- [ ] No API keys in code (`git diff --cached | grep -i "AIza"`)
- [ ] No hardcoded secrets (`git diff --cached | grep -i "password\|secret\|token"`)
- [ ] `.gitignore` includes `.env*` patterns

### Code Review Guidelines

When reviewing pull requests:

- [ ] Check for hardcoded credentials
- [ ] Verify environment variables are used correctly
- [ ] Ensure no `.env` files are included
- [ ] Look for suspicious long strings that might be tokens
- [ ] Check for API keys in logs or error messages

### Recommended Tools

#### Pre-commit Hooks

Install `gitleaks` for secret detection:

```bash
# Install gitleaks
brew install gitleaks  # macOS
# or
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.1/gitleaks_8.18.1_linux_x64.tar.gz

# Run scan
gitleaks detect --source . --verbose
```

#### GitHub Secret Scanning

Enable in repository settings:
```
Settings → Security → Code security and analysis → Secret scanning
```

---

## 🏭 Production Deployment Security

### Cloud Build Security

1. **Use Substitution Variables:**
   - Set `_GEMINI_API_KEY` in Cloud Build trigger
   - Never hardcode in `cloudbuild.yaml`

2. **Service Account Permissions:**
   ```bash
   # Minimal permissions
   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member=serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
     --role=roles/run.admin
   ```

3. **Enable Security Features:**
   - Binary Authorization
   - Vulnerability Scanning
   - Cloud Build Logs encryption

### Cloud Run Security

1. **Set minimal IAM permissions:**
   ```bash
   gcloud run services add-iam-policy-binding resume-app \
     --region=us-east1 \
     --member="allUsers" \
     --role="roles/run.invoker"
   ```

2. **Environment security:**
   - Use Cloud Secret Manager for sensitive values
   - Enable VPC connector for private services
   - Use least-privilege service accounts

3. **Monitor and audit:**
   - Enable Cloud Logging
   - Set up uptime checks
   - Monitor API usage and costs

### Dockerfile Security

Current multi-stage build is secure:
- ✅ Uses build arguments (not hardcoded)
- ✅ Minimal base images (Alpine)
- ✅ Non-root user (nginx)
- ✅ No secrets in layers

To verify no secrets in image:

```bash
# Inspect image history
docker history --no-trunc resume-app:latest

# Use dive to analyze layers
dive resume-app:latest
```

---

## ✅ Security Checklist

### Setup (One-time)

- [ ] Create `.env` from `.env.example`
- [ ] Add real API key to `.env`
- [ ] Verify `.env` is in `.gitignore`
- [ ] Restrict API key in Google Cloud Console
- [ ] Set usage quotas and billing alerts
- [ ] Enable GitHub secret scanning (if using GitHub)

### Before Each Commit

- [ ] Run `git status` to check staged files
- [ ] Run `gitleaks detect` or similar tool
- [ ] Review `git diff --cached` for secrets
- [ ] Ensure no `.env` files are included

### Before Each Deployment

- [ ] Verify API key restrictions are in place
- [ ] Check Cloud Build substitution variables
- [ ] Review Dockerfile build arguments
- [ ] Confirm no secrets in cloudbuild.yaml
- [ ] Test with restricted API key

### Monthly Maintenance

- [ ] Review API usage and costs
- [ ] Check for unusual access patterns
- [ ] Update dependencies for security patches
- [ ] Review IAM permissions
- [ ] Rotate API keys (best practice)

### After Security Incident

- [ ] Revoke compromised credentials immediately
- [ ] Generate new credentials
- [ ] Clean git history (if needed)
- [ ] Update all deployments
- [ ] Notify affected parties
- [ ] Document incident and lessons learned
- [ ] Review and improve security practices

---

## 📚 Additional Resources

### Google Cloud Security

- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Cloud Run Security Guide](https://cloud.google.com/run/docs/securing/overview)
- [Gemini API Security](https://ai.google.dev/docs/security_best_practices)

### General Security

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Git Security](https://git-scm.com/book/en/v2/GitHub-Keeping-Your-Account-and-Data-Secure)
- [Secrets in Git](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)

##