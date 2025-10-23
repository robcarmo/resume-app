Here's the result of running `cat -n` on /home/ubuntu/github_repos/resume-app/README.md:
<img width="1200" height="475" alt="GHBanner" src="https://i.ytimg.com/vi/xvkKr0kzWd4/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLB6QZktas_LC66zXsP2yzF0bmlUpA" />
     2	<img width="1200" height="475" alt="GHBanner" src="https://www.resumebuilder.com/wp-content/uploads/2022/12/Professional-Illustrator-Resume-Example-Banner-Image.png" />
     3	</div>
     4	
     5	# AI Resume Formatter
     6	
     7	An AI-powered resume improvement application built with React, TypeScript, and Google's Gemini API. This app helps users optimize and format their resumes with intelligent suggestions.
     8	
     9	View your app in AI Studio: https://ai.studio/apps/drive/170r_ZB3kyHo8jhtmkdwk4qcGwJU7Kvw8
    10	
    11	## 📋 Table of Contents
    12	
    13	- [Run Locally](#run-locally)
    14	- [Deployment Options](#deployment-options)
    15	  - [Option 1: Automated Deployment with Cloud Build (Recommended)](#option-1-automated-deployment-with-cloud-build-recommended)
    16	  - [Option 2: Manual Deployment with gcloud](#option-2-manual-deployment-with-gcloud)
    17	- [Testing Docker Image Locally](#testing-docker-image-locally)
    18	- [Configuration](#configuration)
    19	- [Architecture](#architecture)
    20	
    21	---
    22	
    23	## 🚀 Run Locally
    24	
    25	**Prerequisites:** Node.js 20+
    26	
    27	1. **Install dependencies:**
    28	   ```bash
    29	   npm install
    30	   ```
    31	
    32	2. **Set the Gemini API key:**
    33	   Create a `.env` file in the root directory:
    34	   ```bash
    35	   echo "VITE_GEMINI_API_KEY=your_gemini_api_key_here" > .env
    36	   ```
    37	
    38	3. **Run the development server:**
    39	   ```bash
    40	   npm run dev
    41	   ```
    42	
    43	4. **Open your browser:**
    44	   Navigate to `http://localhost:5173`
    45	
    46	---
    47	
    48	## 🌐 Deployment Options
    49	
    50	### Option 1: Automated Deployment with Cloud Build (Recommended)
    51	
    52	This method uses Cloud Build triggers to automatically build and deploy your app whenever you push to GitHub.
    53	
    54	#### Prerequisites
    55	
    56	- Google Cloud Project with billing enabled
    57	- Google Cloud Build API enabled
    58	- Gemini API key from [Google AI Studio](https://aistudio.google.com/)
    59	
    60	#### Step 1: Enable Required APIs
    61	
    62	```bash
    63	# Enable Cloud Build, Cloud Run, and Container Registry APIs
    64	gcloud services enable cloudbuild.googleapis.com
    65	gcloud services enable run.googleapis.com
    66	gcloud services enable containerregistry.googleapis.com
    67	```
    68	
    69	#### Step 2: Set Up Cloud Build Trigger
    70	
    71	1. **Go to Cloud Build Triggers in Google Cloud Console:**
    72	   ```
    73	   https://console.cloud.google.com/cloud-build/triggers
    74	   ```
    75	
    76	2. **Click "CREATE TRIGGER"**
    77	
    78	3. **Configure the trigger:**
    79	   - **Name:** `resume-app-deploy`
    80	   - **Description:** `Build and deploy resume-app to Cloud Run`
    81	   - **Event:** Push to a branch
    82	   - **Source:** Connect your GitHub repository (`robcarmo/resume-app`)
    83	   - **Branch:** `^main$` (or use a regex pattern like `^main$` to match the main branch)
    84	   - **Build Configuration:** Cloud Build configuration file (yaml or json)
    85	   - **Cloud Build configuration file location:** `cloudbuild.yaml`
    86	
    87	4. **Add Substitution Variables:**
    88	   Scroll down to the "Substitution variables" section and add:
    89	   
    90	   | Variable | Value |
    91	   |----------|-------|
    92	   | `_GEMINI_API_KEY` | Your Gemini API key from AI Studio |
    93	
    94	   ⚠️ **Important:** This is where you set your API key. The underscore prefix (`_`) makes it a user-defined substitution variable.
    95	
    96	5. **Click "CREATE"**
    97	
    98	#### Step 3: Trigger the Build
    99	
   100	Now, every time you push to the main branch, Cloud Build will automatically:
   101	1. Build the Docker image with your API key
   102	2. Tag it with the commit SHA and 'latest'
   103	3. Push it to Google Container Registry
   104	4. Deploy it to Cloud Run in the `us-east1` region
   105	5. Make it publicly accessible
   106	
   107	You can also **manually trigger** a build:
   108	```bash
   109	gcloud builds submit --config=cloudbuild.yaml \
   110	  --substitutions=_GEMINI_API_KEY="your_gemini_api_key_here"
   111	```
   112	
   113	#### Step 4: View Your Deployed App
   114	
   115	After the build completes, get your Cloud Run service URL:
   116	```bash
   117	gcloud run services describe resume-app --region=us-east1 --format='value(status.url)'
   118	```
   119	
   120	---
   121	
   122	### Option 2: Manual Deployment with gcloud
   123	
   124	If you prefer manual control or want to test locally before deploying, use this method.
   125	
   126	#### Prerequisites
   127	
   128	- Docker installed on your local machine
   129	- Google Cloud SDK (gcloud) installed and authenticated
   130	
   131	#### Step 1: Build the Docker Image Locally
   132	
   133	```bash
   134	# Set your project ID
   135	export PROJECT_ID=$(gcloud config get-value project)
   136	
   137	# Build the Docker image with your Gemini API key
   138	docker build \
   139	  --build-arg API_KEY="your_gemini_api_key_here" \
   140	  -t gcr.io/$PROJECT_ID/resume-app:latest \
   141	  .
   142	```
   143	
   144	#### Step 2: Push to Google Container Registry
   145	
   146	```bash
   147	# Configure Docker to authenticate with GCR
   148	gcloud auth configure-docker
   149	
   150	# Push the image
   151	docker push gcr.io/$PROJECT_ID/resume-app:latest
   152	```
   153	
   154	#### Step 3: Deploy to Cloud Run
   155	
   156	```bash
   157	# Deploy to Cloud Run
   158	gcloud run deploy resume-app \
   159	  --image=gcr.io/$PROJECT_ID/resume-app:latest \
   160	  --region=us-east1 \
   161	  --platform=managed \
   162	  --allow-unauthenticated \
   163	  --port=8080 \
   164	  --memory=512Mi \
   165	  --cpu=1
   166	```
   167	
   168	#### Step 4: Get Your Service URL
   169	
   170	```bash
   171	gcloud run services describe resume-app --region=us-east1 --format='value(status.url)'
   172	```
   173	
   174	---
   175	
   176	## 🐳 Testing Docker Image Locally
   177	
   178	Before deploying to Cloud Run, you can test the Docker image on your local machine.
   179	
   180	### Build the Image
   181	
   182	```bash
   183	docker build \
   184	  --build-arg API_KEY="your_gemini_api_key_here" \
   185	  -t resume-app:test \
   186	  .
   187	```
   188	
   189	### Run the Container
   190	
   191	```bash
   192	docker run -p 8080:8080 resume-app:test
   193	```
   194	
   195	### Test in Your Browser
   196	
   197	Open `http://localhost:8080` in your browser to test the application.
   198	
   199	### Stop the Container
   200	
   201	```bash
   202	# Find the container ID
   203	docker ps
   204	
   205	# Stop the container
   206	docker stop <container_id>
   207	```
   208	
   209	### Clean Up
   210	
   211	```bash
   212	# Remove the container
   213	docker rm <container_id>
   214	
   215	# Remove the image (optional)
   216	docker rmi resume-app:test
   217	```
   218	
   219	---
   220	
   221	## ⚙️ Configuration
   222	
   223	### Substitution Variables in Cloud Build
   224	
   225	The `cloudbuild.yaml` file uses the following substitution variables:
   226	
   227	| Variable | Description | Required |
   228	|----------|-------------|----------|
   229	| `_GEMINI_API_KEY` | Your Gemini API key for the AI service | Yes |
   230	| `PROJECT_ID` | Your Google Cloud Project ID (automatically set by Cloud Build) | Yes (Auto) |
   231	| `COMMIT_SHA` | Git commit SHA (automatically set by Cloud Build) | Yes (Auto) |
   232	
   233	### Environment Variables in Dockerfile
   234	
   235	The Dockerfile accepts the following build argument:
   236	
   237	| Build Arg | Environment Variable | Description |
   238	|-----------|---------------------|-------------|
   239	| `API_KEY` | `API_KEY` | Gemini API key embedded in the built application |
   240	
   241	⚠️ **Security Note:** The API key is embedded in the client-side JavaScript bundle and is visible to users. Always:
   242	- Restrict your API key by HTTP referrer in Google Cloud Console
   243	- Restrict to Generative Language API only
   244	- Set usage quotas to prevent abuse
   245	
   246	### API Key Security Best Practices
   247	
   248	1. **Go to Google Cloud Console:**
   249	   ```
   250	   https://console.cloud.google.com/apis/credentials
   251	   ```
   252	
   253	2. **Select your API key and configure restrictions:**
   254	   - **Application restrictions:** HTTP referrers
   255	     - Add your Cloud Run URL: `https://resume-app-*.run.app/*`
   256	     - Add localhost for testing: `http://localhost:*/*`
   257	   - **API restrictions:** Restrict to "Generative Language API"
   258	
   259	---
   260	
   261	## 🏗️ Architecture
   262	
   263	This application uses a **multi-stage Docker build** approach:
   264	
   265	1. **Build Stage (Node.js 20):**
   266	   - Installs npm dependencies
   267	   - Embeds the Gemini API key at build time
   268	   - Compiles the React/TypeScript application using Vite
   269	   - Produces optimized static files in the `dist` folder
   270	
   271	2. **Serve Stage (Nginx):**
   272	   - Uses a lightweight Nginx Alpine image
   273	   - Copies the built static files from the build stage
   274	   - Serves the application on port 8080
   275	   - Configured for Single Page Application (SPA) routing
   276	
   277	### Key Files
   278	
   279	- `cloudbuild.yaml` - Cloud Build configuration for automated deployment
   280	- `Dockerfile` - Multi-stage Docker build configuration
   281	- `nginx.conf` - Nginx configuration for serving the SPA
   282	- `package.json` - Node.js dependencies and build scripts
   283	- `vite.config.ts` - Vite build configuration
   284	
   285	---
   286	
   287	## 📚 Additional Resources
   288	
   289	- [Cloud Build Documentation](https://cloud.google.com/build/docs)
   290	- [Cloud Run Documentation](https://cloud.google.com/run/docs)
   291	- [Container Registry Documentation](https://cloud.google.com/container-registry/docs)
   292	- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
   293	- [Gemini API Documentation](https://ai.google.dev/docs)
   294	- [Detailed Deployment Guide](DEPLOYMENT.md)
   295	
   296	---
   297	
   298	## 🤝 Contributing
   299	
   300	Contributions are welcome! Please feel free to submit a Pull Request.
   301	
   302	## 📝 License
   303	
   304	This project is open source and available under the [MIT License](LICENSE).
   305	