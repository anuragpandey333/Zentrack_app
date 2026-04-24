import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const emailTemplates = {
    securityAlert: (userName, activity) => ({
        subject: '🔒 Security Alert - Zentrack',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #334155; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
                    .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
                    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 12px 12px; }
                    .button { display: inline-block; padding: 12px 24px; background: #0f172a; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
                    .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 24px;">🔒 Security Alert</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <div class="alert-box">
                            <strong>Security Activity Detected:</strong>
                            <p style="margin: 10px 0 0 0;">${activity}</p>
                        </div>
                        <p>If this was you, you can safely ignore this email. If you didn't perform this action, please secure your account immediately.</p>
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings" class="button">Review Security Settings</a>
                    </div>
                    <div class="footer">
                        <p>© 2024 Zentrack. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    monthlyReport: (userName, reportData) => ({
        subject: '📊 Your Monthly Financial Report - Zentrack',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #334155; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
                    .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
                    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 12px 12px; }
                    .stat-card { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0; border: 1px solid #e2e8f0; }
                    .stat-label { font-size: 14px; color: #64748b; margin-bottom: 5px; }
                    .stat-value { font-size: 28px; font-weight: bold; color: #0f172a; }
                    .button { display: inline-block; padding: 12px 24px; background: #0f172a; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 24px;">📊 Monthly Financial Report</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">${reportData.month}</p>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <p>Here's your financial summary for the month:</p>
                        
                        <div class="stat-card">
                            <div class="stat-label">Total Income</div>
                            <div class="stat-value" style="color: #22c55e;">+${reportData.currency}${reportData.totalIncome.toFixed(2)}</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-label">Total Expenses</div>
                            <div class="stat-value" style="color: #ef4444;">-${reportData.currency}${reportData.totalExpenses.toFixed(2)}</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-label">Net Savings</div>
                            <div class="stat-value" style="color: ${reportData.savings >= 0 ? '#22c55e' : '#ef4444'};">${reportData.currency}${reportData.savings.toFixed(2)}</div>
                        </div>
                        
                        <p><strong>Top Spending Categories:</strong></p>
                        <ul>
                            ${reportData.topCategories.map(cat => `<li>${cat.name}: ${reportData.currency}${cat.amount.toFixed(2)}</li>`).join('')}
                        </ul>
                        
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/reports" class="button">View Full Report</a>
                    </div>
                    <div class="footer">
                        <p>© 2024 Zentrack. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    budgetWarning: (userName, warningData) => ({
        subject: '⚠️ Budget Alert - Zentrack',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #334155; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
                    .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
                    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 12px 12px; }
                    .warning-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .button { display: inline-block; padding: 12px 24px; background: #0f172a; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 24px;">⚠️ Budget Alert</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <div class="warning-box">
                            <strong>${warningData.percentage >= 100 ? '🚨 Budget Exceeded!' : '⚠️ Budget Warning!'}</strong>
                            <p style="margin: 10px 0 0 0;">You've used <strong>${warningData.percentage.toFixed(0)}%</strong> of your ${warningData.category || 'monthly'} budget.</p>
                        </div>
                        
                        <p style="font-size: 14px; color: #64748b;">
                            ${warningData.currency}${warningData.spent.toFixed(2)} of ${warningData.currency}${warningData.budget.toFixed(2)}
                        </p>
                        
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/transactions" class="button">Review Transactions</a>
                    </div>
                    <div class="footer">
                        <p>© 2024 Zentrack. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    newFeature: (userName, featureData) => ({
        subject: '🎉 New Feature Available - Zentrack',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #334155; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
                    .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
                    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 12px 12px; }
                    .feature-box { background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; margin: 20px 0; border-radius: 8px; }
                    .button { display: inline-block; padding: 12px 24px; background: #0f172a; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 24px;">🎉 New Feature Available!</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <p>We're excited to announce a new feature in Zentrack!</p>
                        
                        <div class="feature-box">
                            <h2 style="margin: 0 0 10px 0; color: #0f172a;">${featureData.title}</h2>
                            <p style="margin: 0;">${featureData.description}</p>
                        </div>
                        
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}${featureData.link || ''}" class="button">Try It Now</a>
                    </div>
                    <div class="footer">
                        <p>© 2024 Zentrack. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    })
};

export const sendEmail = async (to, template, data) => {
    try {
        const emailContent = emailTemplates[template](data.userName, data);
        
        const mailOptions = {
            from: `"Zentrack" <${process.env.EMAIL_USER}>`,
            to,
            subject: emailContent.subject,
            html: emailContent.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

export const sendSecurityAlert = async (user, activity) => {
    if (!user.notifySecurityAlerts) return;
    return await sendEmail(user.email, 'securityAlert', {
        userName: user.name,
        activity
    });
};

export const sendMonthlyReport = async (user, reportData) => {
    if (!user.notifyMonthlyReports) return;
    return await sendEmail(user.email, 'monthlyReport', {
        userName: user.name,
        ...reportData
    });
};

export const sendBudgetWarning = async (user, warningData) => {
    if (!user.notifyBudgetWarnings) return;
    return await sendEmail(user.email, 'budgetWarning', {
        userName: user.name,
        ...warningData
    });
};

export const sendNewFeatureNotification = async (user, featureData) => {
    if (!user.notifyNewFeatures) return;
    return await sendEmail(user.email, 'newFeature', {
        userName: user.name,
        ...featureData
    });
};
