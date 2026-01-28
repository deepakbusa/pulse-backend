# Render CLI is not needed for deployment!
# You can deploy directly from GitHub

## Option 1: Deploy via GitHub (Recommended - Easiest)

### Step 1: Initialize Git in backend folder
cd backend
git init
git add .
git commit -m "Initial backend setup"

### Step 2: Create GitHub repo and push
# Go to github.com and create a new repository
# Then run these commands (replace with your repo URL):
git remote add origin https://github.com/yourusername/crackmate-backend.git
git branch -M main
git push -u origin main

### Step 3: Deploy on Render
1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: crackmate-backend
   - Build Command: npm install
   - Start Command: npm start
   - Add all environment variables

## Option 2: Deploy using Render CLI (Advanced)

### Install Render CLI
npm install -g @render-deploy/cli

### Login to Render
render login

### Deploy
render deploy

---

## Quick Start (GitHub Method)

Run these commands in terminal:
```bash
cd "c:\Users\DEEPAK BUSA\Downloads\crackmate-app\backend"
git init
git add .
git commit -m "Initial backend commit"
```

Then:
1. Create repo on GitHub
2. Push code
3. Connect to Render
4. Add environment variables
5. Deploy!
