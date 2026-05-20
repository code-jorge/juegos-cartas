# Card Games

[![Netlify Status](https://api.netlify.com/api/v1/badges/67620167-e5e5-42dd-9e91-8cf0962d486c/deploy-status)](https://app.netlify.com/projects/escoba/deploys)

A collection of web-based card games built with React. Pick a game from the home screen and play.

## Games

### Escoba — `/escoba`

The traditional Spanish card game played with a 40-card Spanish deck.

- Play against 1-3 AI opponents
- Two difficulty levels (easy, hard)
- Optional hints for valid captures
- Score tracking across multiple rounds

### Addiction Solitaire — `/addiction-solitaire`

Also known as Gaps. Single-player solitaire played on a 4×13 grid of a 52-card deck with the aces removed.

- Fill each gap with the card one rank above and same suit as the card on its left
- Leftmost gaps accept any 2; gaps right of a King are dead
- 2 redeals available — correctly-placed prefixes stay frozen
- Goal: each row sorted 2→K in a single suit

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 to pick a game.

## Tech Stack

React, TypeScript, Vite, React Router
