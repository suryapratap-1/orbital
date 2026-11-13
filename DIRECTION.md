# ORBITAL — direction

**Concept:** *The site is a transmission.* It is the first signal from humanity's first arrival at another star, already on its way home. A permanent **signal-delay readout** counts down while you scroll: 6.20 years at the hero (Calder orbit) and 0.000 s at the last section (Earth). There the signal has reached you, and you answer it.
**Family:** clean and editorial, with real live 3D. Mission-control restraint, not a game.
**Feeling after 10 s:** *awe, then trust.* **After leaving:** "the site where my name was sent to another star."

## Concept device: the signal line
A 1px Mission Gold hairline with a travelling pulse, plus a mono stamp (delay / distance). It appears in:
- the loader (a noisy waveform locks into a straight line),
- the HUD (the delay readout and the progress hairline),
- the Mission ruler (a log-scale distance line from Earth to Vesper),
- the Vessel hotspot leader lines,
- the Explore orbit paths (the selected orbit turns gold),
- the Timeline trajectory curve that the probe pulse travels,
- the Pioneer submission (your name runs outward along the line),
- the footer wordmark underline.

## Art direction
- **Palette:** Deep Space `#050914` base, Midnight `#101D32`, Starlight `#E8EDF5` ink, Atmosphere `#91C8E8` (light, data, atmosphere). The one loud accent is **Mission Gold `#D7A85A`**, kept under 5% of pixels and used for the device, the CTA and live values.
- **Inversion:** The Crew is a Starlight paper dossier, the one light section.
- **Type** (the brief fixes these four families; roles are strict to keep the voice to one):
  - **Space Grotesk** for display, nav and labels (the primary voice).
  - **Inter** for body copy only.
  - **DM Serif Display** italic for single emotional words ("unknown", "home", "answer").
  - **IBM Plex Mono** for real telemetry only: delays, coordinates, dates. Kept at ≤ 5% of text.
- **Material:** sunlit planetary limb, gold MLI foil, white thermal paint, film grain, hairlines.
- **Motion personality:** *slow, orbital, precise.* Easing out-quart `cubic-bezier(.165,.84,.44,1)`, 0.55 s. Wipes use `cubic-bezier(.65,.05,0,1)`.

## Signature moments
1. **Arrival (3D):** load → the signal locks → dawn breaks over Calder's limb. A 22vw ORBITAL wordmark sits *behind* the planet, partly eclipsed. Scrolling pulls the camera back from the limb to the full crescent and its moon. *Meaning:* this is the view we are going for.
2. **The Vessel (interactive):** pinned stage → ORION-01 (GLB, PBR) approaches. Drag rotates it through 360° with inertia. Six hotspots connect to their components with gold leader lines. Scrubbing to the end explodes the modules apart along the spine. *Meaning:* this is real engineering, inspectable.
3. **The Reply (type + interaction):** the HUD delay reaches 0.000 s and the heading says *signal received*. Submitting the form sends your name as a pulse outward along the signal line. The receipt gives your signal ID and the date it would reach Vesper (now + 6.20 years). *Meaning:* you are part of the mission.

## Section map
| # | Section | Layout | Motion idea | Asset |
|---|---|---|---|---|
| 1 | The Arrival | Full-bleed WebGL + giant wordmark behind the subject | scrubbed camera pull-back, wordmark parallax | procedural planet (baked GPU textures), starfield |
| 2 | The Mission | Asymmetric editorial + giant number + log ruler | ruler pulse scrubbed Earth→Vesper; serif statement line reveal | typographic + SVG |
| 3 | The Vessel | Pinned stage + scrubbed sequence + drag | approach → orbit → exploded view; leader lines draw | ORION-01 GLB (meshopt) |
| 4 | Explore the Unknown | Space you pan (system map) + data rail | camera flies to the selected planet; the orbit turns gold | 5 baked planets |
| 5 | The Crew | Light index list + cursor-follow portrait (dialog bios) | wipe into light; portrait follows with lag | AI portraits (graded duotone) |
| 6 | Mission Timeline | Horizontal track driven by vertical scroll on a curved path | probe pulse travels the trajectory; delay ticks | SVG |
| 7 | Mission Archive | Masonry with parallax depths + lightbox | per-column parallax speeds; caption delay stamps | AI stills (graded) |
| 8 | Become a Pioneer | Split: form / transmission line, footer as destination | name pulse on submit; giant wordmark footer | type |

## Asset plan
| Asset | Type | Source | Cost | Status |
|---|---|---|---|---|
| Calder + 4 planets | code (GPU-baked fBm → albedo / height / roughness / clouds) | procedural | free | todo |
| Starfield + galactic band | code (points + shader) | procedural | free | todo |
| ORION-01 spacecraft | 3D GLB, built by script (three → GLTFExporter → gltf-transform meshopt) | procedural (Blender isn't installed; the pipeline is the same GLB path) | free | todo |
| Archive ×8, crew ×4 | AI stills (Pollinations sana) → crop, grade, grain → WebP | free-gen.sh | free (commercial terms unverified) | generating |
| No-WebGL posters | screenshots of our own renders → WebP | self | free | todo |

## Honesty rules
- ORBITAL, Vesper, Calder, ORION-01 and the crew are fictional. A footer disclaimer and a "Design fiction" label sit next to all mission data.
- No NASA names, logos or endorsement.
