/**
 * dev-scene.js — the 3D developer workspace.
 *
 * Everything here is built from Three.js primitives (no .glb needed), so the
 * site works out of the box. The character is a STYLIZED likeness of Lianghok
 * (black swept hair, black button-up shirt) — not a photo-scan. See README
 * "3D hero" section for how to swap in a real rigged .glb later.
 *
 * Exports:
 *   createWorkspace(THREE, canvas) -> { update(dt, t), resize(w, h), render(), dispose() }
 */

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (x) => x * x * (3 - 2 * x);

export function createWorkspace(THREE, canvas, opts = {}) {
  const { lowPower = false } = opts;

  /* ---------- Renderer / scene / camera ---------- */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !lowPower,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x070b18, 9, 18);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  // Three-quarter view from the character's right side so face, hands,
  // keyboard and the (angled) monitor are all visible.
  const CAM_TARGET = new THREE.Vector3(0.2, 1.0, 0.55);
  const CAM_BASE = new THREE.Vector3(4.9, 2.95, 3.0);
  camera.position.copy(CAM_BASE);
  camera.lookAt(CAM_TARGET);

  /* ---------- Materials ---------- */
  const std = (color, rough = 0.7, metal = 0, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });

  const M = {
    skin: std(0xe0a283, 0.65, 0, { emissive: 0xdba08a, emissiveIntensity: 0.5 }),
    skinDark: std(0xd18f72, 0.7, 0, { emissive: 0xc98a70, emissiveIntensity: 0.4 }),
    hair: std(0x0c0c12, 0.45),
    shirt: std(0x1a1e2b, 0.8),
    tie: std(0xb52c3b, 0.5),
    pants: std(0x1a2136, 0.85),
    shoe: std(0x0d0f16, 0.5),
    eye: new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 0.2 }),
    brow: std(0x0a0a0e, 0.8),
    lip: std(0xb86e5e, 0.6),
    chair: std(0x1b2133, 0.6),
    chairAccent: std(0x0891b2, 0.4, 0.1, { emissive: 0x06b6d4, emissiveIntensity: 0.35 }),
    metal: std(0x8a94a8, 0.35, 0.8),
    desk: std(0x232a3d, 0.55),
    deskGlow: new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
    device: std(0x10141f, 0.5, 0.3),
    keyCap: std(0x1d2436, 0.5),
    floor: std(0x0b1020, 0.9),
    wall: std(0x0e1428, 0.95),
    plant: std(0x1f9d6b, 0.8),
    pot: std(0xe5e7eb, 0.7),
  };

  const mesh = (geo, mat, parent, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (parent) parent.add(m);
    return m;
  };
  const box = (w, h, d, mat, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z);

  /* ---------- Lighting (cheap: no shadow maps) ---------- */
  scene.add(new THREE.HemisphereLight(0x8fb4ff, 0x0a0f1e, 0.55));

  const key = new THREE.DirectionalLight(0xdbe8ff, 1.05);
  key.position.set(3, 5, 4);
  scene.add(key);

  const rimBlue = new THREE.PointLight(0x3b82f6, 14, 9, 2);
  rimBlue.position.set(-2.6, 2.4, -1.2);
  scene.add(rimBlue);

  const rimCyan = new THREE.PointLight(0x06b6d4, 10, 8, 2);
  rimCyan.position.set(2.2, 1.6, -1.8);
  scene.add(rimCyan);

  const screenLight = new THREE.PointLight(0x60a5fa, 3.2, 3.2, 2);
  screenLight.position.set(0.12, 1.25, 0.6);
  scene.add(screenLight);

  const purpleFill = new THREE.PointLight(0x8b5cf6, 5, 7, 2);
  purpleFill.position.set(-2, 0.8, 2.5);
  scene.add(purpleFill);

  /* ---------- Room: floor, back wall, LED strip ---------- */
  const room = new THREE.Group();
  scene.add(room);

  const floor = mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.1, 64), M.floor, room, 0.2, -0.05, 0.6);
  const ring = mesh(
    new THREE.TorusGeometry(3.6, 0.018, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
    room, 0.2, 0.002, 0.6
  );
  ring.rotation.x = Math.PI / 2;

  const grid = new THREE.GridHelper(7.2, 24, 0x1e3a5f, 0x13213c);
  grid.position.set(0.2, 0.006, 0.6);
  grid.material.transparent = true;
  grid.material.opacity = 0.45;
  room.add(grid);

  // Back wall (behind desk)
  const wall = box(6.4, 3.2, 0.1, M.wall, room, 0.2, 1.6, -1.55);
  box(6.0, 0.03, 0.02, M.deskGlow, room, 0.2, 2.35, -1.48); // LED strip
  box(6.0, 0.03, 0.02, new THREE.MeshBasicMaterial({ color: 0x8b5cf6 }), room, 0.2, 0.9, -1.48);

  /* ---------- Desk ---------- */
  const desk = new THREE.Group();
  scene.add(desk);
  box(2.5, 0.05, 0.85, M.desk, desk, 0.1, 0.76, 0.75);
  box(2.5, 0.012, 0.02, M.deskGlow, desk, 0.1, 0.745, 1.18); // front LED edge
  [[-1.1, 0.4], [1.3, 0.4], [-1.1, 1.1], [1.3, 1.1]].forEach(([x, z]) =>
    box(0.06, 0.75, 0.06, M.metal, desk, x, 0.375, z)
  );

  /* ---------- Monitor (screen = animated canvas texture) ---------- */
  const monitor = new THREE.Group();
  monitor.position.set(0.12, 0.785, 0.98);
  // Angled toward the camera so the code is readable in the 3/4 view.
  monitor.rotation.y = Math.PI - 0.95; // ~55 deg toward the camera, still readable from the chair
  scene.add(monitor);

  box(0.34, 0.02, 0.22, M.metal, monitor, 0, 0.01, 0);
  box(0.06, 0.34, 0.04, M.metal, monitor, 0, 0.18, -0.03);
  box(1.12, 0.64, 0.05, M.device, monitor, 0, 0.62, 0);

  const codeCanvas = document.createElement("canvas");
  codeCanvas.width = 768;
  codeCanvas.height = 432;
  const cctx = codeCanvas.getContext("2d");
  const screenTex = new THREE.CanvasTexture(codeCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = 4;
  const screen = mesh(
    new THREE.PlaneGeometry(1.06, 0.58),
    new THREE.MeshBasicMaterial({ map: screenTex }),
    monitor, 0, 0.62, 0.028
  );

  // Real Python-ish snippet (tokenized for syntax colors)
  const CODE = [
    "from flask import Flask, jsonify",
    "",
    "app = Flask(__name__)",
    "",
    "class Developer:",
    "    def __init__(self, name):",
    "        self.name = name",
    "        self.skills = ['Python', 'Flask']",
    "",
    "    def build(self, idea):",
    "        # turn ideas into working apps",
    "        return f'{idea} -> shipped!'",
    "",
    "me = Developer('Lianghok')",
    "",
    "@app.route('/api/hello')",
    "def hello():",
    "    msg = me.build('portfolio')",
    "    return jsonify(message=msg)",
    "",
    "if __name__ == '__main__':",
    "    app.run(debug=True)",
  ];
  const KEYWORDS = new Set(["from", "import", "class", "def", "return", "if", "self"]);
  const COLORS = { kw: "#c792ea", str: "#c3e88d", com: "#5c6b8a", fn: "#82aaff", def: "#e2e8f0", num: "#f78c6c", dec: "#ffcb6b" };

  function drawLine(line, x, y) {
    if (line.trim().startsWith("#")) { cctx.fillStyle = COLORS.com; cctx.fillText(line, x, y); return; }
    if (line.trim().startsWith("@")) { cctx.fillStyle = COLORS.dec; cctx.fillText(line, x, y); return; }
    const tokens = line.match(/(\s+|'[^']*'|f'[^']*'|[A-Za-z_][A-Za-z0-9_]*|\d+|.)/g) || [];
    let cx = x;
    for (const tk of tokens) {
      let c = COLORS.def;
      if (/^f?'/.test(tk)) c = COLORS.str;
      else if (KEYWORDS.has(tk)) c = COLORS.kw;
      else if (/^\d+$/.test(tk)) c = COLORS.num;
      else if (/^[A-Za-z_]/.test(tk) && line.includes(tk + "(")) c = COLORS.fn;
      cctx.fillStyle = c;
      cctx.fillText(tk, cx, y);
      cx += cctx.measureText(tk).width;
    }
  }

  let typedChars = 0;
  const TOTAL_CHARS = CODE.reduce((n, l) => n + l.length + 1, 0);
  function drawScreen(t) {
    const W = codeCanvas.width, H = codeCanvas.height;
    cctx.fillStyle = "#0b1220";
    cctx.fillRect(0, 0, W, H);
    // title bar
    cctx.fillStyle = "#111a2e"; cctx.fillRect(0, 0, W, 34);
    ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => { cctx.fillStyle = c; cctx.beginPath(); cctx.arc(20 + i * 22, 17, 6, 0, 6.283); cctx.fill(); });
    cctx.font = "600 15px monospace"; cctx.fillStyle = "#64748b"; cctx.fillText("portfolio / app.py", 96, 22);
    // gutter
    cctx.fillStyle = "#0e1628"; cctx.fillRect(0, 34, 52, H - 34);

    cctx.font = "500 17px 'Courier New', monospace";
    const lh = 24, top = 62;
    // Reveal text progressively, then loop; scroll when beyond visible lines.
    let remaining = Math.floor(typedChars);
    const visibleLines = Math.floor((H - top) / lh);
    let shown = [];
    for (let i = 0; i < CODE.length && remaining > 0; i++) {
      const take = Math.min(CODE[i].length, remaining);
      shown.push(CODE[i].slice(0, take));
      remaining -= CODE[i].length + 1;
    }
    const first = Math.max(0, shown.length - visibleLines);
    for (let i = first; i < shown.length; i++) {
      const y = top + (i - first) * lh;
      cctx.fillStyle = "#3b4a6b"; cctx.textAlign = "right"; cctx.fillText(String(i + 1), 40, y); cctx.textAlign = "left";
      drawLine(shown[i], 66, y);
    }
    // blinking caret
    if (Math.floor(t * 2) % 2 === 0 && shown.length) {
      const li = shown.length - 1 - first;
      const w = cctx.measureText(shown[shown.length - 1]).width;
      cctx.fillStyle = "#22d3ee"; cctx.fillRect(66 + w + 1, top + li * lh - 16, 9, 20);
    }
    screenTex.needsUpdate = true;
  }

  /* ---------- Keyboard + mouse ---------- */
  const kb = new THREE.Group();
  kb.position.set(0.02, 0.785, 0.52);
  scene.add(kb);
  box(0.56, 0.025, 0.2, M.device, kb, 0, 0.0125, 0);
  const KEY_ROWS = 4, KEY_COLS = 13;
  const keyMesh = [];
  const keyGeo = new THREE.BoxGeometry(0.036, 0.014, 0.036);
  for (let r = 0; r < KEY_ROWS; r++) {
    for (let c = 0; c < KEY_COLS; c++) {
      const k = mesh(keyGeo, M.keyCap, kb, -0.225 + c * 0.0375, 0.032, -0.07 + r * 0.045);
      keyMesh.push(k);
    }
  }
  const mouse = new THREE.Group();
  mouse.position.set(0.5, 0.785, 0.52);
  scene.add(mouse);
  const mouseBody = mesh(new THREE.SphereGeometry(0.04, 16, 12), M.device, mouse, 0, 0.018, 0);
  mouseBody.scale.set(0.8, 0.5, 1.25);
  box(0.4, 0.004, 0.32, std(0x0b1020, 0.9), mouse, 0, 0.003, 0); // mousepad

  /* ---------- Desk props: lamp + plant ---------- */
  const lamp = new THREE.Group();
  lamp.position.set(-0.95, 0.785, 0.9);
  scene.add(lamp);
  mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.03, 20), M.metal, lamp, 0, 0.015, 0);
  const lampArm = box(0.025, 0.42, 0.025, M.metal, lamp, 0, 0.24, 0);
  lampArm.rotation.z = 0.12;
  const lampHead = mesh(new THREE.ConeGeometry(0.1, 0.12, 20, 1, true), std(0x0891b2, 0.4, 0.3, { side: THREE.DoubleSide }), lamp, 0.08, 0.47, 0);
  lampHead.rotation.z = -0.5;
  const lampBulb = mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }), lamp, 0.09, 0.45, 0);

  const plant = new THREE.Group();
  plant.position.set(1.1, 0.785, 0.95);
  scene.add(plant);
  mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.1, 16), M.pot, plant, 0, 0.05, 0);
  const leaves = [];
  for (let i = 0; i < 7; i++) {
    const l = mesh(new THREE.SphereGeometry(0.05, 10, 8), M.plant, plant, 0, 0.16, 0);
    l.scale.set(0.5, 1.5, 0.3);
    l.rotation.set(0.35, (i / 7) * Math.PI * 2, 0.5);
    l.position.set(Math.sin((i / 7) * 6.283) * 0.04, 0.17, Math.cos((i / 7) * 6.283) * 0.04);
    leaves.push(l);
  }

  /* ---------- Chair ---------- */
  const chair = new THREE.Group();
  chair.position.set(0, 0, 0.05);
  scene.add(chair);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leg = box(0.34, 0.025, 0.045, M.chair, chair, Math.cos(a) * 0.17, 0.09, Math.sin(a) * 0.17);
    leg.rotation.y = -a;
    mesh(new THREE.SphereGeometry(0.03, 10, 8), M.shoe, chair, Math.cos(a) * 0.33, 0.04, Math.sin(a) * 0.33);
  }
  mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.34, 12), M.metal, chair, 0, 0.27, 0);
  const seat = mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.08, 32), M.chair, chair, 0, 0.47, 0.02);
  seat.scale.set(1, 1, 1.05);
  mesh(new THREE.TorusGeometry(0.29, 0.012, 8, 40), M.chairAccent, chair, 0, 0.51, 0.02).rotation.x = Math.PI / 2;
  const back = box(0.5, 0.62, 0.07, M.chair, chair, 0, 0.88, -0.27);
  back.rotation.x = -0.12;
  box(0.44, 0.04, 0.075, M.chairAccent, chair, 0, 1.12, -0.285).rotation.x = -0.12;
  [-0.3, 0.3].forEach((x) => {
    box(0.04, 0.2, 0.04, M.chair, chair, x, 0.62, 0.0);
    box(0.06, 0.03, 0.3, M.chair, chair, x, 0.73, 0.06);
  });

  /* ================================================================ */
  /* CHARACTER                                                        */
  /* ================================================================ */
  const character = new THREE.Group();
  character.position.set(0, 0, 0.05);
  scene.add(character);

  // limb helper: capsule hanging along local -Y from its pivot
  const limb = (radius, length, mat, parent) => {
    const g = new THREE.Group();
    const m = mesh(new THREE.CapsuleGeometry(radius, Math.max(0.001, length - radius * 2), 6, 12), mat, g, 0, -length / 2, 0);
    parent.add(g);
    return g;
  };

  /* --- Torso (breathing group) --- */
  const torso = new THREE.Group();
  torso.position.set(0, 0.55, 0.0);
  character.add(torso);

  const chest = mesh(new THREE.CapsuleGeometry(0.235, 0.34, 8, 20), M.shirt, torso, 0, 0.36, 0);
  chest.scale.set(1.1, 1, 0.72);
  const belly = mesh(new THREE.CapsuleGeometry(0.21, 0.12, 8, 16), M.shirt, torso, 0, 0.1, 0.01);
  belly.scale.set(1.05, 1, 0.75);
  // shoulders
  [-1, 1].forEach((s) => mesh(new THREE.SphereGeometry(0.095, 16, 12), M.shirt, torso, s * 0.3, 0.6, 0));

  // collar + tie
  [-1, 1].forEach((s) => {
    const col = box(0.1, 0.07, 0.03, M.shirt, torso, s * 0.055, 0.735, 0.145);
    col.rotation.set(0.5, 0, -s * 0.55);
  });
  const knot = box(0.06, 0.05, 0.03, M.tie, torso, 0, 0.7, 0.172);
  knot.visible = false; // current photo: open-collar black shirt, no tie
  const tieShape = new THREE.Shape();
  tieShape.moveTo(-0.032, 0); tieShape.lineTo(0.032, 0); tieShape.lineTo(0.05, -0.2);
  tieShape.lineTo(0, -0.27); tieShape.lineTo(-0.05, -0.2); tieShape.closePath();
  const tie = mesh(new THREE.ExtrudeGeometry(tieShape, { depth: 0.012, bevelEnabled: false }), M.tie, torso, 0, 0.68, 0.18);
  tie.rotation.x = 0.06;
  tie.visible = false;
  // buttons
  for (let i = 0; i < 3; i++) mesh(new THREE.SphereGeometry(0.01, 8, 6), std(0x3a4154, 0.4), torso, 0.0, 0.5 - i * 0.14, 0.17 - i * 0.002);

  /* --- Neck + head (head pivot for look/nod) --- */
  const neck = mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.14, 16), M.skin, torso, 0, 0.8, 0.01);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.86, 0.02);
  torso.add(headPivot);

  const head = new THREE.Group();
  head.position.set(0, 0.17, 0.0);
  headPivot.add(head);

  const skull = mesh(new THREE.SphereGeometry(0.19, 40, 32), M.skin, head);
  skull.scale.set(0.9, 1.08, 0.98);
  const jaw = mesh(new THREE.SphereGeometry(0.15, 28, 20), M.skin, head, 0, -0.08, 0.025);
  jaw.scale.set(0.92, 0.95, 0.9);
  // ears
  [-1, 1].forEach((s) => {
    const ear = mesh(new THREE.SphereGeometry(0.04, 14, 12), M.skinDark, head, s * 0.176, -0.005, 0.0);
    ear.scale.set(0.55, 1.35, 0.95);
    ear.rotation.z = s * -0.12;
  });

  /* ---- Face ----
   * FALLBACK: a simple drawn face (procFace). It shows until the portrait texture
   * loads; if the texture fails to load it simply stays.
   * PHOTO FACE: your portrait (face-texture.png) is projected straight onto the front
   * of the head, so eyes, brows, nose and mouth are really yours.
   */
  const procFace = new THREE.Group();
  head.add(procFace);
  const eyes = [];
  [-1, 1].forEach((sd) => {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(sd * 0.068, 0.02, 0.165);
    procFace.add(eyeGroup);
    const ball = mesh(new THREE.SphereGeometry(0.02, 14, 12), M.eye, eyeGroup);
    ball.scale.set(1, 0.85, 0.5);
    mesh(new THREE.SphereGeometry(0.005, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), eyeGroup, 0.006, 0.006, 0.008);
    eyes.push(eyeGroup);
    const brow = box(0.062, 0.011, 0.012, M.brow, procFace, sd * 0.07, 0.07, 0.17);
    brow.rotation.z = -sd * 0.08;
  });
  mesh(new THREE.SphereGeometry(0.028, 14, 12), M.skin, procFace, 0, -0.03, 0.18).scale.set(0.9, 1.1, 1);
  box(0.07, 0.01, 0.01, M.lip, procFace, 0, -0.095, 0.168);

  // Head surface = union of the skull and jaw ellipsoids (must match the meshes above).
  const ELL = [
    { cx: 0, cy: 0, cz: 0, rx: 0.19 * 0.9, ry: 0.19 * 1.08, rz: 0.19 * 0.98 },       // skull
    { cx: 0, cy: -0.08, cz: 0.025, rx: 0.15 * 0.92, ry: 0.15 * 0.95, rz: 0.15 * 0.9 }, // jaw
  ];
  const surfaceZ = (x, y) => {
    let z = -1;
    for (const e of ELL) {
      const q = 1 - ((x - e.cx) / e.rx) ** 2 - ((y - e.cy) / e.ry) ** 2;
      if (q > 0) z = Math.max(z, e.cz + e.rz * Math.sqrt(q));
    }
    return z; // -1 = outside the head (hidden behind it, alpha is ~0 there anyway)
  };
  // Photo -> head mapping (measured from profile.jpg): 0.00129 m per pixel.
  const FX0 = -0.171, FX1 = 0.171, FY0 = -0.228, FY1 = 0.115;
  const faceUV = (x, y) => [(x - FX0) / (FX1 - FX0), (y - FY0) / (FY1 - FY0)];
  const photoFace = new THREE.Group();
  photoFace.visible = false;
  head.add(photoFace);
  const eyelids = [];

  function applyPhotoFace(tex) {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const faceMat = new THREE.MeshStandardMaterial({
      map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.55,
      roughness: 0.6, transparent: true, depthWrite: false,
    });
    // 1) face patch following the head surface
    const NX = 30, NY = 40;
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= NY; j++) {
      for (let i = 0; i <= NX; i++) {
        const x = FX0 + ((FX1 - FX0) * i) / NX;
        const y = FY1 - ((FY1 - FY0) * j) / NY;
        const sz = surfaceZ(x, y);
        pos.push(x, y, (sz < 0 ? 0 : sz) + 0.004);
        uv.push(...faceUV(x, y));
      }
    }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const face = new THREE.Mesh(g, faceMat);
    face.renderOrder = 2;
    photoFace.add(face);

    // 2) nose bump so the 3/4 view has a real profile; it carries the photo's nose
    const noseG = new THREE.SphereGeometry(0.03, 20, 16);
    noseG.scale(0.78, 1.12, 0.85);
    noseG.translate(0.002, -0.062, 0.168);
    const np = noseG.attributes.position, nuv = [];
    for (let k = 0; k < np.count; k++) nuv.push(...faceUV(np.getX(k), np.getY(k)));
    noseG.setAttribute("uv", new THREE.Float32BufferAttribute(nuv, 2));
    const noseMat = faceMat.clone(); noseMat.transparent = false; noseMat.depthWrite = true;
    photoFace.add(new THREE.Mesh(noseG, noseMat));

    // 3) eyelids (skin-toned, conform to the face) so blinking still works
    [[-0.0658, 0.021], [0.0697, 0.019]].forEach(([ex, ey]) => {
      const lg = new THREE.CircleGeometry(1, 24);
      const lp = lg.attributes.position;
      for (let k = 0; k < lp.count; k++) {
        const lx = lp.getX(k) * 0.034, ly = lp.getY(k) * 0.019;
        lp.setXYZ(k, lx, ly, Math.max(0, surfaceZ(ex + lx, ey + ly)) + 0.0075);
      }
      lg.computeVertexNormals();
      const lid = new THREE.Mesh(lg, new THREE.MeshStandardMaterial({ color: 0xdba88e, roughness: 0.6, emissive: 0xdba88e, emissiveIntensity: 0.55 }));
      lid.position.set(ex, ey, 0);
      lid.scale.y = 0.001; lid.visible = false; lid.renderOrder = 3;
      photoFace.add(lid);
      eyelids.push(lid);
    });

    photoFace.visible = true;
    procFace.visible = false;
  }
  if (opts.faceTexture) applyPhotoFace(opts.faceTexture);
  else if (opts.faceSrc) new THREE.TextureLoader().load(opts.faceSrc, applyPhotoFace, undefined, () => console.warn("[dev-scene] face texture failed; using drawn face"));

  // Hair: short black sides + swept-up fringe, like the reference photo
  const hair = new THREE.Group();
  head.add(hair);
  const hairCap = mesh(new THREE.SphereGeometry(0.205, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.37), M.hair, hair, 0, 0.012, -0.012);
  hairCap.scale.set(0.93, 1.1, 1.02);
  const hairBack = mesh(new THREE.SphereGeometry(0.19, 28, 20), M.hair, hair, 0, -0.01, -0.05);
  hairBack.scale.set(0.93, 1.05, 0.95);
  const quiff = mesh(new THREE.SphereGeometry(0.1, 24, 16), M.hair, hair, 0.015, 0.175, 0.07);
  quiff.scale.set(1.45, 0.62, 1.15);
  quiff.rotation.set(-0.35, 0, -0.14);
  const fringe = mesh(new THREE.SphereGeometry(0.1, 20, 14), M.hair, hair, -0.045, 0.148, 0.105);
  fringe.scale.set(1.25, 0.4, 0.8);
  fringe.rotation.set(-0.2, 0, 0.2);
  [-1, 1].forEach((s) => {
    const burn = box(0.03, 0.09, 0.07, M.hair, hair, s * 0.165, 0.035, 0.03);
    burn.rotation.z = s * 0.04;
  });

  /* --- Arms: two-bone IK so hands can actually reach the keys --- */
  const L1 = 0.31, L2 = 0.3; // upper arm, forearm
  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Vector3(side * 0.3, 0.6, 0.0); // in torso space
    const upper = limb(0.058, L1, M.shirt, torso);
    const fore = limb(0.048, L2, M.shirt, torso);
    const cuff = mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.04, 14), M.shirt, fore, 0, -L2 + 0.02, 0);
    const elbowBall = mesh(new THREE.SphereGeometry(0.058, 12, 10), M.shirt, torso);

    // hand: palm + 4 fingers + thumb. Fingers extend along +Z, hinge on X.
    const hand = new THREE.Group();
    scene.add(hand); // world space; positioned by IK target each frame
    const palm = box(0.085, 0.026, 0.09, M.skin, hand, 0, 0, 0.045);
    const fingers = [];
    for (let i = 0; i < 4; i++) {
      const piv = new THREE.Group();
      piv.position.set(-0.034 + i * 0.0225, 0.0, 0.09);
      hand.add(piv);
      const f1 = mesh(new THREE.CapsuleGeometry(0.0095, 0.03, 4, 8), M.skin, piv, 0, 0, 0.022);
      f1.rotation.x = Math.PI / 2;
      const piv2 = new THREE.Group();
      piv2.position.set(0, 0, 0.045);
      piv.add(piv2);
      const f2 = mesh(new THREE.CapsuleGeometry(0.0085, 0.02, 4, 8), M.skin, piv2, 0, 0, 0.016);
      f2.rotation.x = Math.PI / 2;
      fingers.push({ piv, piv2, phase: Math.random() * 6.283, rate: 5 + Math.random() * 3 });
    }
    const thumb = mesh(new THREE.CapsuleGeometry(0.011, 0.03, 4, 8), M.skin, hand, side * -0.052, 0, 0.03);
    thumb.rotation.set(Math.PI / 2, 0, side * 0.6);
    return { side, shoulder, upper, fore, elbowBall, hand, fingers };
  });

  const _v = new THREE.Vector3();
  const _dir = new THREE.Vector3();
  const _side = new THREE.Vector3();
  const _elbow = new THREE.Vector3();
  const _q = new THREE.Quaternion();
  const DOWN = new THREE.Vector3(0, -1, 0);
  const POLE = new THREE.Vector3(0, -0.6, -0.5); // elbows drop down and slightly back

  /** Two-bone IK in torso-local space. `target` = wrist position (torso space). */
  function solveArm(arm, target) {
    const S = arm.shoulder;
    _dir.copy(target).sub(S);
    const dist = clamp(_dir.length(), 0.05, (L1 + L2) * 0.995);
    _dir.normalize();
    const cosA = clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1);
    const angA = Math.acos(cosA);
    const pole = _v.copy(POLE);
    pole.x += arm.side * 0.35; // elbows flare out a bit
    _side.copy(pole).addScaledVector(_dir, -pole.dot(_dir)).normalize();
    _elbow.copy(S).addScaledVector(_dir, Math.cos(angA) * L1).addScaledVector(_side, Math.sin(angA) * L1);

    arm.upper.position.copy(S);
    _v.copy(_elbow).sub(S).normalize();
    arm.upper.quaternion.copy(_q.setFromUnitVectors(DOWN, _v));

    arm.fore.position.copy(_elbow);
    arm.elbowBall.position.copy(_elbow);
    _v.copy(target).sub(_elbow).normalize();
    arm.fore.quaternion.copy(_q.setFromUnitVectors(DOWN, _v));
  }

  /* --- Legs --- */
  [-1, 1].forEach((s) => {
    const hip = new THREE.Group();
    hip.position.set(s * 0.12, 0.58, 0.0);
    character.add(hip);
    const thigh = mesh(new THREE.CapsuleGeometry(0.09, 0.3, 6, 14), M.pants, hip, 0, 0, 0.22);
    thigh.rotation.x = Math.PI / 2 - 0.05;
    const knee = new THREE.Group();
    knee.position.set(0, 0.0, 0.46);
    hip.add(knee);
    const shin = mesh(new THREE.CapsuleGeometry(0.07, 0.3, 6, 14), M.pants, knee, 0, -0.3, 0);
    const shoe = mesh(new THREE.CapsuleGeometry(0.06, 0.12, 6, 12), M.shoe, knee, 0, -0.55, 0.08);
    shoe.rotation.x = Math.PI / 2;
    shoe.scale.set(1, 1, 0.6);
  });
  // hips / seat
  const hipsM = mesh(new THREE.CapsuleGeometry(0.2, 0.12, 6, 16), M.pants, character, 0, 0.56, 0.0);
  hipsM.rotation.z = Math.PI / 2;
  hipsM.scale.set(0.7, 1.15, 1);

  // soft contact shadow under chair (cheap fake)
  const shadowTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grd.addColorStop(0, "rgba(0,0,0,.65)"); grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const blob = mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }), scene, 0, 0.012, 0.1);
  blob.rotation.x = -Math.PI / 2;
  const deskShadow = mesh(new THREE.PlaneGeometry(2.8, 1.3), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.8 }), scene, 0.1, 0.011, 0.85);
  deskShadow.rotation.x = -Math.PI / 2;

  /* ================================================================ */
  /* ANIMATION                                                        */
  /* ================================================================ */
  // Hand "home" positions on the keyboard (world space)
  const homeL = new THREE.Vector3(-0.1, 0.84, 0.43);
  const homeR = new THREE.Vector3(0.14, 0.84, 0.43);
  const wrist = new THREE.Vector3();
  const handWorld = [homeL.clone(), homeR.clone()];

  // Typing bursts: types for a while, pauses to "think", repeats.
  let burst = 1, burstT = 0, nextSwitch = 5 + Math.random() * 3, intensity = 1;
  // Blink + glance state
  let nextBlink = 2, blinkT = -1;
  let glance = 0, glanceTarget = 0, nextGlance = 4;
  let keyPressIdx = -1, keyPressT = 0;

  const camBobAmp = 0.05;

  function update(dt, t) {
    // --- typing intensity (smooth burst envelope) ---
    burstT += dt;
    if (burstT > nextSwitch) {
      burstT = 0;
      burst = burst > 0.5 ? 0.12 : 1;
      nextSwitch = burst > 0.5 ? 6 + Math.random() * 5 : 1.6 + Math.random() * 1.6;
    }
    intensity += (burst - intensity) * Math.min(1, dt * 4);

    // --- screen: type characters while the character types ---
    typedChars += dt * 26 * intensity;
    if (typedChars > TOTAL_CHARS + 60) typedChars = 0;
    drawScreen(t);

    // --- breathing + posture ---
    const breath = Math.sin(t * 1.5);
    torso.scale.set(1 + breath * 0.008, 1 + breath * 0.012, 1 + breath * 0.01);
    torso.rotation.x = 0.1 + Math.sin(t * 0.35) * 0.012; // slight forward lean toward the screen
    torso.rotation.z = Math.sin(t * 0.27) * 0.012;
    chair.rotation.y = Math.sin(t * 0.22) * 0.03;
    character.rotation.y = chair.rotation.y;

    // --- head: reads code (small scanning motion), occasional glance to camera ---
    nextGlance -= dt;
    if (nextGlance < 0) {
      glanceTarget = glanceTarget > 0 ? 0 : 1;
      nextGlance = glanceTarget ? 1.4 + Math.random() : 5 + Math.random() * 5;
    }
    glance += (glanceTarget - glance) * Math.min(1, dt * 2.2);
    const scan = Math.sin(t * 0.9) * 0.06 + Math.sin(t * 2.3) * 0.02;
    const lineSweep = Math.sin(t * 0.6) * 0.03;
    // base yaw ~+0.28 rad: a slight turn toward the viewer so the face reads in 3/4 view while he still works; glance turns further
    headPivot.rotation.y = 0.28 + scan - glance * 0.4;
    headPivot.rotation.x = -0.05 + lineSweep + glance * -0.03 + Math.sin(t * 2.6) * 0.008 * intensity;
    headPivot.rotation.z = Math.sin(t * 0.5) * 0.015;

    // --- blinking ---
    nextBlink -= dt;
    if (nextBlink < 0 && blinkT < 0) { blinkT = 0; nextBlink = 2.2 + Math.random() * 3.5; }
    let eyeOpen = 1;
    if (blinkT >= 0) {
      blinkT += dt;
      const p = blinkT / 0.16;
      eyeOpen = p < 0.5 ? 1 - p * 2 : p < 1 ? (p - 0.5) * 2 : 1;
      if (p >= 1) { blinkT = -1; eyeOpen = 1; }
    }
    eyes.forEach((e) => (e.scale.y = Math.max(0.08, eyeOpen)));
    eyelids.forEach((l) => { const c = 1 - eyeOpen; l.visible = c > 0.04; l.scale.y = Math.max(0.001, c); });

    // --- typing: each hand moves along keys + finger curls; wrists bob ---
    torso.updateMatrixWorld(true);
    arms.forEach((arm, i) => {
      const home = i === 0 ? homeL : homeR;
      const ph = i * 1.7;
      const hop = Math.sin(t * 9 + ph) * 0.006 * intensity;
      const slideX = (Math.sin(t * 2.4 + ph) * 0.045 + Math.sin(t * 5.1 + ph * 2) * 0.012) * intensity;
      const slideZ = (Math.sin(t * 1.7 + ph * 1.3) * 0.02 + Math.sin(t * 7.3 + ph) * 0.006) * intensity;
      handWorld[i].set(home.x + slideX, home.y + hop, home.z + slideZ);

      arm.hand.position.copy(handWorld[i]);
      arm.hand.rotation.set(-0.12 + Math.sin(t * 9 + ph) * 0.03 * intensity, 0.05 * (i ? -1 : 1), 0);

      // wrist target = a bit behind the palm start (hand origin at wrist)
      wrist.copy(handWorld[i]);
      torso.worldToLocal(wrist);
      solveArm(arm, wrist);

      arm.fingers.forEach((f, k) => {
        const press = Math.max(0, Math.sin(t * f.rate + f.phase + k)) ** 3;
        const curl = 0.28 + press * 0.55 * intensity;
        f.piv.rotation.x = curl;
        f.piv2.rotation.x = curl * 0.7;
      });
    });

    // --- keycap press feedback ---
    keyPressT -= dt;
    if (keyPressT < 0) {
      if (keyPressIdx >= 0) keyMesh[keyPressIdx].position.y = 0.032;
      keyPressIdx = Math.floor(Math.random() * keyMesh.length);
      keyMesh[keyPressIdx].position.y = 0.025;
      keyPressT = (0.05 + Math.random() * 0.09) / Math.max(0.25, intensity);
    }

    // --- ambient: light pulses, plant sway, subtle camera drift ---
    screenLight.intensity = 3.0 + Math.sin(t * 3.1) * 0.25 + (intensity > 0.5 ? Math.sin(t * 11) * 0.12 : 0);
    rimBlue.intensity = 13 + Math.sin(t * 0.8) * 2.2;
    rimCyan.intensity = 9.5 + Math.sin(t * 0.6 + 1) * 1.6;
    purpleFill.intensity = 4.6 + Math.sin(t * 0.5 + 2) * 0.9;
    leaves.forEach((l, i) => (l.rotation.z = 0.5 + Math.sin(t * 1.1 + i) * 0.04));
    ring.material.color.setHSL(0.5 + Math.sin(t * 0.3) * 0.04, 0.9, 0.55);

    camera.position.x = CAM_BASE.x + Math.sin(t * 0.18) * camBobAmp * 2;
    camera.position.y = CAM_BASE.y + Math.sin(t * 0.23) * camBobAmp;
    camera.lookAt(CAM_TARGET);
  }

  function resize(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Narrower containers: pull the camera back so the whole scene stays framed.
    camera.fov = w / h < 1 ? 42 : 32;
    camera.updateProjectionMatrix();
  }

  const render = () => renderer.render(scene, camera);

  function dispose() {
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map?.dispose?.(); m.dispose(); });
    });
    screenTex.dispose();
    renderer.dispose();
  }

  // Prime the screen with some code so the first / static frame isn't empty.
  typedChars = 300;
  drawScreen(0);

  return { update, resize, render, dispose, renderer, scene, camera };
}
