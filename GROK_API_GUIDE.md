# 🤖 Grok API Integration Guide

## Overview

The Zentrack Reports System now uses **xAI's Grok API** for AI-powered financial analysis instead of Anthropic Claude.

---

## 🔑 Getting Your Grok API Key

### Step 1: Sign Up for xAI
1. Visit [https://x.ai](https://x.ai)
2. Sign up for an account
3. Navigate to the API section
4. Generate your API key

### Step 2: Add to Environment Variables

**Backend `.env` file:**
```env
# Database
DB_URL=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret

# AI Integration - Grok API
GROK_API_KEY=your_grok_api_key_here

# Server
PORT=8000
```

---

## 🚀 Grok API Implementation

### API Endpoint
```
POST https://api.x.ai/v1/chat/completions
```

### Model
```
grok-beta
```

### Request Format
```javascript
{
  "messages": [
    {
      "role": "system",
      "content": "You are a professional financial advisor..."
    },
    {
      "role": "user",
      "content": "Financial data and analysis request..."
    }
  ],
  "model": "grok-beta",
  "stream": false,
  "temperature": 0.7
}
```

### Response Format
```javascript
{
  "choices": [
    {
      "message": {
        "content": "{\"summary\": \"...\", \"suggestions\": [...]}"
      }
    }
  ]
}
```

---

## 📊 How It Works

### 1. Report Generation (`reportController.js`)

**Input:**
- Total expenses
- Monthly budget
- Transaction count
- Category breakdown
- Top spending categories

**Grok Analysis:**
```javascript
const aiAnalysis = await callGrokAPI(prompt);
```

**Output:**
```json
{
  "summary": "2-3 sentence financial overview",
  "whyExpensesHigh": "Detailed explanation",
  "spendingPatterns": ["pattern1", "pattern2", "pattern3"],
  "suggestions": ["tip1", "tip2", "tip3", "tip4", "tip5"],
  "warnings": ["warning1", "warning2"],
  "budgetAdvice": "Optimization advice"
}
```

### 2. Quick Analysis (`aiController.js`)

**Input:**
- Budget vs Spent
- Transaction count
- Top 3 categories

**Grok Analysis:**
```javascript
const response = await callGrokAPI(prompt);
```

**Output:**
```json
{
  "report": "2-3 sentence analysis",
  "recommendations": ["tip1", "tip2", "tip3", "tip4", "tip5"]
}
```

---

## 🛡️ Fallback System

If Grok API fails (network issues, API key invalid, etc.), the system automatically uses **rule-based analysis**:

```javascript
try {
    aiAnalysis = await callGrokAPI(prompt);
} catch (error) {
    console.error('Grok AI Error:', error);
    // Fallback to intelligent rule-based analysis
    aiAnalysis = generateFallbackAnalysis(...);
}
```

### Fallback Features:
- Budget utilization calculation
- Category analysis
- Pattern detection
- Automatic recommendations
- Warning generation

---

## 🔧 Configuration

### Temperature Setting
```javascript
temperature: 0.7  // Balance between creativity and consistency
```

**Options:**
- `0.0-0.3` - More deterministic, consistent
- `0.4-0.7` - Balanced (recommended)
- `0.8-1.0` - More creative, varied

### Stream Setting
```javascript
stream: false  // Get complete response at once
```

---

## 📝 Prompt Engineering

### System Prompt
```
You are a professional financial advisor. 
Provide detailed, actionable financial advice in JSON format.
```

### User Prompt Structure
1. **Context** - "You are analyzing monthly expenses..."
2. **Data** - Structured financial data
3. **Request** - Specific analysis requirements
4. **Format** - JSON structure specification
5. **Guidelines** - "Be specific, actionable, encouraging..."

---

## 🎯 Response Parsing

The system handles multiple response formats:

### 1. Plain JSON
```json
{"summary": "...", "suggestions": [...]}
```

### 2. Markdown Code Block
```markdown
```json
{"summary": "...", "suggestions": [...]}
```
```

### Parsing Logic
```javascript
const content = response.data.choices[0].message.content;
const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                  content.match(/\{[\s\S]*\}/);
return JSON.parse(jsonMatch[1] || jsonMatch[0]);
```

---

## 🚦 Error Handling

### API Errors
```javascript
try {
    const response = await axios.post(GROK_API_URL, ...);
} catch (error) {
    console.error('Grok API Error:', error.response?.data || error.message);
    throw error;
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid API key | Check GROK_API_KEY in .env |
| 429 Rate Limit | Too many requests | Implement rate limiting |
| 500 Server Error | Grok API issue | Use fallback analysis |
| Network Error | Connection issue | Check internet/firewall |

---

## 📊 Sample Grok Responses

### Example 1: Over Budget
```json
{
  "summary": "You've exceeded your monthly budget by ₹2,500 (112.5% utilized). Your Food expenses at ₹6,000 are significantly high, accounting for 40% of total spending. Immediate corrective action is needed.",
  "whyExpensesHigh": "The primary driver of high expenses is Food spending at ₹6,000, which is 40% of your total budget. With 45 transactions averaging ₹333 each, you're making frequent purchases. This pattern suggests dining out or premium grocery shopping without meal planning.",
  "spendingPatterns": [
    "Excessive Food category spending (40% of budget)",
    "High transaction frequency (45 transactions) indicates impulse spending",
    "Lack of budget discipline across multiple categories"
  ],
  "suggestions": [
    "Reduce Food expenses by 30% through meal planning and home cooking",
    "Limit dining out to once per week maximum",
    "Create a weekly grocery budget of ₹1,200 and stick to it",
    "Use cash envelopes for discretionary categories to enforce limits",
    "Cancel unused subscriptions and review all recurring charges"
  ],
  "warnings": [
    "Budget exceeded by ₹2,500 - immediate action required",
    "Food spending is 40% of budget (recommended: 20-25%)"
  ],
  "budgetAdvice": "Restructure your budget with strict category limits: Food ₹4,000, Transport ₹3,000, Bills ₹5,000, and keep ₹3,000 as emergency buffer. Track daily expenses and review weekly to stay on target."
}
```

### Example 2: Within Budget
```json
{
  "summary": "Excellent financial management! You're at 65% budget utilization with ₹7,000 remaining. Your spending is well-distributed across categories with Transport being the highest at ₹4,500 (30%).",
  "whyExpensesHigh": "While your overall spending is controlled, Transport at ₹4,500 represents 30% of expenses. This is reasonable if commuting is necessary, but there's room for optimization through carpooling or public transit.",
  "spendingPatterns": [
    "Balanced spending across multiple categories",
    "Moderate transaction frequency (32 transactions)",
    "Good budget discipline with 35% remaining"
  ],
  "suggestions": [
    "Allocate ₹3,000 of surplus to emergency savings fund",
    "Explore carpooling options to reduce Transport costs by 20%",
    "Set aside ₹2,000 as buffer for unexpected expenses",
    "Consider investing ₹2,000 in a recurring deposit",
    "Maintain current spending discipline for next month"
  ],
  "warnings": [],
  "budgetAdvice": "You're doing great! Continue your current approach while building an emergency fund. Aim to save 15-20% of your budget monthly. Consider setting up automatic transfers to savings on payday."
}
```

---

## 🔄 Migration from Anthropic

### Changes Made

**Before (Anthropic):**
```javascript
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }]
});
const response = JSON.parse(message.content[0].text);
```

**After (Grok):**
```javascript
import axios from 'axios';
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

const response = await axios.post(GROK_API_URL, {
    messages: [
        { role: 'system', content: 'System prompt...' },
        { role: 'user', content: prompt }
    ],
    model: 'grok-beta',
    temperature: 0.7
}, {
    headers: { 'Authorization': `Bearer ${GROK_API_KEY}` }
});
```

### Environment Variables

**Update your `.env`:**
```diff
- ANTHROPIC_API_KEY=your_anthropic_key
+ GROK_API_KEY=your_grok_api_key
```

---

## 🧪 Testing

### Test Grok Integration

```bash
# In backend directory
cd backend

# Test with curl
curl -X POST https://api.x.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_GROK_API_KEY" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Say hello"}
    ],
    "model": "grok-beta",
    "stream": false
  }'
```

### Test Report Generation

1. Start backend: `npm run dev`
2. Login to app
3. Add some expenses
4. Navigate to `/reports`
5. Check console for Grok API calls
6. Verify AI analysis appears

---

## 📈 Performance

### Response Times
- Grok API call: 2-4 seconds
- Fallback analysis: < 100ms
- Total report generation: 2-5 seconds

### Rate Limits
Check xAI documentation for current rate limits:
- Requests per minute
- Tokens per request
- Daily quota

---

## 💡 Best Practices

1. **Always use fallback** - Never let AI failure break the app
2. **Cache responses** - Consider caching for same-day requests
3. **Monitor usage** - Track API calls and costs
4. **Validate responses** - Always parse and validate JSON
5. **Handle errors gracefully** - Show user-friendly messages

---

## 🔐 Security

### API Key Protection
- ✅ Store in `.env` file
- ✅ Never commit to git
- ✅ Use environment variables
- ✅ Rotate keys periodically

### Request Validation
- ✅ Sanitize user input
- ✅ Limit request size
- ✅ Implement rate limiting
- ✅ Log API errors

---

## 📚 Resources

- **xAI Documentation**: [https://docs.x.ai](https://docs.x.ai)
- **Grok API Reference**: [https://docs.x.ai/api](https://docs.x.ai/api)
- **API Status**: [https://status.x.ai](https://status.x.ai)

---

## ✅ Checklist

- [ ] Get Grok API key from x.ai
- [ ] Add `GROK_API_KEY` to backend `.env`
- [ ] Remove `ANTHROPIC_API_KEY` from `.env`
- [ ] Test API connection
- [ ] Generate test report
- [ ] Verify fallback works
- [ ] Monitor API usage

---

## 🎉 You're All Set!

Your Zentrack app now uses **Grok AI** for intelligent financial analysis!

**Next Steps:**
1. Get your API key
2. Update `.env`
3. Restart backend
4. Test reports page

---

**Powered by xAI Grok** 🚀
