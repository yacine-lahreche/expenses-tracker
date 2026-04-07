# Expenses Tracker - Liquid Intelligence

A premium financial tracking application built with **Glassmorphism** principles and **Liquid Intelligence** design language.

## Project Structure

```
expenses-tracker/
│
├── pages/
│   ├── dashboard/        # Main overview and summary
│   ├── expenses/         # Transaction history, search, and edit module
│   ├── add-expense/      # New transaction entry (Mandatory category/amount/date)
│   ├── budget/           # Planning, status indicators, and fiscal limits
│   ├── analytics/        # AI-driven insights and data visualization
│   ├── categories/       # Category organization and management
│   ├── settings/         # App preferences and mode switching
│   ├── profile/          # User profile and tiered accounts
│   └── onboarding/       # Welcome experience and setup
│
├── styles/
│   ├── global.css        # Core layout, shell, and design tokens
│   ├── components.css    # Reusable UI elements (cards, badges, buttons)
│   ├── dashboard.css
│   ├── expenses.css      # History layout and dynamic modal styles
│   ├── add-expense.css 
│   ├── budget.css 
│   ├── analytics.css 
│   ├── categories.css
│   ├── onboarding.css
│   ├── settings.css
│   └── profile.css  
│
└── README.md
```

## Implemented Features (Current Progress)

### 🏦 Core Transaction Management
- **Add Expense**: Functional entry form with mandatory field validation (Amount, Category, Date) and optional Merchant/Notes.
- **Dynamic Categorization**: Automatic synchronization between the Category selection and the history filters.
- **Merchant Logic**: Efficient text-based merchant logging with "Unknown" default fallback.

### 📊 History & Data Operations
- **Interactive List**: Dynamic rendering of expenses stored in `localStorage`.
- **Sophisticated Sorting**: Switch between "Latest" and "Oldest" entries via CSS `order` logic.
- **Focused Search**: Instant merchant-based filtering for quick lookup.
- **Category Filters**: Filter history by specific categories with unified dropdown behavior.

### ✏️ Advanced UI/UX
- **Smooth Edit Modal**: A Glassmorphism-style modal that allows full transaction updates (populates current data, blurs the background).
- **Visual Feedback**: Dynamic text color switching (muted to bright) based on input state.
- **Glassmorphism Overlay**: backdrop-blur and refractive edge effects across all interactive modals.

## UI Design Principles (Liquid Intelligence)
- **No-Line Rule**: Boundaries defined by color shifts and inner glowing edges instead of hard borders.
- **High Refractive Index**: Consistent use of `backdrop-filter: blur(24px+)` for all floating elements.
- **Atmospheric Palette**: Deep navies combined with vibrant primary gradients (#76e9ff, #27d5f5).
- **Dual Typeface**: **Manrope** for headlines/amounts and **Inter** for detailed data/labels.
