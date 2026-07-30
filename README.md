# DermaSense AI — AI Dermatological Consultation & Routine Engine

DermaSense AI is an intelligent, full-stack dermatological consultation and skincare management application. Built with **React 18**, **TypeScript**, **Tailwind CSS**, and powered by **Google Gemini 2.5 Flash**, DermaSense AI provides personalized morning and evening skincare routines, active ingredient compatibility checking, daily skin sentiment journaling, and safety guardrails against potential irritants.

---

## 🌟 Key Features

- **AI Dermatological Consultation Engine**: Comprehensive assessment covering skin type, environmental climate, budget tiers, vegan/cruelty-free preferences, known allergies, and current routines.
- **Quick-Start Demo Profiles**: Autofill sample diagnostic profiles (e.g., Sensitive & Rosacea, Hormonal Acne, Anti-Aging & Barrier Repair, Dry Winter Climate) with a single click.
- **Visual Skin Photo Assessment**: Supports skin photo uploads and analysis for visual texture, redness, and active breakout detection.
- **Interactive Ingredient Conflict Checker**: Real-time cross-checking matrix analyzing high-active compounds (Retinol, Vitamin C, AHAs/BHAs, Niacinamide, Benzoyl Peroxide, Peptides) to prevent chemical incompatibility and barrier damage.
- **30-Day Skin Journal & Sentiment Wave**: Recharts-powered data visualization tracking daily skin feelings (*Great*, *Fair*, *Irritated*) alongside epidermal barrier resilience scores.
- **AM & PM Routine Tracker**: Daily interactive checklist with AM/PM compliance logging, streak counters, and skin progress notes.

---

## 🛠️ Tech Stack & Dependencies

### Frontend
- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion / Motion](https://motion.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)

### Backend & AI Integration
- **Server**: [Express.js](https://expressjs.com/) (bundled via `esbuild`)
- **AI SDK**: [`@google/genai`](https://www.npmjs.com/package/@google/genai) (Google Gemini 2.5 Flash)
- **Environment Management**: Express API Proxy for hidden API key handling

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `yarn`
- A [Google Gemini API Key](https://aistudio.google.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/dermasense-ai.git
   cd dermasense-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 📁 Project Structure

```text
├── src/
│   ├── components/
│   │   ├── AssessmentForm.tsx          # Diagnostic assessment questionnaire
│   │   ├── RoutineDisplay.tsx          # Generated AM/PM routine & product cards
│   │   ├── IngredientConflictChecker.tsx # Active ingredient matrix & collision detector
│   │   ├── SkinJournal.tsx             # 30-day sentiment wave chart & daily logger
│   │   ├── RoutineTracker.tsx          # AM/PM interactive checklist & streak log
│   │   ├── SocialSettingsModal.tsx     # Developer social links manager
│   │   └── Header.tsx / Navbar         # App navigation & brand banner
│   ├── types.ts                        # Shared TypeScript interfaces & types
│   ├── App.tsx                         # Main layout, navigation, & view router
│   ├── main.tsx                        # React application entry point
│   └── index.css                       # Global Tailwind CSS imports
├── server.ts                           # Express backend API server & Gemini integration
├── package.json                        # Dependencies, build & start scripts
├── vite.config.ts                      # Vite configuration
└── README.md                           # Documentation
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
