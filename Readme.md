# Task Organizer — Chrome Extension

A Chrome Extension for managing your tasks with built-in timers and sound notifications.

## Features

- ✅ **Create tasks** via a clean modal with title, description, and duration
- ⏱ **Per-task timers** — start, pause, resume, and reset each timer independently
- 🔔 **Sound notifications** — a pleasant chime plays when a task timer completes
- 📋 **Task status tracking** — Pending / Running / Paused / Done
- 🗂 **Filter view** — All, Active, Completed tabs
- 💾 **Persistent storage** — tasks are saved via `chrome.storage.local`

## Tech Stack

- [Vite](https://vitejs.dev/) — build tooling
- [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) — utility-first styling
- Chrome Extension Manifest V3

## Development

```bash
npm install
npm run build
```

Then load the `dist/` folder as an unpacked extension in `chrome://extensions`.

## Project Structure

```
src/
  components/
    TaskList.tsx      # Main list view with filter tabs
    TaskItem.tsx      # Individual task card with controls
    TaskModal.tsx     # Create / edit task modal
    TimerDisplay.tsx  # Circular progress timer
  hooks/
    useTasks.ts       # Task state management + tick loop
  types/
    task.ts           # Task interface
  utils/
    storage.ts        # chrome.storage / localStorage adapter
    sound.ts          # Web Audio API completion chime
public/
  manifest.json       # Chrome Extension manifest v3
  icons/              # 16px, 48px, 128px PNG icons
```
