import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { drawChip, drawStatement, loadStatementFonts, PAGE_ASPECT } from "./statement-texture";
import { SCENE_FRAMES } from "./scene-frames";

/**
 * The document scene, framework-free. document-scene.tsx is the React shell.
 *
 * Subject: bank-statement pages (thin bent paper slabs with a canvas texture),
 * the examined page carrying a red pin box around the flagged row with a
 * leader to a floating verdict chip, and a volt tube ribbon curving through.
 * PBR materials lit by a RoomEnvironment PMREM + a shadow-casting key.
 */

export type SceneVariant = "hero" | "stack" | "single";
export type SceneTone = "graphite" | "light";
export type SceneVerdict = "FAIL" | "REVIEW" | "CLEAR";

export type SceneOptions = {
  variant: SceneVariant;
  tone: SceneTone;
  verdict: SceneVerdict;
  interactive: boolean;
  ribbon: boolean;
  /** Progress used for the single static frame under reduced motion. */
  restProgress: number;
  getProgress: () => number;
  onReady: () => void;
  onLost: () => void;
};

type V3 = [number, number, number];
type Pose = { p: V3; r: V3 };

type Spec = {
  pages: { from: Pose; to: Pose; page: number }[]; // [0] is the examined page
  chip: Pose; // local to the examined page
  ribbon?: { points: V3[]; radius: number; from: [number, number]; to: [number, number] };
  frame: { readonly w: number; readonly h: number };
  camera: { dir: V3; fov: number };
  recede: { z: number; scale: number };
};

const PW = 2;
const PH = PW * PAGE_ASPECT;
const PT = 0.016;

const VERDICT_COLOR: Record<SceneVerdict, string> = { FAIL: "#e5342b", REVIEW: "#c98a12", CLEAR: "#1d9a63" };

const SPECS: Record<SceneVariant, Spec> = {
  hero: {
    pages: [
      { page: 4, from: { p: [1.05, -0.12, 0.7], r: [-0.36, 0.2, -0.09] }, to: { p: [1.6, -0.3, 1.2], r: [-0.26, 0.3, -0.12] } },
      { page: 3, from: { p: [-0.6, 0.1, 0.0], r: [-0.33, 0.3, 0.04] }, to: { p: [-0.65, 0.22, -0.5], r: [-0.38, 0.34, 0.07] } },
      { page: 2, from: { p: [-2.2, 0.32, -0.7], r: [-0.3, 0.4, 0.13] }, to: { p: [-2.95, 0.55, -1.8], r: [-0.24, 0.46, 0.19] } },
    ],
    chip: { p: [1.42, -0.02, 0.5], r: [0.22, -0.08, 0.06] },
    ribbon: {
      points: [
        [-6.2, 0.3, 0.2],
        [-4.4, -1.1, 1.0],
        [-2.6, -1.75, 1.35],
        [-1.0, -1.25, 0.9],
        [0.25, 0.05, 0.38],
        [1.1, 0.7, 0.18],
        [2.5, 1.75, -0.3],
        [3.85, 1.2, -0.2],
        [3.75, -0.8, 0.7],
        [2.3, -2.1, 1.6],
        [-0.2, -2.45, 2.2],
        [-3.2, -3.1, 2.4],
      ],
      radius: 0.085,
      from: [0.0, 0.415],
      to: [0.0, 1.0],
    },
    frame: SCENE_FRAMES.hero,
    camera: { dir: [0, 0.3, 1], fov: 26 },
    recede: { z: -1.1, scale: 0.94 },
  },
  stack: {
    pages: [
      { page: 4, from: { p: [0.12, -0.18, 0.55], r: [-0.42, 0.12, -0.1] }, to: { p: [0.35, -0.55, 0.95], r: [-0.36, 0.04, -0.14] } },
      { page: 3, from: { p: [-0.2, 0.08, 0.0], r: [-0.44, 0.2, 0.08] }, to: { p: [-0.25, 0.15, -0.15], r: [-0.46, 0.2, 0.1] } },
      { page: 2, from: { p: [-0.5, 0.3, -0.55], r: [-0.46, 0.28, 0.22] }, to: { p: [-0.75, 0.8, -1.15], r: [-0.5, 0.34, 0.28] } },
    ],
    chip: { p: [1.1, 0.05, 0.5], r: [0.45, -0.18, 0.06] },
    ribbon: {
      points: [
        [-3.8, -2.4, 0.2],
        [-1.4, -2.2, 1.6],
        [1.2, -1.7, 1.5],
        [2.4, -0.1, 0.1],
        [1.7, 1.9, -1.3],
        [-0.7, 2.4, -1.7],
        [-2.5, 1.1, -0.8],
        [-2.2, -0.6, 0.9],
        [-0.2, 3.4, 1.4],
      ],
      radius: 0.06,
      from: [0.0, 0.7],
      to: [0.0, 1.0],
    },
    frame: SCENE_FRAMES.stack,
    camera: { dir: [0, 0.12, 1], fov: 26 },
    recede: { z: -0.6, scale: 0.96 },
  },
  single: {
    pages: [{ page: 4, from: { p: [-0.25, 0, 0], r: [-0.22, -0.3, -0.04] }, to: { p: [-0.25, 0.05, 0.2], r: [-0.1, -0.12, 0] } }],
    chip: { p: [1.4, 0.02, 0.48], r: [0.2, -0.16, 0.06] },
    frame: SCENE_FRAMES.single,
    camera: { dir: [0, 0.1, 1], fov: 26 },
    recede: { z: 0, scale: 1 },
  },
};

/** Gentle sheet curl: edges fall away, bottom-right corner lifts a touch. */
function bend(x: number, y: number) {
  const nx = x / (PW / 2);
  const ny = y / (PH / 2);
  return -0.055 * nx * nx + 0.05 * Math.max(0, nx) * Math.max(0, -ny) ** 2;
}

function pageGeometry() {
  const g = new THREE.BoxGeometry(PW, PH, PT, 28, 36, 1);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    pos.setZ(i, pos.getZ(i) + bend(pos.getX(i), pos.getY(i)));
  }
  g.computeVertexNormals();
  return g;
}

function pillShape(w: number, h: number) {
  const r = h / 2;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.absarc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-w / 2 + r, h / 2);
  s.absarc(-w / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false);
  return s;
}

/** Rounded-rect path on the bent page surface, lifted by `lift`. */
function pinCurve(x0: number, y0: number, x1: number, y1: number, r: number, lift: number) {
  const pts: THREE.Vector3[] = [];
  const add = (x: number, y: number) => pts.push(new THREE.Vector3(x, y, PT / 2 + bend(x, y) + lift));
  const seg = (ax: number, ay: number, bx: number, by: number, n: number) => {
    for (let i = 0; i < n; i++) add(ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n);
  };
  const arc = (cx: number, cy: number, a0: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const a = a0 + (Math.PI / 2) * (i / n);
      add(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
  };
  seg(x0 + r, y0, x1 - r, y0, 24);
  arc(x1 - r, y0 + r, -Math.PI / 2, 6);
  seg(x1, y0 + r, x1, y1 - r, 4);
  arc(x1 - r, y1 - r, 0, 6);
  seg(x1 - r, y1, x0 + r, y1, 24);
  arc(x0 + r, y1 - r, Math.PI / 2, 6);
  seg(x0, y1 - r, x0, y0 + r, 4);
  arc(x0 + r, y0 + r, Math.PI, 6);
  return new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.1);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const damp = (a: number, b: number, lambda: number, dt: number) => lerp(a, b, 1 - Math.exp(-lambda * dt));

export function createDocumentScene(host: HTMLElement, opts: SceneOptions) {
  let disposed = false;
  // A fresh canvas per mount: a context that was force-lost can't be reused
  // (React StrictMode mounts effects twice in development).
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);
  const mql = (q: string) => window.matchMedia(q).matches;
  const reduced = mql("(prefers-reduced-motion: reduce)");
  const mobile = mql("(max-width: 767px)") || mql("(pointer: coarse)");
  const interactive = opts.interactive && !reduced && mql("(hover: hover) and (pointer: fine)");
  const spec = SPECS[opts.variant];
  // Mobile keeps every object (so the poster still matches) and saves elsewhere:
  // DPR 1.5, smaller textures and shadow map, fewer ribbon segments, no cursor.
  const pageDefs = spec.pages;
  const dark = opts.tone === "graphite";

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    canvas.remove();
    return { dispose() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = dark ? 0.95 : 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = dark ? 0.32 : 0.55;
  scene.fog = new THREE.Fog(dark ? 0x23252f : 0xf0f1fa, 10, 26);

  const camera = new THREE.PerspectiveCamera(spec.camera.fov, 1, 0.1, 100);
  const camDir = new THREE.Vector3(...spec.camera.dir).normalize();
  const camTarget = new THREE.Vector3(0, 0, 0);
  let camDist = 12;

  const key = new THREE.DirectionalLight(0xffffff, dark ? 3.0 : 2.8);
  key.position.set(5.5, 6.5, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  key.shadow.radius = 14;
  key.shadow.blurSamples = 20;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.01;
  const sc = key.shadow.camera;
  sc.left = -7;
  sc.right = 7;
  sc.top = 6;
  sc.bottom = -6;
  sc.near = 1;
  sc.far = 30;
  scene.add(key, key.target);

  const rim = new THREE.DirectionalLight(0xc4ccff, dark ? 1.8 : 0.9);
  rim.position.set(-6, 2.5, -5);
  scene.add(rim);

  const root = new THREE.Group();
  scene.add(root);

  // Invisible studio backdrop that only shows the soft shadows the set casts.
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 30),
    new THREE.ShadowMaterial({ color: dark ? 0x07080c : 0x1d2140, opacity: dark ? 0.38 : 0.2 }),
  );
  backdrop.position.z = -1.9;
  backdrop.receiveShadow = true;
  root.add(backdrop);

  // Geometry + materials
  const disposables: { dispose(): void }[] = [envRT, pmrem, backdrop.geometry, backdrop.material as THREE.Material];
  const track = <T extends { dispose(): void }>(d: T) => (disposables.push(d), d);
  const anisotropy = renderer.capabilities.getMaxAnisotropy();

  const pageGeo = track(pageGeometry());
  const edgeMat = track(new THREE.MeshPhysicalMaterial({ color: 0xf7f8fb, roughness: 0.75 }));
  const backMat = track(new THREE.MeshPhysicalMaterial({ color: 0xeef0f5, roughness: 0.8 }));
  const verdictColor = new THREE.Color(VERDICT_COLOR[opts.verdict]);

  const pages: THREE.Group[] = [];
  const chipGroup = new THREE.Group();
  let ribbonMesh: THREE.Mesh | null = null;
  let ribbonCaps: THREE.Mesh[] = [];
  let ribbonCurve: THREE.CatmullRomCurve3 | null = null;
  const ribbonSegs = mobile ? 360 : 720;
  const ribbonRadial = 20;

  let frame = 0;
  let last = 0;
  let visible = true;
  let built = false;
  const pointer = { tx: 0, ty: 0, x: 0, y: 0 };
  let progress = reduced ? opts.restProgress : clamp01(opts.getProgress());
  let time = 0;

  function clamp01(v: number) {
    return v < 0 ? 0 : v > 1 ? 1 : Number.isFinite(v) ? v : 0;
  }

  async function build() {
    const fonts = await loadStatementFonts();
    if (disposed) return;
    const texW = mobile ? 768 : 1280;

    pageDefs.forEach((def, i) => {
      const examined = i === 0;
      const flagged = examined && opts.verdict !== "CLEAR";
      const { canvas: c, pin } = drawStatement(fonts, { width: texW, page: def.page, flagged, seed: i });
      const tex = track(new THREE.CanvasTexture(c));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = anisotropy;
      const front = track(
        new THREE.MeshPhysicalMaterial({
          map: tex,
          roughness: 0.6,
          clearcoat: examined ? 0.25 : 0.12,
          clearcoatRoughness: 0.3,
          sheen: 0.2,
          sheenRoughness: 0.8,
          sheenColor: new THREE.Color(0xffffff),
        }),
      );
      const mesh = new THREE.Mesh(pageGeo, [edgeMat, edgeMat, edgeMat, edgeMat, front, backMat]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const g = new THREE.Group();
      g.add(mesh);

      if (examined && pin) {
        const x0 = (pin.u0 - 0.5) * PW;
        const x1 = (pin.u1 - 0.5) * PW;
        const y0 = (0.5 - pin.v1) * PH;
        const y1 = (0.5 - pin.v0) * PH;
        const pinMat = track(
          new THREE.MeshPhysicalMaterial({
            color: verdictColor.clone().multiplyScalar(0.6),
            emissive: verdictColor,
            emissiveIntensity: 0.4,
            roughness: 0.3,
            clearcoat: 1,
            clearcoatRoughness: 0.1,
          }),
        );
        const box = new THREE.Mesh(track(new THREE.TubeGeometry(pinCurve(x0, y0, x1, y1, 0.035, 0.05), 320, 0.013, 10, true)), pinMat);
        box.castShadow = true;
        g.add(box);

        // Leader from the box's right edge to the chip.
        const cp = new THREE.Vector3(...spec.chip.p);
        const start = new THREE.Vector3(x1, (y0 + y1) / 2, PT / 2 + bend(x1, (y0 + y1) / 2) + 0.05);
        const end = cp.clone().add(new THREE.Vector3(-0.5, 0, -0.02));
        const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0, 0.22));
        const leader = new THREE.Mesh(
          track(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(start, mid, end), 48, 0.007, 8, false)),
          pinMat,
        );
        leader.castShadow = true;
        g.add(leader);
        const dot = new THREE.Mesh(track(new THREE.SphereGeometry(0.03, 20, 16)), pinMat);
        dot.position.copy(start);
        g.add(dot);
      }

      if (examined) {
        // Verdict chip: a glossy extruded pill with its label on the face.
        const cw = 1.0;
        const ch = 0.4;
        const depth = 0.08;
        const bevel = 0.03;
        const chipGeo = track(
          new THREE.ExtrudeGeometry(pillShape(cw, ch), {
            depth,
            bevelEnabled: true,
            bevelThickness: bevel,
            bevelSize: bevel,
            bevelSegments: 8,
            curveSegments: 40,
          }),
        );
        chipGeo.center();
        const chipMat = track(
          // Darker albedo + same-hue emissive keeps the verdict colour
          // saturated under the key light instead of tone-mapping to pink.
          new THREE.MeshPhysicalMaterial({
            color: verdictColor.clone().multiplyScalar(0.5),
            emissive: verdictColor,
            emissiveIntensity: 0.32,
            roughness: 0.45,
            specularIntensity: 0.4,
            clearcoat: 0.55,
            clearcoatRoughness: 0.1,
            envMapIntensity: 0.16,
          }),
        );
        const chip = new THREE.Mesh(chipGeo, chipMat);
        chip.castShadow = true;
        const labelTex = track(new THREE.CanvasTexture(drawChip(fonts, opts.verdict, { width: 512 })));
        labelTex.colorSpace = THREE.SRGBColorSpace;
        labelTex.anisotropy = anisotropy;
        const label = new THREE.Mesh(
          track(new THREE.PlaneGeometry(cw, cw * 0.4)),
          track(new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, toneMapped: false, depthWrite: false })),
        );
        label.position.z = depth / 2 + bevel + 0.002;
        chipGroup.add(chip, label);
        chipGroup.position.set(...spec.chip.p);
        chipGroup.rotation.set(...spec.chip.r);
        g.add(chipGroup);
      }

      root.add(g);
      pages.push(g);
    });

    if (spec.ribbon && opts.ribbon) {
      const r = spec.ribbon;
      ribbonCurve = new THREE.CatmullRomCurve3(
        r.points.map((p) => new THREE.Vector3(...p)),
        false,
        "centripetal",
      );
      const geo = track(new THREE.TubeGeometry(ribbonCurve, ribbonSegs, r.radius, ribbonRadial, false));
      const uv = geo.attributes.uv as THREE.BufferAttribute;
      const colors = new Float32Array(uv.count * 3);
      const a = new THREE.Color("#3b49f4");
      const b = new THREE.Color("#5981fe");
      const c = new THREE.Color();
      for (let i = 0; i < uv.count; i++) {
        c.copy(a).lerp(b, uv.getX(i));
        colors.set([c.r, c.g, c.b], i * 3);
      }
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const mat = track(
        new THREE.MeshPhysicalMaterial({
          vertexColors: true,
          roughness: 0.22,
          clearcoat: 1,
          clearcoatRoughness: 0.08,
          emissive: new THREE.Color("#2a36d8"),
          emissiveIntensity: dark ? 0.18 : 0.06,
        }),
      );
      ribbonMesh = new THREE.Mesh(geo, mat);
      ribbonMesh.castShadow = true;
      root.add(ribbonMesh);
      const capGeo = track(new THREE.SphereGeometry(r.radius, 24, 16));
      ribbonCaps = [a, b].map((col) => {
        const m = new THREE.Mesh(
          capGeo,
          track(
            new THREE.MeshPhysicalMaterial({
              color: col,
              roughness: 0.22,
              clearcoat: 1,
              clearcoatRoughness: 0.08,
              emissive: new THREE.Color("#2a36d8"),
              emissiveIntensity: dark ? 0.18 : 0.06,
            }),
          ),
        );
        root.add(m);
        return m;
      });
    }

    built = true;
    resize();
    apply(0);
    renderer.render(scene, camera);
    requestAnimationFrame(() => {
      if (!disposed) opts.onReady();
    });
    if (!reduced) start();
  }

  function fit() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    const aspect = w / h;
    camera.aspect = aspect;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camDist = Math.max(spec.frame.h / 2 / t, spec.frame.w / 2 / (t * aspect));
    camera.near = Math.max(0.1, camDist - 12);
    camera.far = camDist + 20;
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.near = camDist + 0.5;
      scene.fog.far = camDist + 14;
    }
    camera.updateProjectionMatrix();
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    fit();
  }

  const tmpPos = new THREE.Vector3();
  function apply(dt: number) {
    const p = progress;
    const e = p * p * (3 - 2 * p); // smoothstep: soft at both ends
    const idle = reduced ? 0 : 1;
    pageDefs.forEach((def, i) => {
      const g = pages[i];
      if (!g) return;
      const f = def.from;
      const to = def.to;
      const ph = time * 0.55 + i * 1.7;
      g.position.set(
        lerp(f.p[0], to.p[0], e),
        lerp(f.p[1], to.p[1], e) + Math.sin(ph) * 0.035 * idle,
        lerp(f.p[2], to.p[2], e),
      );
      g.rotation.set(
        lerp(f.r[0], to.r[0], e) + Math.sin(ph * 0.8) * 0.012 * idle,
        lerp(f.r[1], to.r[1], e) + Math.cos(ph * 0.7) * 0.015 * idle,
        lerp(f.r[2], to.r[2], e),
      );
    });
    if (chipGroup.parent) {
      chipGroup.position.set(spec.chip.p[0], spec.chip.p[1] + Math.sin(time * 0.9) * 0.025 * idle, spec.chip.p[2]);
      chipGroup.rotation.set(spec.chip.r[0], spec.chip.r[1] + Math.sin(time * 0.6) * 0.04 * idle, spec.chip.r[2]);
    }

    root.position.z = lerp(0, spec.recede.z, e);
    root.scale.setScalar(lerp(1, spec.recede.scale, e));

    if (ribbonMesh && ribbonCurve && spec.ribbon) {
      const r = spec.ribbon;
      const s0 = lerp(r.from[0], r.to[0], e);
      const s1 = lerp(r.from[1], r.to[1], e);
      const a = Math.floor(s0 * ribbonSegs);
      const b = Math.max(a + 1, Math.floor(s1 * ribbonSegs));
      const per = ribbonRadial * 6;
      ribbonMesh.geometry.setDrawRange(a * per, (b - a) * per);
      ribbonCaps[0].position.copy(ribbonCurve.getPointAt(a / ribbonSegs, tmpPos));
      ribbonCaps[1].position.copy(ribbonCurve.getPointAt(Math.min(1, b / ribbonSegs), tmpPos));
    }

    // Cursor parallax: the whole set eases toward the pointer, damped.
    if (dt > 0) {
      pointer.x = damp(pointer.x, pointer.tx, 2.6, dt);
      pointer.y = damp(pointer.y, pointer.ty, 2.6, dt);
    }
    root.rotation.y = pointer.x * 0.16;
    root.rotation.x = -pointer.y * 0.09;
    camera.position.copy(camDir).multiplyScalar(camDist).add(camTarget);
    camera.position.x += pointer.x * 0.35;
    camera.position.y += -pointer.y * 0.2;
    camera.lookAt(camTarget);
  }

  function tick(now: number) {
    frame = 0;
    if (disposed || !built) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    time += dt;
    progress = damp(progress, clamp01(opts.getProgress()), 5.5, dt);
    apply(dt);
    renderer.render(scene, camera);
    if (visible && !document.hidden) frame = requestAnimationFrame(tick);
  }

  function start() {
    if (!frame && !reduced && built && visible && !document.hidden) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) start();
      else stop();
    },
    { rootMargin: "120px" },
  );
  io.observe(canvas);

  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVisibility);

  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    pointer.tx = Math.max(-1, Math.min(1, nx));
    pointer.ty = Math.max(-1, Math.min(1, ny));
  };
  if (interactive) window.addEventListener("pointermove", onPointer, { passive: true });

  const ro = new ResizeObserver(() => {
    if (!built) return;
    resize();
    if (reduced || !frame) {
      apply(0);
      renderer.render(scene, camera);
    }
  });
  ro.observe(canvas);

  const onLost = (e: Event) => {
    e.preventDefault();
    stop();
    opts.onLost();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  build().catch(() => {
    /* poster stays */
  });

  if (process.env.NODE_ENV !== "production") {
    (window as unknown as { __pmScene?: unknown }).__pmScene = {
      capture: (type = "image/webp", q = 0.9) => {
        time = 0;
        apply(0);
        renderer.render(scene, camera);
        return canvas.toDataURL(type, q);
      },
    };
  }

  return {
    dispose() {
      disposed = true;
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
