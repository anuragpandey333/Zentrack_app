# Email Notification System Documentation

## Overview
Zentrack now includes a comprehensive email notification system that keeps users informed based on their preferences. Users can enable/disable specific notification types from the Settings page.

## Features

### 1. Security Alerts 🔒
**Trigger**: Sent on every successful login
**Content**:
- Login timestamp
- Security activity details
- Link to review security settings

**When Sent**: Real-time on user login

### 2. Monthly Reports 📊
**Trigger**: Automatically sent on the 1st of every month at 9:00 AM
**Content**:
- Total income for the previous month
- Total expenses for the previous month
- Net savings/deficit
- Top 5 spending categories
- Personalized financial insight
- Link to view full report

**When Sent**: Scheduled (1st of every month at 9:00 AM)

### 3. Budget Warnings ⚠️
**Trigger**: Sent when spending reaches 80% or 100% of budget
**Content**:
- Current budget usage percentage
- Amount spent vs budget limit
- Visual progress indicator
- Category information (if applicable)
- Link to review transactions

**When Sent**: Real-time when adding expense transactions

### 4. New Feature Updates 🎉
**Trigger**: Manually sent by admins when new features are released
**Content**:
- Feature title and description
- Benefits and capabilities
- Link to try the new feature

**When Sent**: Manual trigger by administrators

## Technical Implementation

### Backend Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── emailService.js      # Email templates and sending logic
│   │   └── cronJobs.js          # Scheduled tasks (monthly reports)
│   ├── controllers/
│   │   ├── notificationController.js  # Notification preferences management
│   │   ├── transactionController.js   # Budget warning triggers
│   │   └── authController.js          # Security alert triggers
│   └── routes/
│       └── notifications.js     # Notification API routes
```

### Database Schema

```prisma
model User {
  notifySecurityAlerts    Boolean  @default(true)
  notifyMonthlyReports    Boolean  @default(true)
  notifyBudgetWarnings    Boolean  @default(false)
  notifyNewFeatures       Boolean  @default(true)
}
```

### API Endpoints

#### Get Notification Preferences
```
GET /api/notifications/preferences
Authorization: Bearer <token>

Response:
{
  "notifySecurityAlerts": true,
  "notifyMonthlyReports": true,
  "notifyBudgetWarnings": false,
  "notifyNewFeatures": true
}
```

#### Update Notification Preferences
```
PUT /api/notifications/preferences
Authorization: Bearer <token>

Body:
{
  "notifySecurityAlerts": true,
  "notifyMonthlyReports": true,
  "notifyBudgetWarnings": true,
  "notifyNewFeatures": false
}

Response:
{
  "message": "Notification preferences updated",
  "user": { ... }
}
```

## Email Service Configuration

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password

3. **Update .env file**:
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
FRONTEND_URL=http://localhost:5173
```

### Alternative Email Services

The system uses Nodemailer and can be configured for other services:

**Outlook/Hotmail**:
```javascript
service: 'hotmail'
```

**Yahoo**:
```javascript
service: 'yahoo'
```

**Custom SMTP**:
```javascript
host: 'smtp.example.com',
port: 587,
secure: false,
auth: {
  user: 'your_email',
  pass: 'your_password'
}
```

## Email Templates

All email templates follow a consistent design:
- **Header**: Gradient background with slate theme
- **Content**: Clean, readable layout with proper spacing
- **Footer**: Branding and unsubscribe information
- **Responsive**: Works on all email clients and devices

### Template Customization

Edit templates in `backend/src/services/emailService.js`:

```javascript
const emailTemplates = {
  securityAlert: (userName, activity) => ({
    subject: '🔒 Security Alert - Zentrack',
    html: `...`
  }),
  // ... other templates
};
```

## Scheduled Tasks

### Monthly Reports Cron Job

**Schedule**: `0 9 1 * *` (9:00 AM on the 1st of every month)

**Process**:
1. Fetch all users with `notifyMonthlyReports: true`
2. Calculate previous month's financial data
3. Generate personalized report for each user
4. Send email with report data

**Location**: `backend/src/services/cronJobs.js`

### Testing Cron Jobs Locally

To test monthly reports without waiting:

```javascript
// Temporarily change schedule to run every minute
cron.schedule('* * * * *', async () => {
  // ... report logic
});
```

## Frontend Integration

### Settings Page

Users can manage notification preferences in Settings > Profile > Email Notifications:

```jsx
<input 
  type="checkbox" 
  checked={notifications.notifySecurityAlerts}
  onChange={(e) => setNotifications({
    ...notifications, 
    notifySecurityAlerts: e.target.checked
  })}
/>
```

### State Management

```javascript
const [notifications, setNotifications] = useState({
  notifySecurityAlerts: true,
  notifyMonthlyReports: true,
  notifyBudgetWarnings: false,
  notifyNewFeatures: true
});
```

## Notification Triggers

### 1. Security Alerts
**File**: `backend/src/controllers/authController.js`
```javascript
await sendSecurityAlert(user, `New login detected on ${loginTime}`);
```

### 2. Budget Warnings
**File**: `backend/src/controllers/transactionController.js`
```javascript
if (type === 'debit') {
  await checkBudgetAndNotify(req.user.id);
}
```

### 3. Monthly Reports
**File**: `backend/src/services/cronJobs.js`
```javascript
cron.schedule('0 9 1 * *', async () => {
  // Send reports to all eligible users
});
```

### 4. New Features (Manual)
**Usage**:
```javascript
import { sendNewFeatureNotification } from './services/emailService.js';

// Send to all users who opted in
const users = await prisma.user.findMany({
  where: { notifyNewFeatures: true }
});

for (const user of users) {
  await sendNewFeatureNotification(user, {
    title: 'Bank Transfer Feature',
    description: 'Track money movement between accounts',
    link: '/transactions'
  });
}
```

## Testing

### Test Email Sending

Create a test endpoint (development only):

```javascript
// backend/src/routes/notifications.js
router.post('/test-email', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  await sendSecurityAlert(user, 'This is a test alert');
  res.json({ message: 'Test email sent' });
});
```

### Verify Email Delivery

1. Check server console for "Email sent: <messageId>"
2. Check recipient's inbox (and spam folder)
3. Verify email formatting and links

## Troubleshooting

### Emails Not Sending

1. **Check credentials**: Verify EMAIL_USER and EMAIL_PASSWORD in .env
2. **App Password**: Ensure using App Password, not regular password
3. **2FA**: Gmail requires 2-Factor Authentication for App Passwords
4. **Firewall**: Check if port 587 (SMTP) is blocked
5. **Logs**: Check server console for error messages

### Emails Going to Spam

1. **SPF/DKIM**: Configure email authentication records
2. **Content**: Avoid spam trigger words
3. **Frequency**: Don't send too many emails too quickly
4. **Unsubscribe**: Include unsubscribe option

### Cron Jobs Not Running

1. **Server Running**: Ensure server is continuously running
2. **Timezone**: Cron uses server timezone
3. **Syntax**: Verify cron expression syntax
4. **Logs**: Check console for cron initialization message

## Security Best Practices

1. **Never commit** EMAIL_PASSWORD to version control
2. **Use App Passwords** instead of account passwords
3. **Rotate credentials** periodically
4. **Limit permissions** on email account
5. **Monitor usage** for suspicious activity
6. **Rate limiting** to prevent abuse

## Performance Considerations

1. **Async Operations**: All email sending is asynchronous
2. **Error Handling**: Failed emails don't block user actions
3. **Batch Processing**: Monthly reports sent in batches
4. **Queue System**: Consider adding email queue for high volume

## Future Enhancements

- [ ] Email templates editor in admin panel
- [ ] Email delivery tracking and analytics
- [ ] Digest mode (combine multiple notifications)
- [ ] SMS notifications option
- [ ] Push notifications for mobile app
- [ ] A/B testing for email content
- [ ] Unsubscribe management page
- [ ] Email preview before sending

## Support

For issues or questions:
- Check server logs for error messages
- Verify .env configuration
- Test with a simple email first
- Review Nodemailer documentation: https://nodemailer.com

---

**Last Updated**: January 2024
**Version**: 1.0.0
