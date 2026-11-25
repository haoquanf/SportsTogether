"use client";

// Interactive 3D right hand holding a badminton racket. Everything is built from
// simple shapes in code (no models or footage), posed by joint angles, and
// animated between grips. Drag to rotate, scroll or pinch to zoom.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type Finger = [number, number, number, number]; // knuckle, middle, tip flexion (deg), sideways spread (deg)
export type Pose = {
  fingers: [Finger, Finger, Finger, Finger]; // index, middle, ring, pinky
  thumb: { rz: number; rx: number; ry: number; f1: number; f2: number };
  racket: { pos: [number, number, number]; dir: [number, number, number]; roll: number };
  wrist: { rx: number; ry: number; rz: number };
};

const D = Math.PI / 180;

export const POSES: Record<string, Pose> = {
  forehand: {
    fingers: [[55, 60, 25, 6], [72, 80, 35, 0], [78, 82, 35, -3], [82, 82, 35, -8]],
    thumb: { rz: 8, rx: 30, ry: 0, f1: 18, f2: 12 },
    racket: { pos: [-6.5, 5.9, 3.1], dir: [1, 0.32, 0.05], roll: 0 },
    wrist: { rx: 0, ry: 0, rz: 0 },
  },
  backhand: {
    fingers: [[60, 62, 25, 2], [70, 75, 30, 0], [75, 78, 32, -3], [80, 80, 32, -7]],
    thumb: { rz: -42, rx: 46, ry: 0, f1: 0, f2: -5 },
    racket: { pos: [-6.5, 6.2, 3.2], dir: [1, 0.28, 0.05], roll: -30 },
    wrist: { rx: 0, ry: 0, rz: 0 },
  },
  relaxed: {
    fingers: [[40, 45, 15, 6], [52, 55, 20, 0], [56, 58, 20, -3], [58, 58, 22, -8]],
    thumb: { rz: 4, rx: 26, ry: 0, f1: 10, f2: 6 },
    racket: { pos: [-6.3, 6.2, 3.6], dir: [1, 0.32, 0.05], roll: 0 },
    wrist: { rx: 0, ry: 0, rz: 0 },
  },
  squeeze: {
    fingers: [[70, 85, 45, 2], [82, 92, 48, 0], [86, 94, 48, -2], [88, 94, 48, -5]],
    thumb: { rz: 12, rx: 36, ry: 0, f1: 26, f2: 20 },
    racket: { pos: [-6.6, 5.7, 2.8], dir: [1, 0.32, 0.05], roll: 55 },
    wrist: { rx: 0, ry: 0, rz: -28 },
  },
  netFingers: {
    fingers: [[48, 40, 18, 10], [60, 55, 22, 2], [62, 58, 24, -2], [62, 58, 24, -6]],
    thumb: { rz: 2, rx: 30, ry: 0, f1: 8, f2: 6 },
    racket: { pos: [-5.2, 7.6, 3.9], dir: [1, 0.4, 0.05], roll: 0 },
    wrist: { rx: 0, ry: 0, rz: 0 },
  },
  netPush: {
    fingers: [[56, 46, 18, 10], [60, 55, 22, 2], [62, 58, 24, -2], [62, 58, 24, -6]],
    thumb: { rz: 6, rx: 34, ry: 0, f1: 14, f2: 10 },
    racket: { pos: [-5.2, 7.6, 3.9], dir: [1, 0.4, 0.05], roll: -14 },
    wrist: { rx: 0, ry: 0, rz: 0 },
  },
  panhandle: {
    fingers: [[72, 80, 35, 0], [74, 82, 35, 0], [78, 82, 35, -3], [82, 82, 35, -6]],
    thumb: { rz: 14, rx: 34, ry: 0, f1: 30, f2: 22 },
    racket: { pos: [-6.5, 5.9, 3.1], dir: [1, 0.32, 0.05], roll: 90 },
    wrist: { rx: 0, ry: 0, rz: 0 },
  },
  fist: {
    fingers: [[90, 100, 60, 0], [92, 102, 60, 0], [94, 104, 60, 0], [95, 104, 60, 0]],
    thumb: { rz: 28, rx: 40, ry: 0, f1: 45, f2: 35 },
    racket: { pos: [-6.0, 4.6, 2.5], dir: [1, 0.12, 0.05], roll: 10 },
    wrist: { rx: 0, ry: 0, rz: 0 },
  },
};

/** Grips that animate between two poses: [from, to, seconds per cycle]. */
export const ANIMATIONS: Record<string, [string, string, number]> = {
  smash: ["relaxed", "squeeze", 2.2],
  net: ["netFingers", "netPush", 2.6],
};

function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const l = (x: number, y: number) => x + (y - x) * t;
  return {
    fingers: a.fingers.map((f, i) => f.map((v, j) => l(v, b.fingers[i][j]))) as Pose["fingers"],
    thumb: { rz: l(a.thumb.rz, b.thumb.rz), rx: l(a.thumb.rx, b.thumb.rx), ry: l(a.thumb.ry, b.thumb.ry), f1: l(a.thumb.f1, b.thumb.f1), f2: l(a.thumb.f2, b.thumb.f2) },
    racket: {
      pos: a.racket.pos.map((v, i) => l(v, b.racket.pos[i])) as [number, number, number],
      dir: a.racket.dir.map((v, i) => l(v, b.racket.dir[i])) as [number, number, number],
      roll: l(a.racket.roll, b.racket.roll),
    },
    wrist: { rx: l(a.wrist.rx, b.wrist.rx), ry: l(a.wrist.ry, b.wrist.ry), rz: l(a.wrist.rz, b.wrist.rz) },
  };
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function capsule(radius: number, length: number, mat: THREE.Material) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(radius, Math.max(0.01, length - radius * 2 * 0.6), 6, 14), mat);
  m.position.y = length / 2;
  m.castShadow = true;
  return m;
}

type Rig = {
  wrist: THREE.Group;
  fingers: { base: THREE.Group; joints: THREE.Group[] }[];
  thumb: { base: THREE.Group; j1: THREE.Group; j2: THREE.Group };
  racket: THREE.Group;
};

function buildHand(skin: THREE.Material): Rig {
  const wrist = new THREE.Group();

  const palm = new THREE.Mesh(new RoundedBoxGeometry(8.2, 9, 2.8, 4, 1.2), skin);
  palm.position.set(0, 4.5, 0);
  palm.castShadow = true;
  wrist.add(palm);

  // Thumb-side muscle pad, to round out the palm.
  const pad = new THREE.Mesh(new THREE.SphereGeometry(2.4, 20, 16), skin);
  pad.scale.set(1, 1.3, 0.75);
  pad.position.set(2.6, 2.6, 0.6);
  wrist.add(pad);

  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.6, 16, 24), skin);
  forearm.position.set(0, -7.5, -0.2);
  forearm.scale.set(1, 1, 0.75);
  wrist.add(forearm);
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(3.15, 3.15, 2.4, 24), new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 }));
  cuff.position.set(0, -1.2, -0.2);
  cuff.scale.set(1, 1, 0.78);
  wrist.add(cuff);

  const specs = [
    { x: 2.9, r: 0.92, lens: [4.0, 2.5, 2.0] },
    { x: 1.0, r: 0.98, lens: [4.4, 2.8, 2.1] },
    { x: -0.95, r: 0.93, lens: [4.1, 2.6, 2.0] },
    { x: -2.75, r: 0.82, lens: [3.3, 2.0, 1.8] },
  ];
  const fingers = specs.map((s) => {
    const base = new THREE.Group();
    base.position.set(s.x, 8.6, 0.1);
    wrist.add(base);
    const joints: THREE.Group[] = [];
    let parent: THREE.Group = base;
    s.lens.forEach((len, i) => {
      const j = new THREE.Group();
      if (i > 0) j.position.y = s.lens[i - 1];
      parent.add(j);
      j.add(capsule(s.r * (1 - i * 0.06), len + s.r * 0.6, skin));
      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(s.r * (1 - i * 0.06), 14, 12), skin);
      j.add(knuckle);
      joints.push(j);
      parent = j;
    });
    return { base, joints };
  });

  const thumbBase = new THREE.Group();
  thumbBase.position.set(3.4, 2.0, 0.6);
  wrist.add(thumbBase);
  thumbBase.add(capsule(1.2, 4.0, skin));
  const j1 = new THREE.Group();
  j1.position.y = 3.6;
  thumbBase.add(j1);
  j1.add(capsule(1.08, 3.2, skin));
  j1.add(new THREE.Mesh(new THREE.SphereGeometry(1.08, 14, 12), skin));
  const j2 = new THREE.Group();
  j2.position.y = 2.9;
  j1.add(j2);
  j2.add(capsule(1.0, 2.6, skin));
  j2.add(new THREE.Mesh(new THREE.SphereGeometry(1.0, 14, 12), skin));
  const nail = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 8), new THREE.MeshStandardMaterial({ color: 0xf8d9c4, roughness: 0.35 }));
  nail.scale.set(1, 1.3, 0.35);
  nail.position.set(0, 1.9, -0.75);
  j2.add(nail);

  const racket = buildRacket();
  wrist.add(racket);

  return { wrist, fingers, thumb: { base: thumbBase, j1, j2 }, racket };
}

function buildRacket() {
  const g = new THREE.Group();
  const wrap = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
  const frame = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.4 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5, emissive: 0x0b3d1d });
  const gold = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.4, emissive: 0x4a3205 });

  // Octagonal handle: 8 bevels, with flat faces lined up with the string face.
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 20, 8, 1), wrap);
  handle.rotation.y = Math.PI / 8;
  handle.position.y = 10;
  handle.castShadow = true;
  g.add(handle);
  // Wide back bevel (where the thumb goes for the backhand grip), marked in gold.
  const bevel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 14, 0.06), gold);
  bevel.position.set(0, 11, 1.33);
  g.add(bevel);
  const butt = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.8, 8), accent);
  butt.rotation.y = Math.PI / 8;
  g.add(butt);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.45, 1.6, 16), accent);
  collar.position.y = 20.6;
  g.add(collar);

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 22, 12), frame);
  shaft.position.y = 32;
  g.add(shaft);

  // Head: an ellipse-shaped frame with strings, in the local XY plane.
  const curve = new THREE.EllipseCurve(0, 0, 10.5, 12.8, 0, Math.PI * 2, false, 0);
  const pts = curve.getPoints(80).map((p) => new THREE.Vector3(p.x, p.y + 55, 0));
  const head = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 120, 0.5, 8, true), frame);
  head.castShadow = true;
  g.add(head);
  const throatL = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4.2, 8), frame);
  throatL.position.set(-1.3, 43.6, 0);
  throatL.rotation.z = -0.32;
  const throatR = throatL.clone();
  throatR.position.x = 1.3;
  throatR.rotation.z = 0.32;
  g.add(throatL, throatR);

  const stringMat = new THREE.LineBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.75 });
  const lines: number[] = [];
  for (let x = -9.5; x <= 9.5; x += 1.25) {
    const h = 12.8 * Math.sqrt(Math.max(0, 1 - (x / 10.5) ** 2));
    lines.push(x, 55 - h, 0, x, 55 + h, 0);
  }
  for (let y = -12; y <= 12; y += 1.25) {
    const w = 10.5 * Math.sqrt(Math.max(0, 1 - (y / 12.8) ** 2));
    lines.push(-w, 55 + y, 0, w, 55 + y, 0);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
  g.add(new THREE.LineSegments(sg, stringMat));
  return g;
}

function applyPose(rig: Rig, p: Pose) {
  rig.fingers.forEach((f, i) => {
    const [a, b, c, spread] = p.fingers[i];
    f.joints[0].rotation.set(a * D, 0, -spread * D);
    f.joints[1].rotation.set(b * D, 0, 0);
    f.joints[2].rotation.set(c * D, 0, 0);
  });
  rig.thumb.base.rotation.set(p.thumb.rx * D, p.thumb.ry * D, p.thumb.rz * D, "ZXY");
  rig.thumb.j1.rotation.set(p.thumb.f1 * D, 0, -p.thumb.f1 * 0.4 * D);
  rig.thumb.j2.rotation.set(p.thumb.f2 * D, 0, 0);

  const dir = new THREE.Vector3(...p.racket.dir).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  // Keep the string face parallel to the palm (handshake), then roll around the handle.
  const faceNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
  const want = new THREE.Vector3(0, 0, 1).sub(dir.clone().multiplyScalar(dir.z)).normalize();
  const align = new THREE.Quaternion().setFromUnitVectors(faceNormal, want);
  q.premultiply(align);
  q.premultiply(new THREE.Quaternion().setFromAxisAngle(dir, p.racket.roll * D));
  rig.racket.quaternion.copy(q);
  rig.racket.position.set(...p.racket.pos);
  rig.wrist.rotation.set(p.wrist.rx * D, p.wrist.ry * D, p.wrist.rz * D);
}

export function GripViewer3D({ grip, className = "", view = [0.1, 0.5, 0.35], cam = [-8, 24, 72] }: { grip: string; className?: string; view?: [number, number, number]; cam?: [number, number, number] }) {
  const mount = useRef<HTMLDivElement>(null);
  const target = useRef(grip);
  useEffect(() => {
    target.current = grip;
  }, [grip]);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 500);
    camera.position.set(...cam);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(20, 40, 30);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x86efac, 1.0);
    rim.position.set(-30, 10, -20);
    scene.add(rim);

    const skin = new THREE.MeshStandardMaterial({ color: 0xe8b796, roughness: 0.55, metalness: 0 });
    const rig = buildHand(skin);
    // Present the hand as if reaching out to shake hands, racket up to the right.
    const presenter = new THREE.Group();
    presenter.add(rig.wrist);
    presenter.rotation.set(...view);
    presenter.position.set(-4, 3, 0);
    scene.add(presenter);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(7, 17, 0);
    controls.enableDamping = true;
    controls.minDistance = 25;
    controls.maxDistance = 120;
    controls.enablePan = false;
    controls.update();

    let current: Pose = structuredClone(POSES.forehand);
    let shown = "";
    let blendFrom: Pose = current;
    let blendStart = 0;
    const clock = new THREE.Clock();

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let raf = 0;
    const loop = () => {
      const t = clock.getElapsedTime();
      const g = target.current;
      if (g !== shown) {
        blendFrom = current;
        blendStart = t;
        shown = g;
      }
      let goal: Pose;
      const anim = ANIMATIONS[g];
      if (anim) {
        const [a, b, period] = anim;
        const phase = ((t - blendStart) % period) / period;
        // Slow load, quick squeeze, short hold, release.
        const k = phase < 0.55 ? 0 : phase < 0.68 ? ease((phase - 0.55) / 0.13) : phase < 0.85 ? 1 : 1 - ease((phase - 0.85) / 0.15);
        goal = lerpPose(POSES[a], POSES[b], k);
      } else {
        goal = POSES[g] ?? POSES.forehand;
      }
      const blend = Math.min(1, (t - blendStart) / 0.6);
      current = blend < 1 ? lerpPose(blendFrom, goal, ease(blend)) : goal;
      applyPose(rig, current);
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      el.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mount} className={`touch-none ${className}`} aria-label={`3D view of the ${grip} grip. Drag to rotate.`} role="img" />;
}
