const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const curriculumPath = path.join(root, "assets", "youth_curriculum_specification.md");
const outDir = path.join(root, "assets", "lesson-images");

const W = 1280;
const H = 720;

function parseCurriculum(markdown) {
  const lines = markdown.split(/\r?\n/);
  const modules = [];
  const lessons = [];
  let currentModule = null;
  let currentLesson = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const moduleMatch = line.match(/^### Module (\d+): (.+)$/);
    if (moduleMatch) {
      currentModule = {
        number: Number(moduleMatch[1]),
        title: moduleMatch[2],
        primary: "#f4a51c",
        accent: "#2f76ff",
      };
      modules.push(currentModule);
      continue;
    }

    if (!currentModule) continue;

    const settingsMatch = line.match(/^\* \*\*Module Settings:\*\* Weeks .*? \| Primary: `([^`]+)`.*Accent: `([^`]+)`/);
    if (settingsMatch) {
      currentModule.primary = settingsMatch[1];
      currentModule.accent = settingsMatch[2];
      continue;
    }

    const lessonMatch = line.match(/^#### Week (\d+): (.+)$/);
    if (lessonMatch) {
      currentLesson = {
        week: Number(lessonMatch[1]),
        title: lessonMatch[2],
        primary: currentModule.primary,
        accent: currentModule.accent,
        moduleTitle: currentModule.title,
        assetPrompt: "",
      };
      lessons.push(currentLesson);
      continue;
    }

    const assetMatch = line.match(/^\* \*\*Asset Prompt:\*\* (.*)$/);
    if (assetMatch && currentLesson) currentLesson.assetPrompt = assetMatch[1];
  }

  return lessons;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapWords(text, maxLength = 22) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    if (`${current} ${word}`.trim().length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function baseSvg(lesson, motif) {
  const primary = lesson.primary || "#f4a51c";
  const accent = lesson.accent || "#2f76ff";
  const promptSummary = lesson.assetPrompt.replace(/\.$/, "");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
  <title id="title">Week ${lesson.week}: ${escapeXml(lesson.title)}</title>
  <desc id="desc">${escapeXml(promptSummary)}</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#05060c"/>
      <stop offset="48%" stop-color="#090d1b"/>
      <stop offset="100%" stop-color="#030510"/>
    </linearGradient>
    <radialGradient id="warm" cx="18%" cy="20%" r="70%">
      <stop offset="0%" stop-color="${primary}" stop-opacity=".52"/>
      <stop offset="62%" stop-color="${primary}" stop-opacity=".08"/>
      <stop offset="100%" stop-color="${primary}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cool" cx="82%" cy="62%" r="68%">
      <stop offset="0%" stop-color="${accent}" stop-opacity=".5"/>
      <stop offset="58%" stop-color="${accent}" stop-opacity=".09"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="9" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="22" stdDeviation="24" flood-color="#000000" flood-opacity=".55"/>
    </filter>
    <pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse">
      <path d="M54 0H0V54" fill="none" stroke="#ffffff" stroke-opacity=".055" stroke-width="1"/>
    </pattern>
    <style>
      .line{fill:none;stroke:#f7f4ed;stroke-width:18;stroke-linecap:round;stroke-linejoin:round}
      .thin{fill:none;stroke:#f7f4ed;stroke-width:10;stroke-linecap:round;stroke-linejoin:round}
      .gold{stroke:${primary};fill:none}
      .blue{stroke:${accent};fill:none}
      .fillGold{fill:${primary}}
      .fillBlue{fill:${accent}}
      .soft{opacity:.24}
      .label{font:800 24px Inter,system-ui,sans-serif;letter-spacing:8px;fill:#61a0ff}
      .title{font:900 42px Inter,system-ui,sans-serif;letter-spacing:0;fill:#fff7e7}
      .micro{font:800 18px Inter,system-ui,sans-serif;letter-spacing:5px;fill:#aeb6c9}
    </style>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#warm)"/>
  <rect width="${W}" height="${H}" fill="url(#cool)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <path d="M-80 622C210 548 370 664 642 584c245-72 406-264 718-196" fill="none" stroke="${primary}" stroke-opacity=".16" stroke-width="72"/>
  <path d="M-88 650C245 590 428 676 690 608c230-60 380-224 666-170" fill="none" stroke="${accent}" stroke-opacity=".13" stroke-width="44"/>
  <g filter="url(#softShadow)">${motif}</g>
</svg>`;
}

function starField(count = 34) {
  return Array.from({ length: count }, (_, index) => {
    const x = 610 + ((index * 97) % 560);
    const y = 88 + ((index * 53) % 380);
    const r = 1.3 + (index % 3);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="${0.08 + (index % 5) * 0.04}"/>`;
  }).join("");
}

function motifFor(lesson) {
  const p = lesson.assetPrompt.toLowerCase();
  if (p.includes("smartphone") && p.includes("cross")) return phoneCross();
  if (p.includes("masterpiece")) return masterpiece();
  if (p.includes("temple") && p.includes("heart")) return templeHeart();
  if (p.includes("mask")) return maskPortrait();
  if (p.includes("crown") && p.includes("key") && p.includes("home")) return crownKey();
  if (p.includes("shattering stone block")) return shatteringBlock();
  if (p.includes("submerging")) return calmWater();
  if (p.includes("matchstick flame")) return flameWater();
  if (p.includes("shadow figure")) return shadowBirds();
  if (p.includes("radar")) return radarAnchor();
  if (p.includes("green numbers")) return matrixJournal();
  if (p.includes("keyboard")) return keyboardLeaves();
  if (p.includes("face down")) return phoneLight();
  if (p.includes("neon red") && p.includes("\"x\"")) return paintedX();
  if (p.includes("prism")) return prismCircuit();
  if (p.includes("arrows") && p.includes("sparks")) return arrowsSparks();
  if (p.includes("interlocking") && p.includes("rings")) return ringsShield();
  if (p.includes("kitchen table")) return kitchenTable();
  if (p.includes("fist")) return openHandLeaves();
  if (p.includes("vault doorway")) return vaultBlocks();
  if (p.includes("obsidian") || p.includes("kintsugi")) return kintsugi();
  if (p.includes("dna")) return dnaCathedral();
  if (p.includes("labyrinth")) return labyrinthPath();
  if (p.includes("scroll")) return scrollWaveform();
  if (p.includes("question mark")) return questionScaffold();
  if (p.includes("slab rolled aside")) return stoneRolled();
  if (p.includes("rewind")) return rewindTape();
  if (p.includes("backpack")) return studentFlatlay();
  if (p.includes("dial telephone")) return telephone();
  if (p.includes("audio visualizer")) return visualizerCity();
  if (p.includes("hourglass")) return hourglassMarkers();
  if (p.includes("compass")) return compassHands();
  if (p.includes("warrior")) return teenWarrior();
  if (p.includes("throne crown")) return fusedCrown();
  if (p.includes("palace gate")) return palaceKey();
  if (p.includes("fishing boat")) return boatDawn();
  if (p.includes("ancient names")) return namesCross();
  if (p.includes("red slash")) return redSlash();
  if (p.includes("vape") || p.includes("flask")) return fracturedFlask();
  if (p.includes("white cube")) return whiteCube();
  if (p.includes("barbed wire")) return barbedInfinity();
  if (p.includes("megaphone")) return megaphoneShards();
  if (p.includes("open plain")) return pathwaySun();
  if (p.includes("light bulb")) return bulbSoil();
  if (p.includes("tree root")) return rootsWalls();
  if (p.includes("seed pouches")) return seedPouches();
  if (p.includes("global sphere")) return globeMosaic();
  if (p.includes("pillar blocks")) return pillars();
  if (p.includes("chasm line")) return chasm();
  if (p.includes("stone bridge")) return bridge();
  if (p.includes("dove")) return doveBlueprint();
  if (p.includes("cornerstone")) return cornerstone();
  return abstractEmblem();
}

function phoneCross() { return `${starField()}<rect x="728" y="96" width="264" height="440" rx="42" fill="#070a14" stroke="#f7f4ed" stroke-opacity=".7" stroke-width="10"/><path class="line gold" filter="url(#glow)" d="M860 178v260M770 282h180"/><circle cx="860" cy="484" r="12" fill="#f7f4ed" opacity=".8"/>`; }
function masterpiece() { return `<text x="628" y="180" fill="#ffffff" opacity=".12" font-size="54" font-weight="900">failure outsider rejected</text><path d="M646 236c112-34 278-18 420-64" class="thin gold" filter="url(#glow)"/><text x="610" y="374" fill="#fff7e7" font-size="92" font-weight="950">MASTER</text><text x="664" y="470" fill="#fff7e7" font-size="92" font-weight="950">PIECE</text><path d="M640 406h440" class="thin blue" opacity=".45"/>`; }
function templeHeart() { return `<path d="M692 498V258l178-108 178 108v240" class="thin blue" opacity=".9"/><path d="M742 498V300M806 498V270M934 498V270M998 498V300" class="thin" opacity=".55"/><path d="M870 474s-130-76-130-178c0-48 32-83 76-83 24 0 42 11 54 31 12-20 30-31 54-31 44 0 76 35 76 83 0 102-130 178-130 178Z" fill="#f4a51c" opacity=".24" stroke="#ffd36a" stroke-width="12" filter="url(#glow)"/>`; }
function maskPortrait() { return `<path d="M694 172c118 0 190 72 190 168 0 112-82 174-190 190-88-44-142-102-142-190 0-96 58-168 142-168Z" fill="#f4a51c" opacity=".28" stroke="#ffd36a" stroke-width="10"/><path d="M808 176c122 18 202 82 202 180 0 84-54 142-146 176 22-88 20-250-56-356Z" fill="#f7f4ed" opacity=".12" stroke="#f7f4ed" stroke-width="8"/><path d="M636 336c48-26 104-26 150 0M850 336c42-24 88-22 128 0M740 430c52 34 116 34 170 0" class="thin"/>`; }
function crownKey() { return `<path d="M628 254l86 86 96-158 96 158 86-86-38 206H666l-38-206Z" fill="#f4a51c" opacity=".25" stroke="#ffd36a" stroke-width="12" stroke-linejoin="round" filter="url(#glow)"/><path d="M740 512h280M718 566h228M944 566v52M996 566v52M946 592h78" class="line blue" opacity=".9"/>`; }
function shatteringBlock() { return `<path d="M690 118h352l-52 250H736L690 118Z" fill="#5d6170" opacity=".72" stroke="#f7f4ed" stroke-opacity=".3" stroke-width="8"/><path d="M812 118l-38 114 76 64-34 72M938 118l-62 92 88 86-20 72" class="thin gold" filter="url(#glow)"/><path d="M866 542c-42-58-86-104-142-130h284c-58 26-100 72-142 130Z" fill="#f4a51c" opacity=".52"/>`; }
function calmWater() { return `<path d="M576 274c88-60 172-58 260 0s178 60 266 0v244H576Z" fill="#2f76ff" opacity=".2"/><path d="M568 292c88-60 176-60 264 0s180 60 268 0M568 382c100 34 192 34 292 0s154-34 242 0" class="thin blue"/><path d="M760 180c70 42 102 108 96 196-74-26-118-82-132-168" fill="#f7f4ed" opacity=".15"/><circle cx="858" cy="470" r="82" fill="#f4a51c" opacity=".18" filter="url(#glow)"/>`; }
function flameWater() { return `<path d="M716 528c-120-74-132-188-36-318 8 68 54 92 80 150 34-72 6-132 80-226 96 146 98 306-124 394Z" fill="#dc4e15" opacity=".56" stroke="#ffd36a" stroke-width="10"/><path d="M1000 154s112 132 112 234a112 112 0 0 1-224 0c0-102 112-234 112-234Z" fill="#2f76ff" opacity=".28" stroke="#9fc7ff" stroke-width="12"/><path d="M918 420c54 30 110 30 166 0" class="thin"/>`; }
function shadowBirds() { return `<path d="M716 520c24-156 44-254 118-254s96 98 120 254Z" fill="#000000" opacity=".62"/><path d="M914 250h296v150H914Z" fill="#ffd36a" opacity=".18" filter="url(#glow)"/><path d="M944 294c36-40 70-40 102 0M1014 346c44-44 84-44 122 0M904 404c34-32 66-32 98 0" class="thin gold"/>`; }
function radarAnchor() { return `<circle cx="866" cy="340" r="230" fill="none" stroke="#ffffff" stroke-opacity=".14" stroke-width="8"/><circle cx="866" cy="340" r="148" fill="none" stroke="#ffffff" stroke-opacity=".16" stroke-width="6"/><path d="M636 340c72-84 142-84 212 0s142 84 212 0" class="thin" stroke="#ff4b4b"/><path d="M866 220v252M790 302h152M760 430c70 80 142 80 212 0" class="line" stroke="#50d17d" filter="url(#glow)"/>`; }
function matrixJournal() { return `<text x="620" y="136" fill="#50d17d" opacity=".46" font-size="32" font-weight="800">101001101011010010101101</text><text x="650" y="208" fill="#50d17d" opacity=".28" font-size="32" font-weight="800">011011001010110100111010</text><text x="612" y="280" fill="#50d17d" opacity=".36" font-size="32" font-weight="800">110100101101001010110010</text><path d="M790 360c66-34 138-42 220-24v202c-82-20-154-12-220 24-66-36-138-44-220-24V336c82-18 154-10 220 24Z" fill="#fff7e7" opacity=".13" stroke="#ffd36a" stroke-width="10"/><path d="M790 360v202M624 396h116M840 396h116M624 452h116M840 452h116" class="thin"/>`; }
function keyboardLeaves() { return `<g transform="translate(608 220)"><rect width="480" height="238" rx="18" fill="#f7f4ed" opacity=".12" stroke="#f7f4ed" stroke-opacity=".3" stroke-width="8"/><g fill="#111827" opacity=".8">${Array.from({ length: 24 }, (_, i) => `<rect x="${26 + (i % 8) * 54}" y="${28 + Math.floor(i / 8) * 54}" width="38" height="34" rx="6"/>`).join("")}</g><path d="M170 132c54-74 104-84 152-28-70 4-114 22-152 28ZM248 176c58-56 110-54 154 6-66-14-112-10-154-6Z" fill="#50d17d" opacity=".82"/></g>`; }
function phoneLight() { return `<rect x="682" y="312" width="390" height="170" rx="30" fill="#030510" stroke="#f7f4ed" stroke-opacity=".24" stroke-width="8"/><ellipse cx="878" cy="488" rx="286" ry="92" fill="#ffd36a" opacity=".28" filter="url(#glow)"/><path d="M702 394h350" class="thin" opacity=".22"/>`; }
function paintedX() { return `<path d="M688 194l316 316M1004 194L688 510" class="line" stroke="#ff2e2e" filter="url(#glow)"/><path d="M638 416c154-82 326-118 518-110" class="line" stroke="#f7f4ed" filter="url(#glow)"/><path d="M670 478c118-58 244-82 382-74" class="thin" stroke="#f7f4ed" opacity=".7"/>`; }
function prismCircuit() { return `<path d="M830 146l178 312H652L830 146Z" fill="#ffffff" opacity=".13" stroke="#f7f4ed" stroke-width="10"/><path d="M610 532h520M670 532v-58h70M922 532v-74h96M778 532v-46h64" class="thin blue"/><path d="M830 252c130 34 210 74 284 140M830 252c-88 56-144 100-216 182" class="thin gold" filter="url(#glow)"/>`; }
function arrowsSparks() { return `<path d="M630 452l228-228v116h228v112H858v116L630 452Z" fill="#8c95aa" opacity=".6"/><path d="M1118 452L890 224v116H662v112h228v116l228-116Z" fill="#f4a51c" opacity=".5"/><path d="M872 340l-36 80 72-26-44 102 108-142" class="thin gold" filter="url(#glow)"/>`; }
function ringsShield() { return `<path d="M738 164c-88 110-88 220 0 330 88-110 88-220 0-330Z" class="line blue"/><path d="M954 164c88 110 88 220 0 330-88-110-88-220 0-330Z" class="line gold"/><path d="M846 526c-124-76-184-174-184-292 64 36 126 48 184 36 58 12 120 0 184-36 0 118-60 216-184 292Z" fill="#ffffff" opacity=".08"/>`; }
function kitchenTable() { return `<path d="M664 402h410M714 402l-58 150M1024 402l58 150M746 324h256l72 78H674l72-78Z" class="line gold"/><path d="M860 262c38 52 38 104 0 156M776 292c52 30 78 72 78 126M944 292c-52 30-78 72-78 126" class="thin" opacity=".55"/>`; }
function openHandLeaves() { return `<path d="M692 450c104 38 222 50 354 36 36-4 62 22 38 56-54 56-296 70-470-28" fill="#f7f4ed" opacity=".15" stroke="#f7f4ed" stroke-width="10"/><path d="M718 292c78 94 112 158 102 194M826 274c44 108 56 174 36 214M936 282c-2 106-26 174-72 204" class="thin"/><path d="M972 220c74 34 104 84 90 150-72-20-104-70-90-150ZM766 190c64 46 82 98 54 156-62-32-80-84-54-156Z" fill="#dc4e15" opacity=".72"/>`; }
function vaultBlocks() { return `<path d="M620 210h420v300H620Z" fill="#ffffff" opacity=".09" stroke="#f7f4ed" stroke-opacity=".26" stroke-width="8"/><path d="M1040 210l116 70v300l-116-70Z" fill="#f4a51c" opacity=".28"/><path d="M676 270h300M676 360h300M676 450h300" class="thin"/><path d="M1038 354h78" class="line gold"/>`; }
function kintsugi() { return `<path d="M632 178h452v336H632Z" fill="#05060c" stroke="#5d6170" stroke-width="16"/><path d="M660 238l132 80 86-126 78 172 116-94M706 512l86-194 164 46-30 148M632 394l160-76" class="thin gold" filter="url(#glow)"/><path d="M660 238l-28 156M1072 270l12 244M878 192l-246-14" class="thin" opacity=".18"/>`; }
function dnaCathedral() { return `<path d="M702 154c156 106 156 250 0 356M994 154c-156 106-156 250 0 356" class="thin blue"/><path d="M730 214h236M696 296h304M696 386h304M730 468h236" class="thin" opacity=".45"/><path d="M848 122l142 390H706L848 122Z" fill="none" stroke="#ffd36a" stroke-width="12"/><path d="M848 226v286" class="thin gold"/>`; }
function labyrinthPath() { return `<path d="M640 168h420v360H640V168Zm70 70h280v220H710V238Zm70 70h140v80H780v-80Z" fill="none" stroke="#ffffff" stroke-opacity=".22" stroke-width="22"/><path d="M650 350h430" class="line blue" filter="url(#glow)"/>`; }
function scrollWaveform() { return `<path d="M664 206h360c58 0 86 34 84 84-2 44-32 72-84 72H664c-58 0-86-34-84-84 2-44 32-72 84-72Z" fill="#fff7e7" opacity=".16" stroke="#ffd36a" stroke-width="10"/><path d="M664 362h360c58 0 86 34 84 84-2 44-32 72-84 72H664" fill="none" stroke="#ffd36a" stroke-width="10"/><path d="M676 432c28 0 28-78 56-78s28 118 56 118 28-84 56-84 28 44 56 44 28-108 56-108 28 120 56 120" class="thin blue" filter="url(#glow)"/>`; }
function questionScaffold() { return `<path d="M764 252c10-86 70-134 162-134 90 0 152 52 152 128 0 72-54 108-112 140-48 26-66 52-66 102" class="line gold"/><path d="M896 590h.1" class="line gold"/><path d="M710 238h398M756 356h294M842 488h128M782 180l226 354M1060 192L792 520" class="thin" opacity=".4"/>`; }
function stoneRolled() { return `<rect x="646" y="326" width="514" height="98" rx="2" fill="#ffffff" filter="url(#glow)"/><circle cx="720" cy="326" r="112" fill="#444856" stroke="#f7f4ed" stroke-opacity=".26" stroke-width="10"/><rect x="762" y="218" width="350" height="208" fill="#000000" opacity=".56"/>`; }
function rewindTape() { return `<rect x="630" y="190" width="500" height="310" rx="28" fill="#111827" stroke="#f7f4ed" stroke-opacity=".36" stroke-width="10"/><circle cx="760" cy="344" r="74" fill="none" stroke="#f7f4ed" stroke-opacity=".35" stroke-width="18"/><circle cx="1000" cy="344" r="74" fill="none" stroke="#f7f4ed" stroke-opacity=".35" stroke-width="18"/><path d="M900 342l-84-62v124l84-62Zm-92 0-84-62v124l84-62Z" fill="#50d17d" filter="url(#glow)"/><text x="762" y="466" fill="#50d17d" font-size="54" font-weight="950">REWIND</text>`; }
function studentFlatlay() { return `<rect x="646" y="162" width="154" height="228" rx="22" fill="#2f76ff" opacity=".42"/><path d="M686 162v-44h74v44" class="thin blue"/><path d="M856 196h190v250H856Z" fill="#fff7e7" opacity=".18" stroke="#ffd36a" stroke-width="10"/><path d="M896 264h110M896 316h110M896 368h110" class="thin"/><path d="M690 500c52-62 116-62 168 0M952 500c52-62 116-62 168 0" class="line gold"/>`; }
function telephone() { return `<path d="M740 210c106-70 220-70 326 0l-52 96c-66-34-138-34-204 0l-70-96Z" fill="none" stroke="#ffd36a" stroke-width="20" stroke-linejoin="round" filter="url(#glow)"/><path d="M850 332c-54 42-92 96-112 162h304c-20-66-58-120-112-162H850Z" fill="#f4a51c" opacity=".18" stroke="#ffd36a" stroke-width="12"/><circle cx="890" cy="424" r="54" fill="none" stroke="#f7f4ed" stroke-opacity=".42" stroke-width="8"/>`; }
function visualizerCity() { return `<g fill="#2f76ff" opacity=".52">${[64,126,92,174,112,210,146,86,190,124].map((h,i)=>`<rect x="${640+i*48}" y="${500-h}" width="30" height="${h}" rx="4"/>`).join("")}</g><path d="M628 424c60-120 120-120 180 0s120 120 180 0 120-120 180 0" class="thin gold" filter="url(#glow)"/><path d="M638 500h500" class="thin"/>`; }
function hourglassMarkers() { return `<path d="M742 150h300M742 550h300M800 150c0 126 62 150 118 200-56 50-118 74-118 200M984 150c0 126-62 150-118 200 56 50 118 74 118 200" class="line gold"/><circle cx="872" cy="286" r="16" fill="#2f76ff"/><circle cx="920" cy="332" r="14" fill="#f4a51c"/><circle cx="850" cy="396" r="12" fill="#ffffff" opacity=".8"/>`; }
function compassHands() { return `<circle cx="904" cy="340" r="126" fill="#f4a51c" opacity=".18" stroke="#ffd36a" stroke-width="12"/><path d="M904 224l48 144-144 88 48-144 48-88Z" fill="#ffd36a" filter="url(#glow)"/><path d="M620 480c96-74 176-82 240-24M1150 236c-92 36-152 88-180 156" class="line" opacity=".6"/>`; }
function teenWarrior() { return `<path d="M860 532c-34-136-24-238 36-306 80 78 118 180 114 306Z" fill="#dc4e15" opacity=".42" filter="url(#glow)"/><circle cx="804" cy="280" r="54" fill="#f7f4ed" opacity=".2"/><path d="M804 334v170M740 396h128M748 504h112" class="line"/><path d="M916 248l92 106 84-106M1008 354v178" class="thin gold"/>`; }
function fusedCrown() { return `<path d="M662 254l94 98 98-176 96 176 96-98-48 224H710l-48-224Z" fill="#3b414f" stroke="#f7f4ed" stroke-opacity=".28" stroke-width="12"/><path d="M710 478l114-126 78 50 96-148M854 176l48 226" class="thin gold" filter="url(#glow)"/>`; }
function palaceKey() { return `<path d="M670 540V262l96-84 96 84v278M862 540V238l96-96 96 96v302" class="thin"/><path d="M636 540h500" class="line"/><circle cx="838" cy="408" r="62" fill="none" stroke="#ffd36a" stroke-width="18" filter="url(#glow)"/><path d="M900 408h188M1038 408v54M1084 408v38" class="line gold"/>`; }
function boatDawn() { return `<ellipse cx="888" cy="438" rx="280" ry="90" fill="#ffd36a" opacity=".18" filter="url(#glow)"/><path d="M638 438h500M710 438c54 84 270 84 352 0H710Z" fill="#151923" stroke="#ffd36a" stroke-width="10"/><path d="M888 206v232M888 226l156 150H888" class="thin"/><path d="M636 360c118-44 218-44 300 0s152 44 220 0" class="thin blue" opacity=".5"/>`; }
function namesCross() { return `<text x="620" y="172" fill="#ffffff" opacity=".16" font-size="24">Abraham Ruth Esther Isaiah Peter Mary Paul John</text><text x="650" y="238" fill="#ffffff" opacity=".13" font-size="24">Moses David Deborah Daniel Lydia James Timothy</text><path d="M872 132v408M718 288h308" class="line gold" filter="url(#glow)"/><text x="606" y="434" fill="#ffffff" opacity=".11" font-size="24">Sarah Joseph Samuel Hannah Matthew Mark Luke</text>`; }
function redSlash() { return `<rect x="606" y="150" width="540" height="390" fill="#2b2f3a" opacity=".4"/><path d="M1110 132L648 560" stroke="#ff2e2e" stroke-width="64" stroke-linecap="round" filter="url(#glow)"/><path d="M630 214h500M630 312h500M630 410h500" class="thin" opacity=".14"/>`; }
function fracturedFlask() { return `<path d="M820 142h132v106l126 250H694l126-250V142Z" fill="#ffffff" opacity=".08" stroke="#f7f4ed" stroke-width="12"/><path d="M760 426h250M820 248h132" class="thin blue"/><path d="M888 290l-72 98 112 40-58 94M1008 318l86-66M1018 424l118 28" class="thin" stroke="#ff2e9a"/>`; }
function whiteCube() { return `<path d="M878 190l180 104v208L878 606 698 502V294l180-104Z" fill="#ffffff" opacity=".78"/><path d="M878 190v208M698 294l180 104 180-104M878 398v208" fill="none" stroke="#111827" stroke-opacity=".36" stroke-width="10"/><ellipse cx="878" cy="616" rx="230" ry="44" fill="#000000" opacity=".42"/>`; }
function barbedInfinity() { return `<path d="M650 360c82-130 174-130 276 0s194 130 276 0c-82-130-174-130-276 0S732 490 650 360Z" fill="none" stroke="#b91c1c" stroke-width="24"/><path d="M678 328l-46-28M746 408l-54 34M1004 310l42-42M1080 412l54 34" class="thin"/>`; }
function megaphoneShards() { return `<path d="M646 344h108l228-128v288L754 376H646Z" fill="#f7f4ed" opacity=".18" stroke="#ffd36a" stroke-width="12"/><path d="M1016 282l100-68-52 112 116 28-118 42 60 106-108-68" class="line blue" filter="url(#glow)"/>`; }
function pathwaySun() { return `<circle cx="908" cy="238" r="112" fill="#ffd36a" opacity=".45" filter="url(#glow)"/><path d="M592 540c142-164 312-240 610-270" class="thin" stroke="#50d17d" opacity=".48"/><path d="M812 650l68-244 68 244" fill="#7c4a20" opacity=".7"/><path d="M590 546h610" class="thin blue" opacity=".32"/>`; }
function bulbSoil() { return `<ellipse cx="884" cy="548" rx="270" ry="64" fill="#5b3417" opacity=".72"/><path d="M800 308a84 84 0 1 1 168 0c0 58-40 84-56 126h-56c-16-42-56-68-56-126Z" fill="#fff7e7" opacity=".18" stroke="#ffd36a" stroke-width="12"/><path d="M852 478h64M858 520h52M884 434c-26-92 20-154 92-186M884 434c22-86-14-138-84-160" class="thin" stroke="#50d17d" filter="url(#glow)"/>`; }
function rootsWalls() { return `<rect x="642" y="230" width="208" height="260" fill="#616575" opacity=".52"/><rect x="924" y="230" width="208" height="260" fill="#616575" opacity=".52"/><path d="M872 522c-20-92 26-166 142-222M872 522c-68-70-146-90-234-60M872 522c52-54 118-74 198-60" class="thin" stroke="#50d17d" filter="url(#glow)"/>`; }
function seedPouches() { return `<rect x="650" y="296" width="132" height="188" rx="14" fill="#8b5a2b" opacity=".76"/><rect x="812" y="270" width="156" height="220" rx="14" fill="#b7791f" opacity=".78"/><rect x="998" y="296" width="132" height="188" rx="14" fill="#8b5a2b" opacity=".76"/><path d="M892 270c-48-106-26-178 68-218M892 270c10-126 64-204 162-234M892 270c46-96 120-138 222-126" class="thin gold" filter="url(#glow)"/>`; }
function globeMosaic() { return `<circle cx="884" cy="350" r="208" fill="#8b5a2b" opacity=".44" stroke="#ffd36a" stroke-width="10"/><path d="M676 350h416M884 142c-72 70-108 140-108 208s36 138 108 208M884 142c72 70 108 140 108 208s-36 138-108 208" class="thin" opacity=".5"/><path d="M780 260l72-28 80 54 96-18 48 86-94 64 28 82-124 20-62-64-96 34-62-86 54-72Z" fill="#50d17d" opacity=".34"/>`; }
function pillars() { return `<g fill="#ffffff" opacity=".66">${[0,1,2,3,4].map((i)=>`<rect x="${662+i*92}" y="${188-i*28}" width="64" height="${342+i*28}" rx="4"/>`).join("")}</g><path d="M622 532h560" class="line blue" opacity=".55"/><path d="M662 188h432" class="thin gold" filter="url(#glow)"/>`; }
function chasm() { return `<rect x="622" y="186" width="530" height="330" fill="#5d6170" opacity=".42"/><path d="M884 142l-72 134 90 72-104 214" fill="none" stroke="#ff2e2e" stroke-width="42" stroke-linecap="round" filter="url(#glow)"/><path d="M622 286h202M944 286h208M622 404h164M936 404h216" class="thin" opacity=".24"/>`; }
function bridge() { return `<path d="M612 410h218l84-92h238v122H920l-84 92H612V410Z" fill="#747987" opacity=".7" stroke="#f7f4ed" stroke-opacity=".28" stroke-width="10"/><path d="M600 560c160-112 360-112 600 0" class="thin blue" opacity=".35"/><path d="M830 410h90" class="line gold" filter="url(#glow)"/>`; }
function doveBlueprint() { return `<rect x="632" y="150" width="500" height="390" fill="#2f76ff" opacity=".08" stroke="#61a0ff" stroke-width="6"/><path d="M674 390c122-22 196-90 222-204 32 92 100 152 204 180-80 20-142 12-188-24-10 92-70 146-180 162 40-36 54-74 42-114-32 18-66 18-100 0Z" fill="none" stroke="#f7f4ed" stroke-width="12" filter="url(#glow)"/><path d="M632 240h500M632 330h500M632 420h500M732 150v390M932 150v390" class="thin blue" opacity=".28"/>`; }
function cornerstone() { return `<path d="M676 386h420v140H676Z" fill="#ffffff" opacity=".78" stroke="#ffd36a" stroke-width="10" filter="url(#glow)"/><path d="M726 246h320v140H726Z" fill="#ffffff" opacity=".28" stroke="#f7f4ed" stroke-opacity=".42" stroke-width="8"/><path d="M626 560c160-78 340-78 540 0" class="thin" opacity=".22"/><circle cx="742" cy="584" r="18" fill="#777"/><circle cx="1038" cy="590" r="14" fill="#777"/>`; }
function abstractEmblem() { return `<circle cx="884" cy="344" r="190" fill="#ffffff" opacity=".08" stroke="#ffd36a" stroke-width="12"/><path d="M884 166v356M706 344h356" class="line gold" filter="url(#glow)"/><circle cx="884" cy="344" r="86" fill="#2f76ff" opacity=".16"/>`; }

fs.mkdirSync(outDir, { recursive: true });
const lessons = parseCurriculum(fs.readFileSync(curriculumPath, "utf8"));

for (const lesson of lessons) {
  const filename = `week-${String(lesson.week).padStart(2, "0")}.svg`;
  fs.writeFileSync(path.join(outDir, filename), baseSvg(lesson, motifFor(lesson)));
}

console.log(`Generated ${lessons.length} lesson images in ${path.relative(root, outDir)}`);
