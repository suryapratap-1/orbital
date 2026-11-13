# ORBITAL — critique log

## Pass 1 — 2026-11-13 (first full build, dev server)
| Section | Concept | Comp | Type | Motion | Craft | Memo | Notes / move |
|---|---|---|---|---|---|---|---|
| Arrival | 9 | 7 | 8 | 8 | 7 | 9 | The headline collided with the wordmark and the limb glow was too thick. **Move:** thinner atmosphere shell; headline shrunk and moved off the limb. |
| Mission | 8 | 8 | 9 | 8 | 7 | 8 | The HUD covered the facts table and the Earth/Moon labels collided. **Move:** HUD moved into the nav; ruler labels alternate rows. |
| Vessel | 8 | 7 | 8 | 8 | 6 | 8 | The ship read as a toy (big white balls, slab radiators) and the panel overlapped the beats. **Move:** GLB rebuilt with foil tanks, slatted radiators, greebles and RCS; beats hide when the panel opens. |
| Explore | 8 | 6 | 8 | 7 | 6 | 8 | The camera framed the night side, the overview was too tight and the star blew out. **Move:** sunward 3/4 camera, wider overview, orange limb-darkened star. |
| Crew | 8 | 8 | 9 | 8 | 7 | 8 | A dark nav gradient sat over the light paper. **Move:** the nav inverts over Crew. |
| Timeline | 8 | 8 | 8 | 9 | 8 | 8 | Fine. Vertical fallback verified. |
| Archive | 7 | 8 | 8 | 8 | 8 | 7 | Fine. The "View" cursor badge and lightbox work. |
| Pioneer | 9 | 7 | 8 | 8 | 8 | 9 | The title wrapped into 4 lines and the pulse overlapped the labels. **Move:** wider column; the pulse is inset. |

Signature moments: Arrival 8 · Vessel 8 · Reply 8
Smells found: none of the template list; the footer overflowed at 13vw.

## Pass 2 — 2026-11-13 (production build)
| Section | Concept | Comp | Type | Motion | Craft | Memo |
|---|---|---|---|---|---|---|
| Arrival | 10 | 9 | 9 | 9 | 8 | 10 |
| Mission | 8 | 8 | 9 | 8 | 8 | 8 |
| Vessel | 9 | 8 | 8 | 9 | 8 | 9 |
| Explore | 9 | 8 | 8 | 8 | 8 | 9 |
| Crew | 8 | 9 | 9 | 8 | 8 | 8 |
| Timeline | 8 | 8 | 8 | 9 | 8 | 8 |
| Archive | 8 | 8 | 8 | 8 | 8 | 8 |
| Pioneer | 9 | 8 | 9 | 9 | 9 | 9 |

Signature moments: **Arrival 9** (dawn sun behind the "A", limb eclipsing the wordmark) · **Vessel 9** (GLB drag/inertia, projected hotspots, scrubbed explode) · **Reply 9** (delay reaches 0.000 s; the name pulse runs to Vesper; real Postgres receipt).

Taste audit (production): Inter 88% · mono 1% · 9 sizes · display tracking −0.019em · body 1.35 · measure 40ch · UI 0.52s. **No off-target metrics.**
Real GPU (Intel UHD 620, 1440×900, full scroll): **59.6 fps avg · p95 16.7 ms · 0 long frames · PASS.**

Calibration: device = gold signal line (loader, HUD, ruler, hotspot leaders, orbits, trajectory, tx line, footer). 20vw moment = the hero wordmark. Real imagery = archive + crew. Type/subject interlock = the planet eclipses ORBITAL. The footer is a destination with a giant "Beyond the known."

Known limits: the hero headline paragraph still touches the left limb glow at some aspect ratios. Generated portraits/archive images are concept imagery (labelled in the UI).
