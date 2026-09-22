# CLUE QUEST ⚡
### Electronics Club • Department of Electronics & Communication Engineering
**VSB Engineering College (Autonomous), Karur, Tamil Nadu**

---

## 🌟 Overview

**CLUE QUEST** is a real-time, multi-team competition platform engineered specifically for the Electronics Club of VSB Engineering College. Designed to handle 40 concurrent teams participating in a high-stakes, clue-based tournament where speed, strategy, and electronics domain knowledge determine the champion.

---

## 🕹️ Core Gameplay Mechanics

- **20 Curated Electronics Challenges** covering: *Resistors, Capacitors, Inductors, Diodes, Transistors (BJT), MOSFETs, Operational Amplifiers (741), Logic Gates, Flip-Flops, Microcontrollers (MCU), Sensors, ADC, DAC, PWM, UART, I2C, SPI, Antennas, Modulation, and Oscillators*.
- **4 Progressively Revealing Clues** per question:
  - **Clue 1**: **100 Points** *(Available immediately upon question unlock)*
  - **Clue 2**: **75 Points** *(Structural / Formula Hint)*
  - **Clue 3**: **50 Points** *(Domain / Topology Hint)*
  - **Clue 4**: **25 Points** *(Definitive Acronym / Hallmark Hint)*
- **Point Sacrifice Model**: Revealing an additional clue reduces the maximum points obtainable for the current question (100 → 75 → 50 → 25). **Previously earned total score is never deducted.**
- **Maximum Possible Score**: `20 × 100 = 2000 Points`.
- **Authoritative Answer Matching**: Canonical answers and aliases are validated server-side with automated uppercase normalization, punctuation removal, and whitespace trimming.
- **Authoritative 20-Minute Timer**: Synchronized server countdown with network drift compensation and automatic submission upon timeout.

---

## 👥 Authentication & Participation Flow

```text
                    CLUE QUEST
                         │
              ┌──────────┴──────────┐
              │                     │
         PARTICIPANT            COORDINATOR
              │                     │
        TEAM NAME ONLY        USERNAME + PASSWORD
        (No Password / IDs)   (Admin Access)
              │                     │
              ▼                     ▼
        WAITING ROOM          CONTROL CENTER
              │                     │
              │              START / PAUSE /
              │              RESUME / END
              │                     │
              └──────────┬──────────┘
                         ▼
                     GAME EVENT
```

### 1. Participants (Team-Name-Only Entry)
- **No passwords or participant IDs required.**
- Participants simply enter their **Team Name** (e.g. `Circuit Breakers`) on the landing / entry screen and click **`ENTER QUEST →`**.
- Team names are validated (2–60 chars, sanitized, case-insensitive uniqueness check) and assigned a secure participant session token.
- Participants enter the **Waiting Room** and wait for the coordinator to start the quest.
- Team name is automatically locked once the event transitions to `COUNTDOWN` / `LIVE`.

### 2. Coordinator / Administrator (Protected Access)
- **Coordinator Login**: Accessed via the **Admin** button in the header or `/login` (Coordinator tab).
- **Credentials**:
  | Role | Username | Password |
  | :--- | :--- | :--- |
  | **Admin / Coordinator** | `admin` | `VSBadmin2026!` |
- **Capabilities**:
  - Event controls: `START NOW` (triggers 5-4-3-2-1 countdown), `PAUSE`, `RESUME`, `END`, `RESET`.
  - Live 40-team monitoring matrix with real-time score, active question, and clue level.
  - CSV Question Suite Import / Export (`serial number,question,clue 1,clue 2,clue 3,clue 4,answer`).
  - Integrity monitoring: Fullscreen violations, tab switching, copy/paste attempts, devtools detection.
  - Comprehensive audit logs and real-time team diagnostics.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Canvas-based interactive blue fog & circuit background.
- **Backend**: Node.js, TypeScript, Express, Secure HTTP-only cookies, Signed JWT sessions, Bcrypt hashing for admin authentication.
- **Database**: Neon PostgreSQL via `@neondatabase/serverless` / `pg` with index optimizations, paired with an integrated in-memory SQL engine for zero-config standalone offline execution.
- **Security & Integrity**:
  - Authoritative server state: Clues and answers are never leaked in network payloads before unlock.
  - Fullscreen enforcement with violation logging.
  - Tab-switching and copy/paste prevention.
  - Rate limiting and input sanitization against XSS.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional for Neon Cloud DB)
Create a `.env` file based on `.env.example`:
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
*(Runs comprehensive 65-test verification covering authentication, team session isolation, clue progression, scoring, CSV suite, timer, and security)*.

### 5. Build for Production
```bash
npm run build
```

---

## 🏆 Key Features

- **Institutional Design Language**: Dark navy, electric cyan glow, PCB traces, electronic chip motifs, JetBrains Mono monospace tickers, and interactive cursor-reactive blue atmospheric fog.
- **Full-Screen Boot Sequence**: Technical initialization animation with hardware diagnostics and security subsystem verification.
- **Live Waiting Room & Synchronized Countdown**: Live `TEAMS ONLINE: XX / 40` counter and synchronized 5-second countdown broadcast (`05 → 04 → 03 → 02 → 01 → GO!`).
- **Live 40-Team Coordinator Matrix**: Real-time admin monitoring of all participating teams (Question #, Clue level, Current value, Total score, Integrity flags, Status).
- **CSV Question Suite Import / Export**: Instant atomic import and export of standard 20-question tournament suites.
- **Public Live Leaderboard**: Real-time rank, team name, completed questions, and score tracking with podium highlights.
- **Network Resilience & Reconnect Handling**: Seamless session restoration and drift compensation upon browser refresh or temporary disconnect.

