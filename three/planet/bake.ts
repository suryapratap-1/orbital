import * as THREE from 'three';
import { NOISE, UV_TO_DIR } from '../glsl';
import { BAKE_VERT, cancelBake, enqueueBake, makeTarget } from '../bakeQueue';
import type { PlanetKind } from '@/lib/mission';

export const KIND_ID: Record<PlanetKind, number> = { ocean: 0, lava: 1, ice: 2, giant: 3, dwarf: 4 };

const FRAG = /* glsl */ `
precision highp float; precision highp int;
in vec2 vUv;
layout(location = 0) out vec4 oAlbedo;
layout(location = 1) out vec4 oData;
uniform int uKind; uniform vec3 uSeed;
${NOISE}
${UV_TO_DIR}
vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
vec3 hex(float r, float g, float b){ return lin(vec3(r,g,b)/255.); }

// 3D cellular noise → (F1 distance, cell hash)
vec2 cells(vec3 p){
  vec3 i=floor(p), f=fract(p); float d=8.; float id=0.;
  for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++) for(int z=-1;z<=1;z++){
    vec3 g=vec3(x,y,z); vec3 h=fract(sin(vec3(dot(i+g,vec3(127.1,311.7,74.7)),dot(i+g,vec3(269.5,183.3,246.1)),dot(i+g,vec3(113.5,271.9,124.6))))*43758.5453);
    vec3 r=g+h-f; float dd=dot(r,r); if(dd<d){ d=dd; id=h.x; }
  }
  return vec2(sqrt(d), id);
}
float craters(vec3 p){
  float s=0.; float a=1.;
  for(int k=0;k<3;k++){
    vec2 c=cells(p); float r=.25+.25*c.y;
    float bowl=smoothstep(r,0.,c.x); float rim=smoothstep(r*.7,r,c.x)*smoothstep(r*1.35,r,c.x);
    s+=a*(rim*.6-bowl*.8)*step(.45,c.y);
    p*=2.3; a*=.5;
  }
  return s;
}

void main(){
  vec3 dir = uvToDir(vUv);
  vec3 p = dir + uSeed;
  vec3 col = vec3(0.); float h = 0.; float rough = .8; float emit = 0.; float cloud = 0.;
  float lat = abs(dir.y);

  if (uKind == 0) { // ocean world — Calder
    vec3 q = p * 1.5;
    vec3 w = vec3(fbm(q*1.2,4), fbm(q*1.2+5.2,4), fbm(q*1.2+9.1,4));
    float e = fbm(q + w*.6, 8)*.5+.5;
    float sea = .55;
    float iceN = lat + fbm(dir*5.+uSeed,5)*.09 + max(e-sea,0.)*.25;
    float ice = smoothstep(.76, .83, iceN);
    if (e < sea) {
      float depth = (sea - e) / sea;
      col = mix(hex(30.,78.,98.), hex(5.,20.,38.), smoothstep(0., .16, depth));
      col = mix(col, hex(3.,12.,26.), smoothstep(.2,.6,depth));
      rough = .2; h = 0.;
    } else {
      float land = (e - sea) / (1. - sea);
      float r = ridged(q*3.+w, 6);
      col = mix(hex(66.,60.,47.), hex(122.,104.,80.), smoothstep(.0,.35,land));
      col = mix(col, hex(92.,90.,86.), smoothstep(.3,.8,land*.7 + r*.5));
      col = mix(col, hex(150.,134.,108.), smoothstep(0.,.03,land)*(1.-smoothstep(.03,.07,land))*.5);
      rough = .88; h = land*.7 + r*.3*land;
    }
    col = mix(col, hex(222.,232.,238.), ice); rough = mix(rough, .55, ice); h = mix(h, .2, ice);
    vec3 cq = vec3(dir.x, dir.y*2.2, dir.z)*2. + uSeed*1.7;
    vec3 cw = vec3(fbm(cq*.8,3), fbm(cq*.8+3.3,3), 0.);
    float c = fbm(cq + cw*1.4, 7)*.5+.5;
    float band = .55 + .45*cos(dir.y*9.);
    cloud = smoothstep(.5, .78, c*band + .06);
    cloud = max(cloud, smoothstep(.62,.8, fbm(cq*3.+cw,5)*.5+.5)*.6);
    cloud *= 1. - smoothstep(.85,.97,lat)*.6;
  } else if (uKind == 1) { // lava — Ember, tidally locked (sub-stellar point at +x)
    vec3 q = p * 2.;
    float e = fbm(q, 7)*.5+.5;
    float r = ridged(q*2.2 + fbm(q,3), 6);
    float molten = smoothstep(-.3, .7, dir.x);
    col = mix(hex(24.,20.,18.), hex(58.,48.,42.), e);
    float crack = smoothstep(.78, .92, r) ;
    emit = crack * (.35 + molten) + smoothstep(.62,.4,e)*molten*.9;
    col = mix(col, hex(40.,22.,14.), emit*.6);
    h = e*.6 + r*.3; rough = .9;
  } else if (uKind == 2) { // ice — Halden
    vec3 q = p * 1.8;
    float e = fbm(q, 6)*.5+.5;
    float l1 = smoothstep(.93,.99, ridged(q*1.6, 4));
    float l2 = smoothstep(.95,.995, ridged(q*3.4+3., 4));
    col = mix(hex(196.,212.,224.), hex(142.,176.,200.), e);
    col = mix(col, hex(108.,82.,70.), l1*.75);
    col = mix(col, hex(120.,140.,160.), l2*.6);
    h = e*.3 - l1*.3; rough = .55;
  } else if (uKind == 3) { // gas giant — Morrow
    float t = dir.y*5.5 + fbm(dir*vec3(1.5,7.,1.5)+uSeed,5)*.55 + fbm(dir*vec3(5.,26.,5.)+uSeed,4)*.12;
    float b1 = .5+.5*sin(t*3.1); float b2 = .5+.5*sin(t*7.3+1.);
    col = mix(hex(201.,180.,143.), hex(140.,111.,79.), b1);
    col = mix(col, hex(226.,214.,189.), b2*.45);
    col = mix(col, hex(107.,90.,72.), smoothstep(.7,.95,lat)*.7);
    vec3 sp = dir - normalize(vec3(.5,-.32,.8)); float sd = length(sp*vec3(1.,2.4,1.));
    float storm = smoothstep(.16,.04,sd);
    col = mix(col, hex(178.,104.,72.), storm*.8);
    rough = .95; h = 0.;
  } else { // dwarf — Tithe / moons
    vec3 q = p * 2.4;
    float e = fbm(q, 6)*.5+.5;
    float cr = craters(q*1.6);
    col = mix(hex(52.,50.,48.), hex(118.,113.,106.), e*.8 + cr*.25);
    h = e*.4 + cr*.6; rough = .95;
  }
  oAlbedo = vec4(col, cloud);
  oData = vec4(clamp(h*.5+.25,0.,1.), rough, clamp(emit,0.,1.), 1.);
}
`;

export type BakedPlanet = { albedo: THREE.Texture; data: THREE.Texture; dispose: () => void };

/** Queue a progressive bake of a planet's albedo(+clouds) and data(height, roughness, emissive) maps. */
export function bakePlanet(kind: PlanetKind, seed: number, width: number, priority: number, onDone: () => void): BakedPlanet {
  const height = width / 2;
  const target = makeTarget(width, height, 2);
  const r = (n: number) => ((Math.sin(seed * 9301 + n * 49297) * 233280) % 1) * 40;
  const material = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: BAKE_VERT,
    fragmentShader: FRAG,
    uniforms: { uKind: { value: KIND_ID[kind] }, uSeed: { value: new THREE.Vector3(r(1), r(2), r(3)) } },
    depthTest: false,
    depthWrite: false,
  });
  const job = enqueueBake({ priority, target, material, rows: Math.max(16, Math.round(height / 16)), onDone });
  return {
    albedo: target.textures[0],
    data: target.textures[1],
    dispose: () => { cancelBake(job); material.dispose(); target.dispose(); },
  };
}
