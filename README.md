# Zentrack - AI-Powered Expense Tracker 💰✨

A modern, feature-rich expense tracking application with AI-powered financial insights using xAI Grok.

## 🌟 Features

### Core Features
- ✅ **Add Expenses** - Track expenses with description, amount, category, date
- 💵 **Custom Monthly Budget** - Set and manage your monthly spending budget
- 📊 **Live Stats Dashboard**
  - Total spent amount
  - Budget remaining (turns red when over budget)
  - Largest expense at a glance
- 📈 **Interactive Charts**
  - Toggle between Bar Chart and Donut Chart
  - Category-wise breakdown with color coding
  - Percentage bars showing spending distribution
- 📝 **Recent Expenses List** - Scrollable list with delete functionality
- 🤖 **AI Financial Assistant** - Powered by xAI Grok
  - Comprehensive financial reports with AI analysis
  - Category-wise budget tracking with alerts
  - Smart spending pattern detection
  - Personalized savings recommendations
  - Budget optimization advice
  - PDF export functionality

### Additional Features
- 🔐 Secure authentication with JWT
- 🎨 Beautiful, modern UI with Tailwind CSS
- 📱 Responsive design for all devices
- 🗂️ 8 expense categories (Food, Transport, Shopping, Bills, Entertainment, Health, Education, Other)
- 🎯 Real-time budget tracking
- 🎯 Category-wise budget limits with progress tracking
- 🔔 Smart notifications and alerts
- 📄 Professional PDF report generation

## 🚀 Tech Stack

### Backend
- Node.js + Express
- Prisma ORM
- MongoDB
- xAI Grok API
- JWT Authentication

### Frontend
- React 19
- Vite
- Tailwind CSS
- Recharts (for visualizations)
- Axios
- React Router

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account
- xAI Grok API key ([Get it here](https://x.ai))

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Update `.env` file with your credentials:
```env
DB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROK_API_KEY=your_grok_api_key
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Start the server:
```bash
npm run dev
```

Backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🎯 How to Use

1. **Sign Up/Login** - Create an account or login
2. **Set Monthly Budget** - Enter your budget in the "Monthly Budget" field and click "Set"
3. **Set Category Budgets** - Use Budget Manager to set limits per category
4. **Add Expenses** - Fill in description, amount, category, and date, then click "Add"
5. **View Stats** - See your spending summary in real-time
6. **Toggle Charts** - Switch between bar and donut charts to visualize spending
7. **View Full Report** - Click "View Full Report" for comprehensive AI analysis
8. **Download PDF** - Export your financial report as PDF
9. **Manage Expenses** - Delete expenses using the trash icon

## 🤖 AI Features

The AI Financial Assistant (powered by xAI Grok) provides:
- **Comprehensive Analysis** - Detailed financial health overview
- **Spending Patterns** - Behavior detection and insights
- **Smart Recommendations** - 5 actionable tips tailored to your data
- **Budget Alerts** - Warnings at 80% and 100% usage
- **Category Tracking** - Real-time progress on category budgets
- **Optimization Advice** - Specific budget restructuring suggestions
- **PDF Reports** - Professional downloadable reports

## 📁 Project Structure

```
Zentrack_app/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── transactionController.js
│   │   │   ├── budgetController.js
│   │   │   ├── reportController.js
│   │   │   └── aiController.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── transactions.js
│   │   │   ├── budget.js
│   │   │   ├── reports.js
│   │   │   └── ai.js
│   │   └── middleware/
│   └── index.js
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Transactions.jsx
│   │   │   ├── Login.jsx
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── BudgetManager.jsx
│   │   │   ├── ToastContainer.jsx
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.js
│   │   └── utils/
│   │       └── notifications.js
│   └── package.json
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Add new transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Budget
- `GET /api/budget` - Get user budget
- `POST /api/budget` - Set/update budget

### Reports
- `GET /api/reports/generate` - Generate comprehensive AI report
- `GET /api/reports/category-budgets` - Get category budgets
- `POST /api/reports/category-budgets` - Set category budget
- `DELETE /api/reports/category-budgets/:category` - Delete category budget

### AI Analysis
- `GET /api/ai/analyze` - Get AI financial analysis

## 🎨 Categories

- 🍔 Food
- 🚗 Transport
- 🛍️ Shopping
- 💡 Bills
- 🎬 Entertainment
- 🏥 Health
- 📚 Education
- 📦 Other

## 📚 Documentation

- **REPORTS_SYSTEM_DOCS.md** - Complete Reports System documentation
- **GROK_API_GUIDE.md** - Grok API integration guide
- **QUICK_REFERENCE.md** - Quick start reference
- **IMPLEMENTATION_SUMMARY.md** - Feature overview

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Environment variable configuration

## 📝 License

MIT License

## 👨💻 Developer

Built with ❤️ using modern web technologies

---

**Note:** Make sure to get your xAI Grok API key from [x.ai](https://x.ai) to enable AI features.

**New Features:**
- ✨ Dedicated Reports page with comprehensive AI analysis
- 🎯 Category-wise budget tracking with alerts
- 🔔 Smart notification system
- 📄 Professional PDF export
- 📊 Interactive charts with toggle functionality
