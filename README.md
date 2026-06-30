# GetItDone

An AI-powered productivity companion built using **Google AI Studio** and **Gemini** that helps users plan, prioritize, complete, and verify tasks before deadlines are missed.

---

# Problem Statement

**Build an AI-powered productivity companion that proactively assists users in planning, prioritizing, and completing tasks before deadlines are missed.**

---

# Solution Overview

GetItDone is designed to move beyond traditional to-do lists by actively helping users complete their work instead of simply reminding them.

Users can create tasks manually or naturally through **Astra**, the built-in AI assistant. Astra understands natural language, generates structured tasks, suggests priorities, estimates duration, and helps users organize their workload.

The application also includes an **Idea Inbox** for quickly capturing thoughts, intelligent reminders that become more frequent as deadlines approach, context-based task verification, productivity analytics, and XP-based progress tracking.

---

# Key Features

- AI-powered task creation using natural language
- Astra AI Planning Assistant
- Intelligent task prioritization
- Smart adaptive reminders
- Context-based task verification
- Idea Inbox for capturing thoughts
- Calendar and task scheduling
- Productivity analytics dashboard
- XP, streaks, and progress tracking

---

# Tech Stack

- Google AI Studio
- Gemini API
- React
- TypeScript
- Vite
- Express
- Firebase
- Google Cloud

---

## View the Project in Google AI Studio

The original project was built using Google AI Studio.

Project Link:
https://ai.studio/apps/1608cc22-9fce-4419-bb32-eeac198ed478

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies

```bash
npm install
```

2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key.

Example:

```env
GEMINI_API_KEY=YOUR_API_KEY
```

3. Run the application

```bash
npm run dev
```

---

# Repository Structure

```text
src/
components/
assets/
lib/
App.tsx
main.tsx
server.ts
package.json
```

---

# Future Enhancements

- Google Calendar integration
- Gmail task extraction
- Voice-enabled task creation
- Cross-device synchronization
- Team collaboration
- Smarter AI productivity insights

---

# Author

**Lakshita Israni**

Built as part of the **Google AI Studio Hackathon 2026**.
