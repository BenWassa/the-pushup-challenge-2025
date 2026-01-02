```md
# PushUp

A lightweight, mobile-first app for tracking daily pushups during the PushUp Challenge.

Built to be fast, motivating, and simple. No accounts, no noise, no friction.

---

## What It Does

PushUp helps participants log daily pushups across two phases of the challenge:

- **Training Camp** (pre-challenge)
- **Official Challenge** (2000 reps goal)

The app focuses on momentum and clarity rather than gamification.

### Core Features
- Anonymous login using a simple username
- One-tap rep logging (+1, +10, +20, +25)
- Undo last action safely
- Daily progress tracking
- Monthly contribution calendar
- Streak and average stats
- Live leaderboard with real-time sync
- Training vs Official phase logic

---

## Tech Stack

- **React** – Single Page App
- **Firebase Auth** – Anonymous authentication
- **Firestore** – Real-time database
- **Tailwind CSS** – Utility-first styling
- **Lucide Icons** – Clean SVG icons

---
# PushUp

A lightweight, mobile-first app for tracking daily pushups during the PushUp Challenge.

Built to be fast, motivating, and simple. No accounts, no noise, no friction.

---

## What It Does

PushUp helps participants log daily pushups across two phases of the challenge:

- **Training Camp** (pre-challenge)
- **Official Challenge** (2000 reps goal)

The app focuses on momentum and clarity rather than gamification.

### Core Features
- Anonymous login using a simple username
- One-tap rep logging (+1, +10, +20, +25)
- Undo last action safely
- Daily progress tracking
- Monthly contribution calendar
- Streak and average stats
- Live leaderboard with real-time sync
- Training vs Official phase logic

---

## Tech Stack

- **React** – Single Page App
- **Firebase Auth** – Anonymous authentication
- **Firestore** – Real-time database
- **Tailwind CSS** – Utility-first styling
- **Lucide Icons** – Clean SVG icons

---

## Design Philosophy

- Mobile-first, one-handed use
- Orange equals action or progress
- White cards on light grey sections
- Asymmetrical rounded corners as a signature
- Clear hierarchy, no clutter
- Clarity over cleverness

If something matters, make it obvious.  
If it does not, make it quiet.

---

## Project Structure

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
	App.jsx
	main.jsx
/public
	tailwind.config.js
	styles.css
README.md

---

## Firebase Data Model

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

---

## Getting Started

### 1. Clone the Repo

git clone https://github.com/your-username/the-pushup-challenge-2025.git
cd the-pushup-challenge-2025

### 2. Install Dependencies

npm install

### 3. Firebase Setup

Create a Firebase project and enable:
- Firestore
- Anonymous Authentication

The app expects the following runtime variables (provided by the host environment):

- `__firebase_config`
- `__app_id`
- `__initial_auth_token` (optional)

This setup is compatible with Firebase Hosting and embedded environments.

---

## Running Locally

npm run dev

The app is optimized for mobile screens but works on desktop.

---

## Architecture Rules

- Firebase logic lives in hooks only
- UI components are dumb and reusable
- App-level state lives in `App.jsx`
- Tailwind first, CSS only for shapes and animations
- No premature abstraction
- Keep dependencies minimal

---

## MVP Scope

Included:
- Rep logging
- Undo
- Progress bars
- Calendar heatmap
- Leaderboards
- Stats

Explicitly excluded:
- Accounts or passwords
- Notifications
- Social feeds
- Complex gamification
- Overdesigned UI

---

## Deployment

Recommended:
- Firebase Hosting
- Vercel

Single environment only until stable.  
No CI/CD until the app settles.

---

## License

MIT

---

## Status

Active development  
Focused on clarity, speed, and daily usability
