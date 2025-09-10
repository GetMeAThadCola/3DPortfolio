# City Driver (React + React Three Fiber + Vite)

A tiny stylized island city where you drive a car around a walled map. Pedestrians wander the streets; if you bump one they **scream** and turn into a **ghost** that floats away. Uses **React Three Fiber** for rendering and some lightweight arcade physics.

https://user-images.example/your-demo.gif

---

## Features

- 🏎️ **Arcade driving**: acceleration, drag, speed limits, and smooth steering filters.
- 🎥 **Chase camera** with mouse-wheel zoom + a cinematic **spawn zoom-in**.
- 🚶 **Pedestrians** that wander (simple AI), clamp to the island, and…
- 👻 **Ghost effect**: on collision they scream (positional audio), rise, spin, and fade out.
- 🧱 **Circular “wall city”** with roads, buildings, trees; all toon-style (no textures).

---

## Tech Stack

- **React 18**, **Vite**
- **react-three-fiber** (R3F) + **three**
- **@react-three/drei** (PositionalAudio, etc.)
- **zustand** for simple state (e.g., player position / input)

---

## Getting Started

### Prereqs
- **Node 18+** (recommended)
- **npm** (comes with Node)

### Install & Run

```bash
npm ci
npm run dev
