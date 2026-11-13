// All mission content lives here. ORBITAL, Vesper, Calder, ORION-01 and the crew are design fiction:
// nothing below is a real observation, a real organisation or a real person.

export const SITE = {
  name: 'ORBITAL',
  tagline: 'Beyond the Known',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  description:
    'ORBITAL announces Expedition Vesper: a crewed mission concept to Calder, a candidate ocean world 6.2 light-years from Earth. Explore the vessel, the system, the crew and the timeline, then add your name to the transmission.',
  disclaimer:
    'ORBITAL is a fictional organisation. Expedition Vesper, the Vesper system, Calder, ORION-01 and its crew are design fiction. Figures are speculative and are not scientific findings. Not affiliated with or endorsed by any space agency.',
};

export const NAV = [
  { id: 'mission', label: 'Mission' },
  { id: 'vessel', label: 'Vessel' },
  { id: 'explore', label: 'System' },
  { id: 'crew', label: 'Crew' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'archive', label: 'Archive' },
] as const;

/** Distance from Earth to Vesper in light-years (fictional). */
export const VESPER_LY = 6.2;

export const MISSION = {
  statement: 'We are going to a star you cannot see without a telescope, to a world no one has photographed, and we will tell you everything we find.',
  objectives: [
    { n: '01', title: 'Reach Calder orbit', body: 'Cross 6.2 light-years and brake into a stable polar orbit around Vesper c, nicknamed Calder.' },
    { n: '02', title: 'Read the ocean', body: 'Map the surface, sample the atmosphere and test whether the dark regions really are open water.' },
    { n: '03', title: 'Light the Lantern chain', body: 'Drop a relay buoy every 0.5 light-years so the signal home never breaks.' },
    { n: '04', title: 'Send the first picture', body: 'Return the first close image of a planet that orbits another star. It arrives 6.2 years after it is taken.' },
  ],
  facts: [
    { k: 'Destination', v: 'Vesper c · “Calder”' },
    { k: 'Star', v: 'Vesper · K2 dwarf' },
    { k: 'Distance', v: '6.20 ly' },
    { k: 'Cruise', v: '≈ 22 years' },
    { k: 'Departure', v: '2046 · Earth–Moon L2' },
  ],
  ruler: [
    { name: 'Moon', ly: 4.06e-8, delay: '1.3 s' },
    { name: 'Mars', ly: 2.4e-5, delay: '12.6 min' },
    { name: 'Neptune', ly: 4.75e-4, delay: '4.2 h' },
    { name: 'Heliopause', ly: 1.9e-3, delay: '16.6 h' },
    { name: 'Oort cloud', ly: 0.8, delay: '0.8 yr' },
    { name: 'Vesper', ly: 6.2, delay: '6.2 yr' },
  ],
};

export type Hotspot = {
  id: 'shield' | 'hab' | 'comms' | 'tanks' | 'radiators' | 'drive';
  label: string;
  title: string;
  body: string;
  spec: string;
  /** model-space anchor (GLB units) */
  p: [number, number, number];
};

export const VESSEL = {
  name: 'ORION-01',
  intro: 'Ninety-eight metres, four people, one way to watch. Every module is designed to be serviced by hand, light-years from the nearest spare part.',
  specs: [
    { k: 'Length', v: '98 m' },
    { k: 'Dry mass', v: '1,840 t' },
    { k: 'Peak velocity', v: '0.28 c' },
    { k: 'Crew', v: '4 · torpor cycles' },
  ],
  hotspots: [
    { id: 'shield', label: 'Dust shield', title: 'Forward dust shield', body: 'A ceramic and graphene stack that takes interstellar dust impacts at 0.28 c, so the crew never has to.', spec: 'Ø 32 m · 4 layers', p: [0, 1.1, 5.05] },
    { id: 'comms', label: 'Optical link', title: 'Lantern optical terminal', body: 'A 1 m laser telescope that talks to the relay chain. One photon in ten million makes it home, and that is enough.', spec: '1.55 µm · 2 kbit/s at arrival', p: [0, 2.1, 3.5] },
    { id: 'hab', label: 'Crew ring', title: 'Torpor module + ring', body: 'Four berths. The crew sleeps in rotating 18-month cycles, and one person is always awake on the ring at 0.4 g.', spec: '4 berths · 0.4 g ring', p: [1.75, 0.35, 2.7] },
    { id: 'tanks', label: 'Propellant', title: 'Cryogenic tankage', body: 'Twelve tanks of deuterium and helium-3, half of them kept in reserve for the braking burn at Vesper.', spec: '12 tanks · 1,260 t', p: [1.25, -0.9, 0.2] },
    { id: 'radiators', label: 'Radiators', title: 'Heat rejection wings', body: 'Four 40 m wings that radiate the reactor’s waste heat into space. They glow faintly while the drive is lit.', spec: '4 × 40 m · 1.1 GW', p: [3.6, 3.0, -1.75] },
    { id: 'drive', label: 'Fusion drive', title: 'Direct-fusion drive', body: 'A D–³He reactor with a magnetic nozzle. It thrusts for 4 years outbound and 4 years to brake.', spec: '0.04 g · Isp ≈ 10⁶ s', p: [0, -1.25, -4.6] },
  ] satisfies Hotspot[],
};

export type PlanetKind = 'lava' | 'ocean' | 'ice' | 'giant' | 'dwarf';
export type Planet = {
  id: string;
  name: string;
  designation: string;
  kind: PlanetKind;
  orbitAU: number;
  /** display orbit radius in scene units */
  orbit: number;
  radius: number;
  period: string;
  temp: string;
  summary: string;
  seed: number;
  target?: boolean;
};

export const SYSTEM: Planet[] = [
  { id: 'ember', name: 'Ember', designation: 'Vesper b', kind: 'lava', orbitAU: 0.05, orbit: 3.2, radius: 0.32, period: '3.9 days', temp: '≈ 1,100 K', seed: 11, summary: 'Tidally locked and half molten. One side always faces the star.' },
  { id: 'calder', name: 'Calder', designation: 'Vesper c', kind: 'ocean', orbitAU: 0.21, orbit: 5.4, radius: 0.58, period: '34 days', temp: '≈ 275 K', seed: 7, target: true, summary: 'The destination. A candidate ocean world with ice caps and a thin nitrogen sky. Liquid water is a hypothesis we are going to test.' },
  { id: 'halden', name: 'Halden', designation: 'Vesper d', kind: 'ice', orbitAU: 0.6, orbit: 7.8, radius: 0.46, period: '163 days', temp: '≈ 160 K', seed: 23, summary: 'A frozen world under fractured blue ice, possibly with an ocean beneath.' },
  { id: 'morrow', name: 'Morrow', designation: 'Vesper e', kind: 'giant', orbitAU: 2.4, orbit: 11.2, radius: 1.25, period: '4.3 years', temp: '≈ 85 K', seed: 41, summary: 'A banded gas giant with a ring system. Its gravity bends our arrival path.' },
  { id: 'tithe', name: 'Tithe', designation: 'Vesper f', kind: 'dwarf', orbitAU: 9.1, orbit: 14.4, radius: 0.24, period: '32 years', temp: '≈ 40 K', seed: 5, summary: 'A dark, cratered dwarf at the edge of the system. It is the first thing ORION-01 will see up close.' },
];

export type CrewMember = {
  id: string;
  name: string;
  role: string;
  callsign: string;
  img: string;
  origin: string;
  bio: string;
  quote: string;
  stats: { k: string; v: string }[];
};

export const CREW: CrewMember[] = [
  { id: 'varga', name: 'Ilse Varga', role: 'Mission Commander', callsign: 'LODESTAR', img: '/img/crew-varga.webp', origin: 'Szeged', quote: 'Somebody has to stay awake for the view.', bio: 'Former long-duration station commander and test pilot. She has logged 611 days in orbit, more than anyone else in the program, and she takes the first and last watch.', stats: [{ k: 'Days in orbit', v: '611' }, { k: 'Watch', v: 'Cycle A' }] },
  { id: 'okafor-lund', name: 'Teodor Okafor-Lund', role: 'Flight Engineer', callsign: 'FORGE', img: '/img/crew-okafor-lund.webp', origin: 'Trondheim', quote: 'Everything on this ship can be fixed with two hands and a manual.', bio: 'Built fusion test stands before he flew. He wrote the repair procedures for every module on ORION-01 and has rehearsed each one in vacuum.', stats: [{ k: 'Procedures', v: '1,412' }, { k: 'Watch', v: 'Cycle B' }] },
  { id: 'castell', name: 'Mirae Castell', role: 'Planetary Scientist', callsign: 'TIDE', img: '/img/crew-castell.webp', origin: 'Valparaíso', quote: 'I want to be wrong about Calder in an interesting way.', bio: 'An oceanographer turned planetary scientist who designed the Calder survey. She will be the first person to see another world’s weather with her own eyes.', stats: [{ k: 'Survey targets', v: '38' }, { k: 'Watch', v: 'Cycle C' }] },
  { id: 'adeyemi', name: 'Samir Adeyemi', role: 'Flight Surgeon', callsign: 'KEEL', img: '/img/crew-adeyemi.webp', origin: 'Ibadan', quote: 'My patients sleep for eighteen months. I make sure they wake up.', bio: 'A torpor medicine pioneer and an emergency physician. He keeps four people healthy across 22 years, mostly while they are asleep.', stats: [{ k: 'Torpor trials', v: '214' }, { k: 'Watch', v: 'Cycle D' }] },
];

export type Milestone = { year: string; title: string; body: string; delay: string; phase: 'Earth' | 'Cruise' | 'Vesper' };

export const TIMELINE: Milestone[] = [
  { year: '2038', title: 'Program charter', body: 'ORBITAL is founded with one mandate: a crewed mission to the nearest promising world.', delay: '0 s', phase: 'Earth' },
  { year: '2041', title: 'Lantern-0 test', body: 'The first relay buoy holds a laser link from beyond Neptune for 400 days.', delay: '4.2 h', phase: 'Earth' },
  { year: '2043', title: 'Assembly at L2', body: 'ORION-01 is assembled in high orbit from 31 launches.', delay: '1.3 s', phase: 'Earth' },
  { year: '2046', title: 'Departure', body: 'The drive lights. Four years of thrust follow, then the long coast.', delay: '1.3 s', phase: 'Cruise' },
  { year: '2049', title: 'Heliopause crossing', body: 'ORION-01 leaves the Sun’s bubble, and the crew sees the first sky that is not ours.', delay: '16.6 h', phase: 'Cruise' },
  { year: '2057', title: 'Midpoint', body: 'Halfway at 0.28 c. The crew rotates into watch cycle C.', delay: '3.1 yr', phase: 'Cruise' },
  { year: '2064', title: 'Braking burn', body: 'The ship turns around and the drive faces Vesper for four years of braking.', delay: '5.1 yr', phase: 'Cruise' },
  { year: '2068', title: 'Arrival at Calder', body: 'Orbital insertion around Vesper c begins the survey.', delay: '6.2 yr', phase: 'Vesper' },
  { year: '2074', title: 'First image home', body: 'The first picture of Calder reaches Earth, 6.2 years after it was taken.', delay: '0 s · received', phase: 'Earth' },
];

export type ArchiveItem = { src: string; w: number; h: number; title: string; caption: string; code: string };

export const ARCHIVE: ArchiveItem[] = [
  { src: '/img/arc-launch.webp', w: 1600, h: 1000, title: 'Night launch, tanker flight 19', caption: 'Propellant tanker for the L2 assembly.', code: 'ARC-019' },
  { src: '/img/arc-hall.webp', w: 1600, h: 1000, title: 'Integration hall', caption: 'Crew module pressure test before flight.', code: 'ARC-044' },
  { src: '/img/arc-limb.webp', w: 1600, h: 1000, title: 'Dawn limb', caption: 'Atmosphere reference frame for the Calder camera.', code: 'ARC-102' },
  { src: '/img/arc-array.webp', w: 960, h: 1200, title: 'Ground station', caption: 'Deep-space receivers for the Lantern chain.', code: 'ARC-071' },
  { src: '/img/arc-testfire.webp', w: 1600, h: 1000, title: 'Drive test 7', caption: 'Plume test of the magnetic nozzle.', code: 'ARC-007' },
  { src: '/img/arc-control.webp', w: 1600, h: 1000, title: 'Flight control', caption: 'Night shift during the Lantern-0 link.', code: 'ARC-088' },
  { src: '/img/arc-pool.webp', w: 960, h: 1200, title: 'Neutral buoyancy', caption: 'EVA training for ring repairs.', code: 'ARC-131' },
  { src: '/img/arc-cluster.webp', w: 1600, h: 1000, title: 'Calibration target', caption: 'A neighbouring galaxy used to calibrate the Calder camera.', code: 'ARC-200' },
];

export const PIONEER_ROLES = [
  { v: 'observer', label: 'Curious observer' },
  { v: 'student', label: 'Student' },
  { v: 'engineer', label: 'Engineer' },
  { v: 'scientist', label: 'Scientist' },
  { v: 'educator', label: 'Educator' },
  { v: 'other', label: 'Something else' },
] as const;
