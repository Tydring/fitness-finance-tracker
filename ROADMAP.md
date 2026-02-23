# Fitness & Finance Tracker - Task List

## Phase 1: Core Logging + One-Way Push to Notion
- [x] **1.1 Project Setup & Auth**
    - [x] Create React + Vite project with PWA support
    - [x] Initialize Firebase (Auth, Firestore, Hosting, Functions)
    - [x] Implement App Shell (Layout, Bottom Nav)
    - [x] Implement Google Auth & persistent session
    - [x] Configure Firestore offline persistence
- [x] **1.2 Workout Logging**
    - [x] Create Workout Data Model (Firestore)
    - [x] Build Workout Entry Form (Date, Exercise, Sets/Reps/Weight/etc.)
    - [x] Implement "Repeat last workout" feature
    - [x] Create Workout List View
- [x] **1.3 Expense Logging**
    - [x] Create Transaction Data Model (Firestore)
    - [x] Build Transaction Entry Form (Amount, Currency, Category, etc.)
    - [x] Implement Currency logic (USD/VES/EUR + Exchange Rate Snapshot)
    - [x] Create Transaction List View
- [x] **1.4 One-Way Sync (App -> Notion)**
    - [x] Configure Notion Integration & Secrets
    - [x] Implement Cloud Function `onWorkoutWrite`
    - [x] Implement Cloud Function `onTransactionWrite`
    - [x] Setup Cloud Tasks for rate limiting
- [x] **1.5 Exchange Rate Fetcher**
    - [x] Implement BCV Scraper (Cloud Function)
    - [x] Implement Binance P2P Fetcher (Cloud Function)
    - [x] Setup Cloud Scheduler for daily fetch

## Phase 2: Two-Way Sync
- [x] **2.1 Notion -> App Polling**
    - [x] Implement `pollNotionWorkouts` Cloud Function
    - [x] Implement `pollNotionTransactions` Cloud Function
    - [x] Setup Cloud Scheduler (15 min interval)
- [x] **2.2 Conflict Resolution**
    - [x] Implement "Last-write-wins" logic
    - [x] Implement Conflict Logging
- [x] **2.3 Sync UI**
    - [x] Add Sync Status Indicators (badges, header)
    - [x] Implement Manual Sync button

## Phase 3: Dashboards & Analytics
- [x] **3.1 Fitness Dashboard**
    - [x] Implement Workout Frequency Chart
    - [x] Implement Volume Progression Chart
    - [x] Implement RPE Trends & Category Distribution
- [x] **3.2 Finance Dashboard**
    - [x] Implement Monthly Spending Chart
    - [x] Implement Income vs Expenses Chart
    - [x] Implement Currency Split & Trends
- [x] **3.3 Combined Overview**
    - [x] Build Home Dashboard (Summary stats, streak, exchange rates)

## Phase 4: AI Insights
- [x] **4.1 Data Aggregation**
    - [x] Implement `aggregateWeeklyData` Cloud Function
- [x] **4.2 Insight Generation**
    - [x] Implement `generateWeeklyInsights` using Claude API
    - [x] Setup Weekly Scheduler
- [x] **4.3 Insights UI**
    - [x] Build Insights Tab & Display (Refine existing `InsightsPage`)

## Phase 5: Core Data & Fixes (Transaction Sources)
- [x] **5.1 Core Logic & Config**
    - [x] Update `categories.js` (Separated Income, New Accounts)
    - [x] Update `mappers.js` for Notion Sync
- [x] **5.2 UI Updates**
    - [x] Update `TransactionForm` (Account Selection)
    - [x] **BUG FIX**: Rename Tab to "Income/Expenses"
    - [x] **BUG FIX**: Exclude Income from "Monthly Spent" calculation
- [x] **5.3 Dashboard Integration**
    - [x] Create "Account Balances" Card/Section
    - [x] Verify Dashboard Filters

## Phase 5.5: Currency Logic & Display
- [x] **5.5.1 Frontend Logic**
    - [x] Auto-detect Currency based on Account (Bolivares -> VES, Others -> USD)
    - [x] Update `TransactionForm` to save `currency` field ('USD' or 'VES')
- [x] **5.5.2 UI Updates**
    - [x] Update `TransactionList` to show correct symbol ($ or Bs.)
    - [x] Update `OverviewDashboard` to handle multi-currency totals (or separate them)
    - [ ] **BUG FIX**: Split Income by Currency in Insights Page
    - [x] **BUG FIX**: "Recent Expenses" showing Income & wrong Currency Symbol
    - [x] **HOTFIX**: Fix PWA Manifest (Add to Home Screen support)
    - [x] **HOTFIX**: Resolve Cross-Device Sync (Auth Race Condition)

## Phase 6: Visual Overhaul & Branding (COMPLETED)
- [x] **6.1 Design System Setup**
    - [x] Finalize App Name & Logo
    - [x] Define Colors (Deep Slate, Indigo, Pink)
    - [x] Configure Typography (Inter)
- [x] **6.2 Component Library**
    - [x] Create `.glass-card` and button utilities
    - [x] Redesign Input fields (Hick's Law / Minimalist)
    - [x] Redesign Cards (Dashboard summaries)
- [x] **6.3 Layout & Navigation**
    - [x] Implement Floating Bottom Nav (Glass pill)
    - [x] Redesign Top Bar/Header
- [x] **6.4 Feature Pages**
    - [x] Apply aesthetic to Dashboard
    - [x] Apply aesthetic to Log Forms

## Phase 7: Advanced Income Tracking (Dual Currency)
- [x] **7.1 Visualization**
    - [x] Implement Stacked Bar Chart for Income (USD)
    - [x] Implement Stacked Bar Chart for Income (VES)
- [x] **7.2 Currency Isolation UI**
    - [x] Update Dashboards to display split totals (USD vs VES)
    - [x] Update Insights to display split charts or toggles for currencies

## Phase 8: Workout Session Mode (Refactor)
- [x] **8.1 Frontend Logic**
    - [x] Create `WorkoutSessionForm` Container
    - [x] Implement "Add Exercise" Row Logic
- [x] **8.2 Persistence Strategy**
    - [x] Implement "Batch Save" (Loop -> Individual Firestore Writes)
    - [x] Verify Notion Sync (ensuring 1-to-1 mapping)

## Phase 9: Fitness Streak & Gamification
- [x] **9.1 Core Logic & Data**
    - [x] Set up `users/{uid}` in Firestore.
    - [x] Create `UserStatsContext.jsx` to manage streak/badges.
    - [x] Implement `calculateStreak` utility with auto-freeze logic.
- [x] **9.2 Components & UI**
    - [x] Implement "Workout Complete" Modal with animations.
    - [x] Update `OverviewDashboard` to display Current Streak.
    - [x] Hook `WorkoutSessionForm` submission up to the new context.
- [ ] **9.3 "Identity" & "Vibe" Badges**
    - [ ] Implement Cumulative badges (Centurion, Marathoner)
    - [ ] Implement Contextual badges (Early Bird, Night Owl)
- [ ] **9.4 UI Implementation**
    - [ ] Build "My Badges" Profile Section
    - [ ] Create Badge Unlock Modal (Confetti!)

## Phase 10: Security Hardening & Optimizations
- [ ] **10.1 Firestore Security Rules**
    - [ ] Secure `transactions`: Enforce `userId` for read/write
    - [ ] Secure `workouts`: Enforce `userId` on create
- [ ] **10.2 API Protection**
    - [ ] Implement App Check for `manualFetchRates`
    - [ ] Secure `manualSync` (Admin check or App Check)
- [ ] **10.3 Maintenance**
    - [ ] Audit and fix npm vulnerabilities
    - [ ] Review Cloud Function permissions
    - [ ] **Debug iOS PWA Installation (Deferred from Phase 5.5)**


