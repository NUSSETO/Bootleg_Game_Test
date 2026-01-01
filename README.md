# Bootleg Game Test

A simple 2D Roguelike Shooter built with [Kaboom.js](https://kaboomjs.com/).

## Features
- **Wizard Player**: Move with Arrow Keys, Jump with Space.
- **Weapon System**: Staff rotates towards mouse. Shoot with Left Click or hold 'Q' for Auto-fire.
- **Enemies**: Bats (Fast/Homing) and Eyes (Shooting/Hovering). Wrapped screen logic ensures they never get lost.
- **Wave System**: Defeat enemies to progress. Upgrades available after each wave.
- **Upgrades**: Multishot, Rapid Fire, Speed Up.
- **Audio**: Procedurally generated retro sound effects.

## How to Run
Simply open `index.html` in your browser. No build step required!

## Development
- `game.js`: Core game logic.
- `sprites.js`: Base64 encoded sprite assets.
- `sounds.js`: Base64 encoded sound assets.
- `index.html`: Entry point.

## Assets
Assets are generated via Python scripts (`convert_to_b64.py`, `generate_sounds.py`) and embedded directly into the JS files for a single-file-like experience (aside from the split JS files).
