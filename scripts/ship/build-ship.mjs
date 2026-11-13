// Builds the ORION-01 spacecraft procedurally and exports it as GLB.
// Usage: node scripts/ship/build-ship.mjs  → assets-src/orion-01.raw.glb (then optimise with gltf-transform)
// Axis convention: +Z is forward (dust shield), −Z is aft (drive). 1 unit ≈ 10 m.
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { writeFileSync, mkdirSync } from 'node:fs';

// Minimal FileReader so GLTFExporter can produce binary output in Node.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((b) => { this.result = 'data:application/octet-stream;base64,' + Buffer.from(b).toString('base64'); this.onloadend?.(); }); }
};

// --- materials (PBR; runtime enriches them by name) ---
const M = {
  paint: new THREE.MeshStandardMaterial({ name: 'paint', color: 0xcfd3d8, roughness: 0.66, metalness: 0.0 }),
  foil: new THREE.MeshStandardMaterial({ name: 'foil', color: 0xc99a4e, roughness: 0.32, metalness: 1.0 }),
  titanium: new THREE.MeshStandardMaterial({ name: 'titanium', color: 0x5d636d, roughness: 0.42, metalness: 0.9 }),
  dark: new THREE.MeshStandardMaterial({ name: 'dark', color: 0x1b2029, roughness: 0.55, metalness: 0.6 }),
  radiator: new THREE.MeshStandardMaterial({ name: 'radiator', color: 0x8a929c, roughness: 0.38, metalness: 0.55 }),
  ceramic: new THREE.MeshStandardMaterial({ name: 'ceramic', color: 0xbfc3c8, roughness: 0.8, metalness: 0.0 }),
  lights: new THREE.MeshStandardMaterial({ name: 'lights', color: 0x111111, emissive: 0x91c8e8, emissiveIntensity: 2.2, roughness: 1 }),
  drive: new THREE.MeshStandardMaterial({ name: 'drive', color: 0x111111, emissive: 0x9fd2ff, emissiveIntensity: 1.6, roughness: 1 }),
};

// part builder: collects geometries per material, then merges into one mesh per material
function part(name) {
  const buckets = new Map();
  const add = (geo, mat, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = {}) => {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s));
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.applyMatrix4(m);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    (buckets.get(mat) ?? buckets.set(mat, []).get(mat)).push(g);
  };
  const build = () => {
    const group = new THREE.Group(); group.name = name;
    for (const [mat, geos] of buckets) {
      const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
      mesh.name = `${name}_${mat.name}`; group.add(mesh);
    }
    return group;
  };
  return { add, build };
}
const R = Math.PI / 2;
const cyl = (rt, rb, h, seg = 48, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
const lathe = (pts, seg = 72) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);

let _seed = 7; const rnd = () => ((_seed = (_seed * 16807) % 2147483647) / 2147483647);
// small boxes scattered on a cylinder surface (axis = z)
function greeble(s, r, z0, z1, n, mat, size = 0.12) {
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, z = z0 + rnd() * (z1 - z0);
    const w = size * (0.4 + rnd()), h = size * (0.25 + rnd() * 0.6), d = size * (0.5 + rnd() * 1.4);
    s.add(new THREE.BoxGeometry(w, h, d), mat, { p: [Math.cos(a) * (r + h / 2), Math.sin(a) * (r + h / 2), z], r: [0, 0, a - Math.PI / 2] });
  }
}
function rcs(s, p, a) {
  s.add(new THREE.BoxGeometry(0.16, 0.16, 0.16), M.paint, { p, r: [0, 0, a] });
  for (const [dx, dy, dz] of [[0.11, 0, 0], [-0.11, 0, 0], [0, 0, 0.11], [0, 0, -0.11]]) {
    const q = new THREE.Vector3(dx, dy, dz).applyAxisAngle(new THREE.Vector3(0, 0, 1), a);
    s.add(new THREE.CylinderGeometry(0.02, 0.035, 0.06, 8), M.dark, { p: [p[0] + q.x, p[1] + q.y, p[2] + q.z], r: [dz ? Math.PI / 2 : 0, 0, dx ? Math.PI / 2 + a : a] });
  }
}

const ship = new THREE.Group(); ship.name = 'ORION-01';
const anchors = {};
const anchor = (id, p) => { const o = new THREE.Object3D(); o.name = `hs_${id}`; o.position.set(...p); anchors[id] = o; };

// 1. Forward dust shield — shallow ceramic cone with a gold rim
{
  const s = part('shield');
  s.add(lathe([[0, 0.34], [0.5, 0.3], [1.1, 0.18], [1.55, 0.02], [1.6, -0.04], [1.58, -0.1], [0.4, -0.1], [0, -0.08]], 96), M.ceramic, { p: [0, 0, 5.0], r: [R, 0, 0] });
  s.add(new THREE.TorusGeometry(1.59, 0.035, 12, 128), M.foil, { p: [0, 0, 4.96] });
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; s.add(cyl(0.025, 0.025, 1.0, 8), M.titanium, { p: [Math.cos(a) * 0.55, Math.sin(a) * 0.55, 4.55], r: [R, 0, 0] }); }
  ship.add(s.build()); anchor('shield', [0, 1.1, 5.05]);
}
// 2. Torpor (crew) module + rotating ring
{
  const s = part('hab');
  s.add(cyl(0.72, 0.72, 2.2, 64), M.foil, { p: [0, 0, 3.0], r: [R, 0, 0] });
  for (const z of [1.9, 2.45, 3.0, 3.55, 4.1]) s.add(new THREE.TorusGeometry(0.735, 0.022, 8, 96), M.titanium, { p: [0, 0, z] });
  s.add(lathe([[0, 0.25], [0.45, 0.18], [0.72, 0]], 64), M.paint, { p: [0, 0, 4.1], r: [R, 0, 0] });
  s.add(new THREE.TorusGeometry(1.75, 0.2, 24, 160), M.paint, { p: [0, 0, 2.7] });
  s.add(new THREE.TorusGeometry(1.75, 0.205, 6, 160, Math.PI * 2), M.dark, { p: [0, 0, 2.7], s: [1, 1, 0.3] });
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; s.add(cyl(0.06, 0.06, 1.05, 12), M.titanium, { p: [Math.cos(a) * 1.22, Math.sin(a) * 1.22, 2.7], r: [0, 0, a + R] }); }
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; s.add(new THREE.BoxGeometry(0.16, 0.05, 0.04), M.lights, { p: [Math.cos(a) * 1.955, Math.sin(a) * 1.955, 2.7], r: [0, 0, a + R] }); }
  greeble(s, 0.73, 1.95, 4.05, 46, M.paint, 0.11);
  greeble(s, 0.73, 1.95, 4.05, 24, M.titanium, 0.08);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; rcs(s, [Math.cos(a) * 0.82, Math.sin(a) * 0.82, 4.0], a); }
  ship.add(s.build()); anchor('hab', [1.75, 0.35, 2.7]);
}
// 3. Optical comms terminal on a boom
{
  const s = part('comms');
  s.add(cyl(0.04, 0.04, 1.1, 10), M.titanium, { p: [0, 1.15, 3.5] });
  s.add(lathe([[0, -0.02], [0.18, 0.0], [0.38, 0.06], [0.55, 0.15], [0.56, 0.17], [0.52, 0.17], [0.36, 0.09], [0.17, 0.035], [0, 0.02]], 64), M.paint, { p: [0, 1.75, 3.5], r: [-0.35, 0, 0] });
  s.add(cyl(0.02, 0.02, 0.4, 8), M.titanium, { p: [0, 1.87, 3.55], r: [-0.35, 0, 0] });
  s.add(new THREE.SphereGeometry(0.05, 16, 12), M.lights, { p: [0, 2.06, 3.62] });
  ship.add(s.build()); anchor('comms', [0, 2.1, 3.5]);
}
// 4. Spine truss
{
  const s = part('spine');
  const z0 = 1.9, z1 = -3.0, L = z0 - z1, zc = (z0 + z1) / 2, r = 0.38;
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + R; s.add(cyl(0.045, 0.045, L, 10), M.titanium, { p: [Math.cos(a) * r, Math.sin(a) * r, zc], r: [R, 0, 0] }); }
  const n = 16;
  for (let k = 0; k <= n; k++) {
    const z = z1 + (k / n) * L;
    s.add(new THREE.TorusGeometry(r, 0.02, 6, 3), M.titanium, { p: [0, 0, z], r: [0, 0, R] });
    if (k < n) for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + R + Math.PI / 3; const len = Math.hypot(L / n, r);
      s.add(cyl(0.014, 0.014, len, 6), M.titanium, { p: [Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, z + L / n / 2], r: [Math.atan2(r, L / n) + R, 0, a - R] });
    }
  }
  s.add(cyl(0.12, 0.12, L, 16), M.dark, { p: [0, 0, zc], r: [R, 0, 0] });
  ship.add(s.build());
}
// 5. Cryogenic propellant tanks
{
  const s = part('tanks');
  for (const [z, off] of [[0.85, 0], [-0.45, Math.PI / 6]]) for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + off, x = Math.cos(a) * 0.86, y = Math.sin(a) * 0.86;
    s.add(new THREE.SphereGeometry(0.44, 48, 32), (i === 1 || i === 4) ? M.paint : M.foil, { p: [x, y, z], s: [1, 1, 1.25] });
    s.add(new THREE.TorusGeometry(0.445, 0.018, 8, 64), M.titanium, { p: [x, y, z] });
    s.add(new THREE.TorusGeometry(0.445, 0.014, 8, 64), M.titanium, { p: [x, y, z], r: [0, R, a] });
    s.add(cyl(0.03, 0.03, 0.5, 8), M.titanium, { p: [x * 0.6, y * 0.6, z], r: [0, 0, a + R] });
  }
  ship.add(s.build()); anchor('tanks', [1.25, -0.9, 0.2]);
}
// 6. Radiator wings — four long panels with heat pipes
{
  const s = part('radiators');
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4, c = Math.cos(a), sn = Math.sin(a);
    const len = 4.0, w = 1.5, mid = 0.55 + len / 2;
    const slats = 9, gap = 0.025, sw = (w - gap * (slats - 1)) / slats;
    for (let k = 0; k < slats; k++) s.add(new THREE.BoxGeometry(len, 0.03, sw), M.radiator, { p: [c * mid, sn * mid, -1.75 - w / 2 + sw / 2 + k * (sw + gap)], r: [0, 0, a] });
    for (let k = 0; k < 5; k++) { const t = 0.55 + (k + 0.5) * (len / 5); s.add(new THREE.BoxGeometry(0.06, 0.05, w + 0.06), M.titanium, { p: [c * t, sn * t, -1.75], r: [0, 0, a] }); }
    
    s.add(cyl(0.05, 0.05, w, 10), M.foil, { p: [c * 0.55, sn * 0.55, -1.75], r: [R, 0, 0] });
    s.add(cyl(0.035, 0.035, w + 0.04, 8), M.titanium, { p: [c * (0.55 + len), sn * (0.55 + len), -1.75], r: [R, 0, 0] });
  }
  ship.add(s.build()); anchor('radiators', [3.6, 3.0, -1.75]);
}
// 7. Fusion drive + magnetic nozzle
{
  const s = part('drive');
  s.add(cyl(0.82, 0.82, 1.3, 64), M.foil, { p: [0, 0, -3.55], r: [R, 0, 0] });
  s.add(lathe([[0, 0.66], [0.82, 0.66], [0.9, 0.6], [0.9, -0.6], [0.82, -0.66], [0, -0.66]], 64), M.dark, { p: [0, 0, -3.55], r: [R, 0, 0], s: [1, 0.08, 1] });
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; s.add(new THREE.BoxGeometry(0.14, 0.14, 1.2), M.titanium, { p: [Math.cos(a) * 0.86, Math.sin(a) * 0.86, -3.55] }); }
  const rings = [[0.95, -4.35], [1.05, -4.75], [1.1, -5.15]];
  for (const [r, z] of rings) { s.add(new THREE.TorusGeometry(r, 0.09, 16, 96), M.titanium, { p: [0, 0, z] }); s.add(new THREE.TorusGeometry(r, 0.06, 12, 96), M.foil, { p: [0, 0, z - 0.05] }); }
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; s.add(cyl(0.035, 0.035, 1.0, 8), M.titanium, { p: [Math.cos(a) * 1.0, Math.sin(a) * 1.0, -4.75], r: [R, 0, 0] }); }
  s.add(lathe([[0.18, 0.05], [0.42, -0.4], [0.72, -1.2], [0.7, -1.2], [0.4, -0.4], [0.16, 0.05]], 64), M.titanium, { p: [0, 0, -4.15], r: [R, 0, 0] });
  s.add(new THREE.CircleGeometry(0.3, 48), M.drive, { p: [0, 0, -4.32], r: [Math.PI, 0, 0] });
  s.add(cyl(0.16, 0.16, 0.2, 32), M.drive, { p: [0, 0, -4.25], r: [R, 0, 0] });
  greeble(s, 0.83, -4.15, -2.95, 40, M.titanium, 0.12);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; rcs(s, [Math.cos(a) * 1.0, Math.sin(a) * 1.0, -3.0], a); }
  ship.add(s.build()); anchor('drive', [0, -1.25, -4.6]);
}
for (const o of Object.values(anchors)) ship.add(o);

const exporter = new GLTFExporter();
const glb = await exporter.parseAsync(ship, { binary: true });
mkdirSync('assets-src', { recursive: true });
writeFileSync('assets-src/orion-01.raw.glb', Buffer.from(glb));
let tris = 0; ship.traverse((o) => { if (o.isMesh) tris += o.geometry.attributes.position.count / 3; });
console.log('exported assets-src/orion-01.raw.glb', (glb.byteLength / 1024).toFixed(0) + ' KB', Math.round(tris) + ' tris');
