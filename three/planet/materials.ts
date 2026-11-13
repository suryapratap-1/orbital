import * as THREE from 'three';

const SURFACE_VERT = /* glsl */ `
varying vec2 vUv; varying vec3 vWorld; varying vec3 vWN; varying vec3 vT; varying vec3 vB;
void main(){
  vUv = uv; vec3 p = normalize(position);
  vec3 T = normalize(vec3(p.z, 0., -p.x) + vec3(1e-5, 0., 0.)); vec3 B = cross(p, T);
  vT = normalize(mat3(modelMatrix) * T); vB = normalize(mat3(modelMatrix) * B);
  vec4 w = modelMatrix * vec4(position, 1.); vWorld = w.xyz;
  vWN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const SURFACE_FRAG = /* glsl */ `
uniform sampler2D uAlbedo; uniform sampler2D uData;
uniform vec3 uSun; uniform vec3 uSunColor; uniform vec3 uAtmo; uniform float uAtmoStrength;
uniform float uTime; uniform float uCloudSpeed; uniform float uBump; uniform vec2 uTexel;
uniform vec3 uEmit; uniform float uExposure;
varying vec2 vUv; varying vec3 vWorld; varying vec3 vWN; varying vec3 vT; varying vec3 vB;

float H(vec2 uv){ return texture2D(uData, uv).r; }
void main(){
  vec4 A = texture2D(uAlbedo, vUv);
  vec4 D = texture2D(uData, vUv);
  // bump from baked height along the sphere's tangent frame (object space)
  float dU = H(vUv + vec2(uTexel.x, 0.)) - H(vUv - vec2(uTexel.x, 0.));
  float dV = H(vUv + vec2(0., uTexel.y)) - H(vUv - vec2(0., uTexel.y));
  vec3 Ng = normalize(vWN);
  vec3 N = normalize(Ng - uBump * (dU * normalize(vT) + dV * normalize(vB)));
  vec3 L = normalize(uSun);
  vec3 V = normalize(cameraPosition - vWorld);

  // clouds drift in longitude; shadow sampled slightly toward the sun
  vec2 cuv = vUv + vec2(uTime * uCloudSpeed, 0.);
  float cloud = texture2D(uAlbedo, cuv).a;
  float shadow = texture2D(uAlbedo, cuv + vec2(.0025, .0015)).a;

  float ndl = dot(N, L); float ndlG = dot(Ng, L);
  float day = smoothstep(-.08, .25, ndlG);
  float diff = max(ndl, 0.) * mix(1., .55, shadow * .8);
  vec3 base = A.rgb;
  // ocean glint
  vec3 Hh = normalize(L + V);
  float rough = D.g;
  float specPow = mix(600., 8., rough);
  float spec = pow(max(dot(Ng, Hh), 0.), specPow) * (1. - rough) * 2.4 * day;
  float fres = pow(1. - max(dot(Ng, V), 0.), 5.);
  vec3 col = base * diff * uSunColor;
  col += uSunColor * spec * (1. - cloud);
  // clouds lit with a soft terminator
  float cl = smoothstep(-.15, .5, ndlG);
  col = mix(col, vec3(.92, .94, .96) * uSunColor * cl, cloud * .92);
  // atmospheric in-scatter on the day side and the warm terminator band
  float term = smoothstep(-.12, .05, ndlG) * (1. - smoothstep(.05, .35, ndlG));
  col += uAtmo * uAtmoStrength * (fres * 1.6 + .05) * day;
  col += vec3(1., .45, .18) * term * uAtmoStrength * .18 * (fres + .2);
  // night side ambient (starlight) + emissive
  col += base * .0035;
  col += uEmit * D.b * (1. - day * .55);
  col *= uExposure;
  gl_FragColor = vec4(col, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function makeSurfaceMaterial(albedo: THREE.Texture | null, data: THREE.Texture | null, o: {
  atmo?: THREE.ColorRepresentation; atmoStrength?: number; cloudSpeed?: number; bump?: number; emit?: THREE.ColorRepresentation; exposure?: number;
} = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: SURFACE_VERT,
    fragmentShader: SURFACE_FRAG,
    uniforms: {
      uAlbedo: { value: albedo },
      uData: { value: data },
      uSun: { value: new THREE.Vector3(1, 0.2, 0.3) },
      uSunColor: { value: new THREE.Color(1.0, 0.96, 0.9).multiplyScalar(1.6) },
      uAtmo: { value: new THREE.Color(o.atmo ?? 0x91c8e8) },
      uAtmoStrength: { value: o.atmoStrength ?? 0.6 },
      uTime: { value: 0 },
      uCloudSpeed: { value: o.cloudSpeed ?? 0.0025 },
      uBump: { value: o.bump ?? 2.2 },
      uTexel: { value: new THREE.Vector2(1 / 1024, 1 / 512) },
      uEmit: { value: new THREE.Color(o.emit ?? 0x000000) },
      uExposure: { value: o.exposure ?? 1 },
    },
  });
}

const ATMO_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vWorld;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vWorld = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w; }`;

const ATMO_FRAG = /* glsl */ `
uniform vec3 uSun; uniform vec3 uColor; uniform float uStrength; uniform float uPower; uniform float uLimb;
varying vec3 vN; varying vec3 vWorld;
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vWorld); vec3 L = normalize(uSun);
  // back faces: 0 at the shell's outer silhouette, uLimb at the planet's limb
  float t = clamp(-dot(V, N) / uLimb, 0., 1.);
  float rim = pow(t, uPower);
  float ndl = dot(N, L);
  float lit = smoothstep(-.3, .5, ndl);
  float termBand = smoothstep(-.4, -.02, ndl) * (1. - smoothstep(-.02, .32, ndl));
  float back = pow(max(dot(-V, L), 0.), 5.);                       // sun behind the planet → forward scatter
  vec3 c = uColor * rim * lit
         + vec3(1., .5, .22) * rim * termBand * .7
         + vec3(1., .86, .66) * pow(t, uPower * .6) * back * termBand * 3.;
  gl_FragColor = vec4(c * uStrength, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor.a = clamp(max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)), 0., 1.);
}`;

/** Back-face shell around the planet, additive: limb glow, warm terminator, and forward scatter when backlit. */
export function makeAtmosphereMaterial(color: THREE.ColorRepresentation = 0x91c8e8, strength = 1.2, power = 2.6, shellRatio = 1.06) {
  return new THREE.ShaderMaterial({
    vertexShader: ATMO_VERT,
    fragmentShader: ATMO_FRAG,
    uniforms: {
      uSun: { value: new THREE.Vector3(1, 0, 0) }, uColor: { value: new THREE.Color(color) }, uStrength: { value: strength },
      uPower: { value: power }, uLimb: { value: Math.sqrt(1 - 1 / (shellRatio * shellRatio)) },
    },
    side: THREE.BackSide,
    ...ADDITIVE,
  });
}

/** Additive light. Shaders write alpha = brightest channel so the transparent canvas stays validly premultiplied over the DOM. */
export const ADDITIVE = {
  transparent: true,
  depthWrite: false,
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.OneFactor,
  blendDstAlpha: THREE.OneFactor,
} as const;
