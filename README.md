# PushUp (2026)

A lightweight, mobile-first app for tracking daily pushups during the PushUp Challenge.

Built to be fast, motivating, and simple. No accounts, no noise, no friction.

Designed for personal use and small groups.

---

## What It Does

PushUp helps participants log daily pushups across two phases of the challenge:

- **Training Camp** (practice and warm-up period)
- **Official Challenge** (2000 reps goal)

After the official challenge ends, the app continues to store data. Additional reps can still be logged and naturally function as post-challenge or future training data.

The app prioritizes momentum and clarity over gamification.

---

## Core Features

- Anonymous login using a simple username
- One-tap rep logging (+1, +10, +20, +25)
- Safe undo of last action
- Daily progress tracking
- Monthly contribution calendar
- Streak and average stats
- Live leaderboard with real-time sync
- Training vs Official phase logic

---

## Design Philosophy

- Mobile-first, one-handed use
- Desktop supported but not optimized
- PWA-first mindset for phone use
- Orange equals action or progress
- White cards on light grey sections
- Asymmetrical rounded corners as a signature
- Clear hierarchy, no clutter
- Clarity over cleverness

If something matters, make it obvious.  
If it does not, make it quiet.

---

## Intended Use

- Personal tracking
- Small private groups (friends, roommates, training partners)
- Honour-system usernames
- No moderation or identity enforcement

Usernames are assumed to be unique by social agreement.

---

## Project Structure

```

/src
/components
Card.jsx
Button.jsx
ProgressBar.jsx
ContributionCalendar.jsx
/hooks
useAuth.js
useUserData.js
useLeaderboard.js
/utils
date.js
season.js
format.js
index.js
App.jsx
main.jsx
index.css
/public
vite.svg
tailwind.config.js
postcss.config.js
README.md

```

---

## Firebase Data Model

```

users (collection)
{username} (document)
displayName: string
training_reps: number
official_reps: number
logs: [
{
amount: number
timestamp: Date
season: "TRAINING" | "OFFICIAL"
}
]
created_at: timestamp
last_active: timestamp

````

---

## Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/the-pushup-challenge-2025.git
cd the-pushup-challenge-2025
````

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Firebase Setup

Create a Firebase project and enable:

* **Firestore**
* **Anonymous Authentication**

This app is intended for a very small number of users (≈5 people).
For this scale, Firebase provides more than enough performance and safety.

The app supports two environments:

* Injected runtime variables (Firebase Hosting or embedded environments)
* Local development using environment variables

---

### Runtime Variables

The app can receive the following injected variables when hosted:

* `__firebase_config`
* `__app_id`
* `__initial_auth_token` (optional)

For local development, these values are typically supplied via `.env.local` using `VITE_*` variables.

This hybrid approach allows future migration to stricter Firebase best practices without changing app logic.

---

## Running Locally

```bash
npm run dev
```

The app is optimized for mobile screens but works on desktop.

---

### Building for Production

```bash
npm run build
```

This creates a `dist/` folder containing the production build.

---

## Progressive Web App (PWA)

The app is designed to be PWA-compatible and works well when added to a phone home screen.

* Mobile-first layout
* Offline-tolerant UI patterns
* No reliance on desktop-only interactions

Full offline write support is not guaranteed.

---

## Architecture Rules

* Firebase logic lives in hooks only
* UI components are dumb and reusable
* App-level state lives in `App.jsx`
* Tailwind first, CSS only for shapes and animations
* No premature abstraction
* Keep dependencies minimal

---

## MVP Scope

Included:

* Rep logging
* Undo
* Progress bars
* Calendar heatmap
* Leaderboards
* Stats

Explicitly excluded:

* Accounts or passwords
* Notifications
* Social feeds
* Complex gamification
* Overdesigned UI
* Admin dashboards

---

## Deployment

Recommended:

* **Firebase Hosting**
* **Vercel**

Single environment only until stable.
No CI/CD until the app settles.

---

## License

MIT

---

## Status

Active development
Focused on clarity, speed, and daily usability
