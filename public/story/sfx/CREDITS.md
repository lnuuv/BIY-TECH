# Story sound effects — sources and licences

| File(s) | Source | Licence |
|---|---|---|
| `step-1.mp3` … `step-6.mp3` | Cut (6 single steps, loudness-normalised, faded) from `sounds/walking.ogg` in Kenney's *Starter Kit FPS* — https://github.com/KenneyNL/Starter-Kit-FPS | CC0 1.0 (the kit's README: "Assets included in this package (2D sprites, 3D models and sound effects) are CC0 licensed") |
| `click-a.mp3` … `click-d.mp3` | `sounds/placement-a…d.ogg` from Kenney's *Starter Kit City Builder* — https://github.com/KenneyNL/Starter-Kit-City-Builder | CC0 1.0 (same statement in that kit's README) |
| `door-open.mp3`, `door-close.mp3`, `place-heavy.mp3`, `knock.mp3`, `beep.mp3`, `ups-beep.mp3`, `printer.mp3` | Synthesised for this project by `scripts/build_sfx.py` (filtered noise, transients and tones; no third-party audio) | Project's own |

Rebuild: `python3 scripts/build_sfx.py <Starter-Kit-FPS> <Starter-Kit-City-Builder>` (needs numpy + ffmpeg).
The synthesised door/printer sounds are believable approximations, not field recordings; replace them with recorded CC0 files of the same names if better recordings become available — no code change is needed.
