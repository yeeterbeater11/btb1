# Beat the Bet - Recovery App

A comprehensive gambling recovery app with timer, journal, savings tracking, and recovery tools.

## 🚀 Quick Deploy

### Option 1: Vercel (Recommended - 5 minutes)

1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click **"New Project"**
4. Click **"Import"** → **"Upload"**
5. Drag these files:
   - `index.html`
   - `beat-the-bet.jsx`
   - `manifest.json`
   - `vercel.json`
6. Click **"Deploy"**
7. Done! Your app is live! 🎉

### Option 2: Netlify (5 minutes)

1. Go to [netlify.com](https://netlify.com)
2. Sign up/login
3. Drag & drop all files into the upload box
4. Click **"Deploy"**
5. Done! 🎉

### Option 3: GitHub Pages (10 minutes)

1. Create a new GitHub repo
2. Upload all files
3. Go to Settings → Pages
4. Select branch: `main`
5. Click Save
6. Your app will be live at `https://yourusername.github.io/repo-name`

## 📁 Files Needed for Deployment

- ✅ `index.html` - Entry point
- ✅ `beat-the-bet.jsx` - Main app (8,364 lines)
- ✅ `manifest.json` - PWA config
- ✅ `vercel.json` - Vercel config

## 🔧 After Deployment - Real Backend

Your app already has Supabase configured! Once deployed:

1. Sign up will create REAL accounts in Supabase
2. Login will use REAL authentication
3. No more mock data - everything persists!

### Create Database Tables

Copy SQL from `DATABASE_SCHEMA.md` and run in Supabase SQL Editor.

## 🎯 Features

- Recovery timer, journal, savings tracking, badges
- Pattern detection, payday alerts, music discovery
- Authentication, profile setup, onboarding, tour
- Data export (JSON + TXT report)

## 📱 Works as PWA

Install on home screen like a native app!

Built with React + Tailwind + Supabase
