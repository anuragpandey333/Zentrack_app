# Email Notification Setup Guide

## Quick Start (5 minutes)

### Step 1: Gmail App Password Setup

1. Go to your Google Account: https://myaccount.google.com
2. Click on **Security** in the left sidebar
3. Enable **2-Step Verification** (if not already enabled)
4. Go to **App passwords**: https://myaccount.google.com/apppasswords
5. Select **Mail** and your device
6. Click **Generate**
7. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Configure Backend

1. Open `backend/.env` file
2. Add these lines:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
FRONTEND_URL=http://localhost:5173
```

Replace:
- `your_email@gmail.com` with your Gmail address
- `abcdefghijklmnop` with your 16-character App Password (no spaces)

### Step 3: Restart Backend Server

```bash
cd backend
npm run dev
```

You should see: "Monthly report scheduler initialized"

### Step 4: Test the System

1. **Login** to your account → You'll receive a security alert email
2. **Add an expense** that exceeds 80% of budget → You'll receive a budget warning
3. **Wait for 1st of month** → You'll receive a monthly report

### Step 5: Manage Preferences

1. Go to **Settings** page
2. Scroll to **Email Notifications** section
3. Toggle notifications on/off as desired
4. Click **Save Changes**

## Verification Checklist

- [ ] App Password generated from Google
- [ ] EMAIL_USER and EMAIL_PASSWORD added to .env
- [ ] Backend server restarted
- [ ] "Monthly report scheduler initialized" appears in console
- [ ] Test login sends security alert email
- [ ] Email appears in inbox (check spam folder if not)

## Troubleshooting

### "Invalid login" error
- Use App Password, not your regular Gmail password
- Ensure 2-Factor Authentication is enabled
- Remove any spaces from the App Password

### Emails not received
- Check spam/junk folder
- Verify EMAIL_USER matches the Gmail account
- Check server console for error messages
- Try sending a test email from Gmail to verify account works

### Cron job not running
- Ensure server is running continuously
- Check server timezone matches your expectation
- Look for "Monthly report scheduler initialized" in console

## Email Types & Triggers

| Type | Trigger | Frequency |
|------|---------|-----------|
| Security Alert | User login | Real-time |
| Budget Warning | Expense added (80%+ budget) | Real-time |
| Monthly Report | 1st of month, 9:00 AM | Monthly |
| New Features | Manual admin trigger | As needed |

## Testing Without Waiting

### Test Security Alert
Just login to your account

### Test Budget Warning
1. Set a low budget (e.g., $100)
2. Add an expense of $85
3. Check your email

### Test Monthly Report (Development)
Edit `backend/src/services/cronJobs.js`:

```javascript
// Change from: '0 9 1 * *'
// To run every minute:
cron.schedule('* * * * *', async () => {
  // ... existing code
});
```

Restart server and wait 1 minute.

## Production Deployment

### Environment Variables

Ensure these are set in production:

```env
EMAIL_USER=your_production_email@gmail.com
EMAIL_PASSWORD=your_production_app_password
FRONTEND_URL=https://your-domain.com
```

### Email Service Alternatives

For production, consider:
- **SendGrid** (99% deliverability)
- **AWS SES** (cost-effective)
- **Mailgun** (developer-friendly)
- **Postmark** (transactional emails)

### Rate Limiting

Add rate limiting to prevent abuse:

```javascript
// In backend/index.js
import rateLimit from 'express-rate-limit';

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 10 requests per windowMs
});

app.use('/api/notifications', emailLimiter, notificationRoutes);
```

## Support

Need help? Check:
1. Server console logs
2. EMAIL_NOTIFICATION_SYSTEM.md (full documentation)
3. Nodemailer docs: https://nodemailer.com

---

**Setup Time**: ~5 minutes
**Difficulty**: Easy
**Requirements**: Gmail account with 2FA enabled
