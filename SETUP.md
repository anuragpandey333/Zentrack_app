## Quick Setup Guide for Zentrack

### Step 1: Get Anthropic API Key
1. Visit https://console.anthropic.com/
2. Sign up or login
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key

### Step 2: Update Backend .env
Open `backend/.env` and replace `your_anthropic_api_key_here` with your actual API key:
```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

### Step 3: Start Backend
```bash
cd backend
npm run dev
```

### Step 4: Start Frontend (in new terminal)
```bash
cd frontend
npm run dev
```

### Step 5: Access the App
Open http://localhost:5173 in your browser

### Features to Test:
1. ✅ Register/Login
2. ✅ Set monthly budget (e.g., 50000)
3. ✅ Add expenses across different categories
4. ✅ Watch stats update in real-time
5. ✅ Toggle between bar and donut charts
6. ✅ Click "✨ Analyze & Report" for AI insights
7. ✅ Delete expenses with trash icon
8. ✅ See budget turn red when overspending

Enjoy your AI-powered expense tracker! 🚀
