# Fitness & Finance Tracker v2: The "Smart Assistant" Upgrade

This roadmap covers Phase 2 of the application, transforming it from a static tracker into a premium, AI-powered personal assistant for health and finances.

## 🚀 Phase 11: The Premium Mobile Experience
*Goal: Elevate the PWA to feel indistinguishable from a native top-tier iOS/Android app.*

- [ ] **11.1 Biometric Security (WebAuthn)**
  - Implement FaceID/TouchID prompt on app launch using the Web Authentication API.
  - Require authentication before decrypting/displaying financial data or the dashboard.
- [ ] **11.2 Native Haptics Engine**
  - Integrate `navigator.vibrate()` (where supported).
  - Add satisfying ticks and buzzes when logging transactions, finishing workouts, unlocking badges, and pressing major buttons.
- [ ] **11.3 Custom Dynamic Themes**
  - Extract CSS variables into an accessible theme provider.
  - Add a settings menu to toggle between "Midnight" (OLED Black), "Ocean" (Deep Blues), and "Dawn" (Light Mode).

## 🧮 Phase 12: Advanced Financial Tools
*Goal: Move beyond basic tracking into proactive financial management considering the VES/USD economy.*

- [ ] **12.1 The "Tab" / Money Owed Tracker**
  - Create a dedicated section to track micro-loans or split bills (who owes you, who you owe).
  - Calculate real-time current debt values against live exchange rates (e.g., if a 1000 VES debt is recorded, show how its USD value fluctuates).
- [ ] **12.2 Recurring Subscriptions Manager**
  - Dedicated UI tab for fixed monthly costs (Netflix, Gym, iCloud, Server Costs).
  - Auto-log these transactions on the 1st of every month.
  - Visual timeline showing upcoming bills.

## 🏋️‍♂️ Phase 13: Next-Level Fitness Engine
*Goal: Make logging workouts entirely frictionless and start analyzing the body's response.*

- [ ] **13.1 Body Metrics Tracker & Charts**
  - Add a daily/weekly input for Body Weight (kg/lb) and Body Fat %.
  - Create a unified graph on the Insights Page overlaying weight trends with workout volume and frequency.
- [ ] **13.2 Routine Templates (1-Tap Logging)**
  - Allow users to build and save sets of exercises as templates (e.g., "Push Day A", "Full Body Friday").
  - On the Workout form, adding a template instantly pre-fills the form with the saved exercises, requiring only the reps/weight input.

## 🤖 Phase 14: AI WhatsApp Automation (Make.com Integration)
*Goal: Make the app usable without even opening it, relying on LLMs to parse natural language.*

- [ ] **14.1 The WhatsApp Webhook Gateway**
  - Spin up a Make.com scenario connected to Meta WhatsApp Cloud API.
  - Establish a secure webhook endpoint to receive incoming messages.
- [ ] **14.2 Conversational AI Logging (LLM Router)**
  - Connect Make.com to Gemini / OpenAI to parse intents.
  - **Expense Parsing:** User texts `"Bought coffee for 150 Bs"`. AI categorizes it, notes the date, and posts a secure payload to the Firebase Add Transaction endpoint.
  - **Workout Parsing:** User texts `"Ran 5km in 30 mins and did 3 sets of pullups"`. AI builds the JSON workout log array and posts to Firebase.
- [ ] **14.3 Automated AI Weekly Summaries**
  - Run a CRON job via Make.com every Sunday at 8 PM.
  - Query the past 7 days of Firebase data (spending habits + workout volume).
  - Use the LLM to generate a motivational, conversational summary and push it to the user via WhatsApp.
