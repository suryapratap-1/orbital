#!/bin/bash
G=~/.claude/skills/signature-site/scripts/free-gen.sh; D=assets-src/gen
S="documentary photograph, 35mm film grain, muted colour, cinematic, no text, no logo, no watermark"
gen(){ [ -s "$D/$1.jpg" ] && python3 -c "from PIL import Image;Image.open('$D/$1.jpg').verify()" 2>/dev/null && { echo "have $1"; return; }; bash $G $D "$1" "$2, $S" $3; sleep 48; }
gen launch "night rocket launch seen from many kilometres away across dark water, long exposure arc of exhaust lighting low clouds gold" 11
gen hall "vast white clean room, a large silver cylindrical spacecraft module on a stand, tiny distant technicians in white bunny suits, wide angle" 23
gen array "radio telescope dishes in a high desert under the milky way, deep blue night, long exposure" 5
gen limb "thin blue atmosphere line on the curved horizon of a planet at dawn seen from orbit, black space, sun flare on the limb" 17
gen testfire "rocket engine static test fire in a desert at dawn, enormous white steam plume, seen from far away" 31
gen control "dark mission control room, rows of glowing blue screens, empty chairs, soft volumetric light" 41
gen pool "astronaut in a white spacesuit floating in a deep training pool, blue underwater light rays, silhouette" 8
gen cluster "dense star field and faint gold nebula dust seen through a large telescope, deep space astrophotography" 3
gen crew1 "editorial portrait of a woman astronaut in her forties, short grey hair, navy flight suit, dark studio background, soft side light, 85mm" 101
gen crew2 "editorial portrait of a man in his fifties, flight engineer, beard, navy flight suit, dark studio background, soft side light, 85mm" 202
gen crew3 "editorial portrait of a young woman scientist with dark curly hair, navy flight suit, dark studio background, soft side light, 85mm" 303
gen crew4 "editorial portrait of a man in his thirties, physician, close cropped hair, navy flight suit, dark studio background, soft side light, 85mm" 404
echo ALLDONE
