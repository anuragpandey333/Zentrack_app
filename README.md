# Zentrack - AI-Powered Expense Tracker 💰✨

A modern, feature-rich expense tracking application with AI-powered financial insights using Claude AI.

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
- 🤖 **AI Financial Assistant** - Powered by Claude AI
  - Click "✨ Analyze & Report" for personalized insights
  - 2-3 sentence financial report
  - Smart recommendation chips
  - Flags overspending and highlights top categories
  - Concrete savings tips specific to your data

### Additional Features
- 🔐 Secure authentication with JWT
- 🎨 Beautiful, modern UI with Tailwind CSS
- 📱 Responsive design for all devices
- 🗂️ 8 expense categories (Food, Transport, Shopping, Bills, Entertainment, Health, Education, Other)
- 🎯 Real-time budget tracking

## 🚀 Tech Stack

### Backend
- Node.js + Express
- Prisma ORM
- MongoDB
- Anthropic Claude AI
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
- Anthropic API key ([Get it here](https://console.anthropic.com/))

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
ANTHROPIC_API_KEY=your_anthropic_api_key
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
3. **Add Expenses** - Fill in description, amount, category, and date, then click "Add"
4. **View Stats** - See your spending summary in real-time
5. **Toggle Charts** - Switch between bar and donut charts to visualize spending
6. **Get AI Insights** - Click "✨ Analyze & Report" for personalized financial advice
7. **Manage Expenses** - Delete expenses using the trash icon

## 🤖 AI Features

The AI Financial Assistant analyzes your spending patterns and provides:
- Overspending alerts
- Top spending category highlights
- Personalized savings recommendations
- Budget optimization tips

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
│   │   │   └── aiController.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── transactions.js
│   │   │   ├── budget.js
│   │   │   └── ai.js
│   │   └── middleware/
│   └── index.js
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   └── ...
│   │   └── components/
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

**Note:** Make sure to get your Anthropic API key from [console.anthropic.com](https://console.anthropic.com/) to enable AI features.
