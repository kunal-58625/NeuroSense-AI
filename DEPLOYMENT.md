# NeuroSense AI — Production Deployment Guide

NeuroSense AI is an AI-powered personalized EEG wellness monitoring system that transforms complex EEG signals into understandable, personalized patterns.

---

## 1. Local Development Setup

### Prerequisites
- Node.js (v18.x or later)
- Python 3.9+ (optional, for backend signal processing script)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### Key Variables:
- `NEXT_PUBLIC_API_URL`: Base URL of your Next.js application (default: `http://localhost:3000`).
- `NEXT_PUBLIC_BACKEND_URL`: URL of Render backend service if using external Python microservice (default: `https://neurosense-backend.onrender.com`).

---

## 3. Deployment to Vercel (Frontend)

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "NeuroSense AI release"
   git push origin main
   ```
2. Log into [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Set Build Commands:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Configure Environment Variables:
   - Add `NEXT_PUBLIC_API_URL` set to your Vercel deployment URL (e.g. `https://neurosense-ai.vercel.app`).
6. Click **Deploy**.

---

## 4. Deployment to Render (Python Microservice - Optional)

If hosting the Python EEG processing backend separately on Render:

1. Create a `render.yaml` or Web Service on Render dashboard.
2. Select **Python 3** environment.
3. Start Command:
   ```bash
   python analyze_eeg.py
   ```
4. Set Port: Render automatically exposes `$PORT`.

---

## 5. Troubleshooting & CORS Setup

If connecting frontend on Vercel to a backend on Render:
- Ensure `NEXT_PUBLIC_BACKEND_URL` points to your Render URL (`https://your-backend.onrender.com`).
- Verify headers in Next.js API routes permit request origins from your Vercel domain.

---

## 6. Hackathon Demonstration Instructions

1. Open the deployed Vercel application URL.
2. Click **"Try Demo EEG"** on the landing hero section or Analysis page.
3. The system parses sample EEG data, evaluates signal quality, computes Welch PSD band ratios, compares against stored personal baselines, renders the Personal NeuroPrint Radar chart, and displays explainable insights!
