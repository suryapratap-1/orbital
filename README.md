# ORBITAL — Beyond the Known

An immersive Next.js site for **Expedition Vesper**, a fictional first interstellar mission. It is design fiction: no real data, agency or endorsement.

## Run
```bash
npm install
# PostgreSQL: create a database, then
echo "DATABASE_URL=postgres://user:pass@localhost:5432/orbital" > .env.local
node --env-file=.env.local scripts/db-setup.mjs   # applies db/schema.sql
npm run dev        # or: npm run build && npm start
```

## Architecture
- `app/`: layout (fonts, metadata), page, `api/pioneers` (zod-validated POST into Postgres, origin check, rate limit, honeypot), robots/sitemap/OG/404.
- `components/sections/`: the 8 sections plus the footer, all DOM-first and accessible.
- `three/`: the separate 3D layer. There is **one** WebGL canvas (`Stage.tsx`) and each scene renders into it through drei `<View>`. Scenes are dynamically imported.
  - `planet/`: GPU-baked procedural planets (albedo, clouds, height, roughness, emissive) using a progressive strip bake queue (`bakeQueue.ts`), a custom surface shader and an atmosphere shell.
  - `scenes/VesselScene.tsx`: loads `public/models/orion-01.glb` (meshopt). It has PBR materials, a procedural space environment map, drag rotation, scroll-scrubbed approach and exploded view, and projected DOM hotspots.
  - `scenes/SystemScene.tsx`: the Vesper system with planet selection and a fly-to camera.
- `lib/`: content (`mission.ts`), the shared store, the signal-delay math, the db pool and the shared zod schema.

## Assets
- `scripts/ship/build-ship.mjs` builds ORION-01 procedurally and exports a GLB. It is optimised with `npx @gltf-transform/cli optimize assets-src/orion-01.raw.glb public/models/orion-01.glb --compress meshopt --simplify false --join false --flatten false`. Blender wasn't available, but the pipeline is the same GLB path, so a Blender export can drop in.
- `scripts/process-images.py` grades the AI stills (Pollinations; commercial terms unverified) into WebP.
- `public/posters/` holds the static fallbacks for no-WebGL, captured from the live renders.

## Quality switches
- `?nogl` gives the static fallback, `?reduced` gives reduced motion, `?tier=low|mid|high` forces a render tier, and `?shot=<section-id>` jumps to a section.
- Adaptive DPR (drei PerformanceMonitor, capped at the device DPR), tiered bake sizes, `compileAsync` precompiles, and views that skip rendering when off-screen.
