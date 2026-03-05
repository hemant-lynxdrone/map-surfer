# Map Surfer

Map Surfer is a tiny React (TypeScript) demo that reads coordinates from a JSON file and moves a Leaflet marker smoothly along a path.

<video src="https://github.com/user-attachments/assets/456a6d34-8be0-4b09-88be-23f26e447465"   
autoplay
muted
loop
playsinline></video>

## Features

- Loads coordinates from `src/coordinates/coordsA.json` or `src/coordinates/coordsB.json`
- Smooth marker animation between points
- Two motion modes:
  - Mode A: fixed time per segment (no time field needed)
  - Mode B: constant speed (computed from distance)
- Components are reusable for future projects

---

## Tech

- React + TypeScript (Vite)
- Leaflet + react-leaflet
- Coordinates loaded from `src/coordinates/coordsA.json` or `src/coordinates/coordsB.json`

---

## Setup

```bash
npm install
npm run dev
```

---

## Install from scratch (Vite)

```bash
npm create vite@latest map-surfer -- --template react-ts
cd map-surfer
npm i leaflet react-leaflet
npm run dev
```

---

## Notes

- This project is intentionally simple (no backend, no routing).
- Easy to extend with play/pause, looping, seeking, or real GPS timestamps.
