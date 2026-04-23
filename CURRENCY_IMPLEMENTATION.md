# Currency Conversion Feature Implementation

## Overview
Implemented dynamic currency conversion across the entire application. Users can now select their preferred currency (USD, INR, EUR, GBP) in Settings, and all expenses and prices will be displayed in the chosen currency.

## Changes Made

### 1. Backend Changes

#### Database Schema (`/backend/prisma/schema.prisma`)
- Added `currency` field to User model with default value "USD"

#### User Controller (`/backend/src/controllers/userController.js`)
- Added `currency` field to getUserProfile response
- Added `currency` field to updateUserProfile request handling

### 2. Frontend Changes

#### Currency Utility (`/frontend/src/utils/currency.js`) - NEW FILE
- Created conversion rates for USD, INR, EUR, GBP (base: USD)
- `convertCurrency(amount, fromCurrency, toCurrency)` - Converts amounts between currencies
- `formatCurrency(amount, currency)` - Formats amount with proper symbol and locale
- `getCurrencySymbol(currency)` - Returns currency symbol

#### Settings Page (`/frontend/src/pages/Settings.jsx`)
- Removed language preference section
- Updated currency dropdown to save selection to user profile
- Currency options: USD ($), INR (₹), EUR (€), GBP (£)
- Added helper text: "All amounts will be displayed in your selected currency"

#### Dashboard (`/frontend/src/pages/Dashboard.jsx`)
- Imported currency utilities
- Added `userCurrency` from user context
- Converted all amounts (totalSpent, remaining, budget) from INR to user's currency
- Updated all display values to use `formatCurrency()`
- Updated category data to show converted amounts

#### Transactions Page (`/frontend/src/pages/Transactions.jsx`)
- Imported currency utilities
- Added `userCurrency` from user context
- Converted transaction amounts in table display
- Updated currency symbol in "Add Transaction" modal input field

#### Budgets Page (`/frontend/src/pages/Budgets.jsx`)
- Imported currency utilities
- Added `userCurrency` from user context
- Converted all budget limits and spent amounts
- Updated chart data with converted values
- Updated tips section to show amounts in user's currency
- Updated "Create Budget" modal to show user's currency symbol

#### Reports Page (`/frontend/src/pages/Reports.jsx`)
- Imported currency utilities
- Added `userCurrency` from user context
- Converted all metrics (avg daily spend, total spent, budget)
- Updated chart Y-axis formatter to show user's currency
- Updated top categories amounts
- Updated spending intensity tooltips
- Updated PDF export to use user's currency

## Currency Conversion Logic

All amounts are stored in the database in INR (Indian Rupees). When displaying:
1. Fetch user's preferred currency from user profile
2. Convert amount from INR to user's currency using conversion rates
3. Format with appropriate currency symbol and locale

### Conversion Rates (Base: USD)
- USD: 1
- INR: 83.12
- EUR: 0.92
- GBP: 0.79

## User Experience

1. User goes to Settings > Profile > Preferences
2. Selects preferred currency from dropdown
3. Clicks "Save Changes"
4. All pages (Dashboard, Transactions, Budgets, Reports) immediately reflect the new currency
5. All amounts are converted and displayed with the correct symbol

## Next Steps

To activate the changes:
1. Run `cd backend && npx prisma generate` to update Prisma client with new schema
2. Restart backend server: `cd backend && npm run dev`
3. Frontend will automatically pick up changes (if dev server is running)

## Notes

- Currency preference is stored per user in the database
- Conversion happens on the frontend for real-time updates
- All stored amounts remain in INR in the database
- Currency symbol is displayed before the amount
- Amounts are formatted with proper thousand separators
