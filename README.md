# CLUE QUEST ⚡
### Department of Electronics & Communication Engineering • Electronics Club
**VSB Engineering College (Autonomous), Karur, Tamil Nadu**

> Official Live Competition Platform inspired by [VSB ECE Online](https://www.vsbece.online/).

---

## 🌟 Overview

**CLUE QUEST** is a live multi-user competition platform engineered specifically for the Electronics Club of VSB Engineering College. Designed to handle 40+ concurrent participants logging in and competing simultaneously, it delivers an authoritative clue-based tournament experience where strategic thinking and domain knowledge determine the champion.

---

## 🕹️ Core Gameplay Mechanics

- **20 Curated Electronics Challenges** covering: *Resistors, Capacitors, Inductors, Diodes, Transistors (BJT), MOSFETs, Operational Amplifiers (741), Logic Gates, Flip-Flops, Microcontrollers (MCU), Sensors, ADC, DAC, PWM, UART, I2C, SPI, Antennas, Modulation, and Oscillators*.
- **4 Progressively Revealing Clues** per question:
  - **Clue 1**: **100 Points** *(Available immediately)*
  - **Clue 2**: **75 Points** *(Structural / Formula Hint)*
  - **Clue 3**: **50 Points** *(Domain / Topology Hint)*
  - **Clue 4**: **25 Points** *(Definitive Acronym / Hallmark Hint)*
- **Point Sacrifice Model**: Revealing a clue sacrifices the potential reward for the active question (100 → 75 → 50 → 25). **Previously accumulated total score is never reduced.**
- **Maximum Possible Score**: `20 × 100 = 2000 Points`.
- **Deterministic Answer Validation**: Canonical answers and aliases are matched with automated whitespace, casing, and symbol normalization.

---

## 👥 Default Credentials

| Role | Username / Player Code | Default Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin / Coordinator** | `admin` | `VSBadmin2026!` | Event controls, 40-player matrix, question CRUD |
| **Participants (40 Users)** | `CQ001` to `CQ040` | `VSBece2026!` | Isolated multi-user player accounts |

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React.
- **Backend**: Node.js, TypeScript, Express, Secure HTTP-only cookies, JWT sessions, Bcrypt password hashing.
- **Database**: Neon PostgreSQL via `@neondatabase/serverless` / `pg` with index optimizations and fallback memory engine for zero-config local testing.
- **Security & Session Isolation**: Server-authoritative scoring, unrevealed clues/answers are never leaked in client network payloads.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Neon PostgreSQL (Optional for live DB)
Create a `.env` file from `.env.example`:
```env
DATABASE_URL=postgresql://[user]:[password]@[neon-host]/[database]?sslmode=require
JWT_SECRET=vsb_ece_clue_quest_2026_super_secret_jwt_key_secure_session
PORT=3001
```
*(If no `DATABASE_URL` is set, the application automatically runs on the integrated PostgreSQL memory database engine)*.

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser.

### 4. Run Automated Test Suite
```bash
npx tsx server/test-suite.ts
```

### 5. Build for Production
```bash
npm run build
```

---

## 🏆 Key Features

- **Institutional Design Language**: Dark navy, electric cyan, PCB traces, electronic chip motifs, JetBrains Mono monospace tickers.
- **Waiting Room & Synchronized Countdown**: Live online participant counter (`37 / 40`) and synchronized 5-second countdown broadcast (`05 → 04 → 03 → 02 → 01 → GO!`).
- **Live 40-Participant Matrix**: Real-time admin monitoring of all 40 participants (Question #, Clue level, Current value, Score, Status).
- **Question Suite Management**: Complete question CRUD, live preview, duplicate, reorder, and JSON import/export.
- **Network Resilience**: "Connection Interrupted" reconnect banner and authoritative server recovery.
