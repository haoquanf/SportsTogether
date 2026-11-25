"use client";

// Full-body 3D badminton player, built from simple shapes in code and posed by
// joint angles (degrees). Keyframed moves live in lib/moves.ts. The figure faces
// +z (towards the net) and is right-handed. Feet are kept on the floor
// automatically unless a pose sets `air` (jumps).

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { MOVES, poseAt, type Pose } from "@/lib/moves";

const D = Math.PI / 180;

type Limb = { root: THREE.Group; mid: THREE.Group; end: THREE.Group };
type Rig = {
  root: THREE.Group;
  pelvis: THREE.Group;
  spine: THREE.Group;
  head: THREE.Group;
  rArm: Limb;
  lArm: Limb;
  rLeg: Limb;
  lLeg: Limb;
  feet: THREE.Object3D[];
  racketHead: THREE.Object3D;
};

function capsule(r: number, len: number, mat: THREE.Material, down = true) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.1, len - r), 6, 16), mat);
  m.position.y = down ? -len / 2 : len / 2;
  m.castShadow = true;
  return m;
}

function buildRacket(): { group: THREE.Group; head: THREE.Object3D } {
  const g = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.4 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5, emissive: 0x0b3d1d });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 20, 8), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 }));
  handle.position.y = 6;
  g.add(handle);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.4, 1.6, 12), accent);
  collar.position.y = 16.5;
  g.add(collar);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 22, 10), frame);
  shaft.position.y = 28;
  g.add(shaft);
  const curve = new THREE.EllipseCurve(0, 0, 10.5, 12.8, 0, Math.PI * 2, false, 0);
  const pts = curve.getPoints(60).map((p) => new THREE.Vector3(p.x, p.y + 51, 0));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 90, 0.6, 8, true), frame));
  const strings = new THREE.Mesh(
    new THREE.CircleGeometry(1, 32),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.28, side: THREE.DoubleSide }),
  );
  strings.scale.set(10.2, 12.5, 1);
  strings.position.y = 51;
  g.add(strings);
  const head = new THREE.Object3D();
  head.position.y = 51;
  g.add(head);
  return { group: g, head };
}

function buildPlayer(): Rig {
  const skin = new THREE.MeshStandardMaterial({ color: 0xe8b796, roughness: 0.6 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 });
  const shorts = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
  const shoe = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const sole = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });

  const root = new THREE.Group();
  const pelvis = new THREE.Group();
  pelvis.position.y = 94;
  root.add(pelvis);
  const hips = new THREE.Mesh(new RoundedBoxGeometry(30, 16, 18, 3, 6), shorts);
  hips.position.y = 2;
  hips.castShadow = true;
  pelvis.add(hips);

  const spine = new THREE.Group();
  spine.position.y = 8;
  pelvis.add(spine);
  const torso = new THREE.Mesh(new RoundedBoxGeometry(34, 46, 20, 4, 8), shirt);
  torso.position.y = 24;
  torso.castShadow = true;
  spine.add(torso);
  const number = new THREE.Mesh(new THREE.CircleGeometry(5, 24), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  number.position.set(0, 30, -10.1);
  number.rotation.y = Math.PI;
  spine.add(number);

  const head = new THREE.Group();
  head.position.y = 50;
  spine.add(head);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5, 8, 12), skin);
  neck.position.y = 2;
  head.add(neck);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(10.5, 24, 20), skin);
  skull.scale.set(0.9, 1.08, 1);
  skull.position.y = 14;
  skull.castShadow = true;
  head.add(skull);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(10.9, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 }));
  hair.scale.set(0.92, 1.08, 1.03);
  hair.position.set(0, 15, -0.6);
  hair.rotation.x = -0.25;
  head.add(hair);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(9, 2.2, 1.5), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
  visor.position.set(0, 16, 9.4);
  head.add(visor);

  const arm = (side: 1 | -1): Limb => {
    // side: -1 = right (towards -x), +1 = left
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 19, 42, 0);
    shoulder.rotation.order = "ZXY";
    spine.add(shoulder);
    shoulder.add(new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), shirt));
    shoulder.add(capsule(4.8, 28, side === -1 ? skin : skin));
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.4, 10, 14), shirt);
    sleeve.position.y = -5;
    shoulder.add(sleeve);
    const elbow = new THREE.Group();
    elbow.position.y = -28;
    elbow.rotation.order = "XYZ";
    shoulder.add(elbow);
    elbow.add(new THREE.Mesh(new THREE.SphereGeometry(4.2, 14, 10), skin));
    elbow.add(capsule(4.0, 25, skin));
    const wrist = new THREE.Group();
    wrist.position.y = -25;
    wrist.rotation.order = "YXZ";
    elbow.add(wrist);
    const hand = new THREE.Mesh(new RoundedBoxGeometry(7, 9, 4.5, 3, 2), skin);
    hand.position.y = -5;
    wrist.add(hand);
    return { root: shoulder, mid: elbow, end: wrist };
  };

  const leg = (side: 1 | -1): Limb & { foot: THREE.Object3D } => {
    const hip = new THREE.Group();
    hip.position.set(side * 9, -2, 0);
    hip.rotation.order = "YXZ";
    pelvis.add(hip);
    hip.add(capsule(7.2, 44, skin));
    const short = new THREE.Mesh(new THREE.CylinderGeometry(8.4, 8.0, 16, 14), shorts);
    short.position.y = -7;
    hip.add(short);
    const knee = new THREE.Group();
    knee.position.y = -44;
    hip.add(knee);
    knee.add(new THREE.Mesh(new THREE.SphereGeometry(6, 14, 10), skin));
    knee.add(capsule(5.6, 42, skin));
    const sock = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 8, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    sock.position.y = -38;
    knee.add(sock);
    const ankle = new THREE.Group();
    ankle.position.y = -42;
    knee.add(ankle);
    const foot = new THREE.Mesh(new RoundedBoxGeometry(10, 7, 27, 3, 3), shoe);
    foot.position.set(0, -4, 7);
    foot.castShadow = true;
    ankle.add(foot);
    const soleM = new THREE.Mesh(new RoundedBoxGeometry(10.4, 2, 27.5, 2, 1), sole);
    soleM.position.set(0, -7.5, 7);
    ankle.add(soleM);
    // Two contact points per foot (heel and toe) to keep the lowest one on the floor.
    const heel = new THREE.Object3D();
    heel.position.set(0, -8.5, -5);
    const toe = new THREE.Object3D();
    toe.position.set(0, -8.5, 19);
    ankle.add(heel, toe);
    return { root: hip, mid: knee, end: ankle, foot: heel, toe } as Limb & { foot: THREE.Object3D; toe: THREE.Object3D };
  };

  const rArm = arm(-1);
  const lArm = arm(1);
  const racket = buildRacket();
  // Racket held in the right hand: handle across the palm, head continuing past the fingers.
  racket.group.rotation.set(Math.PI, 0, 0);
  racket.group.position.set(0, -6, 0);
  rArm.end.add(racket.group);
  const rLeg = leg(-1) as Limb & { foot: THREE.Object3D; toe: THREE.Object3D };
  const lLeg = leg(1) as Limb & { foot: THREE.Object3D; toe: THREE.Object3D };

  return {
    root, pelvis, spine, head, rArm, lArm, rLeg, lLeg,
    feet: [rLeg.foot, rLeg.toe, lLeg.foot, lLeg.toe],
    racketHead: racket.head,
  };
}

const v = (p: Pose, k: string) => (p[k] ?? 0) * D;

function applyPose(rig: Rig, p: Pose) {
  rig.root.position.set(p.x ?? 0, 0, p.z ?? 0);
  rig.root.rotation.set(0, v(p, "yaw"), 0);
  rig.pelvis.rotation.set(v(p, "pelvisX"), v(p, "pelvisY"), v(p, "pelvisZ"));
  rig.spine.rotation.set(v(p, "spineX"), v(p, "spineY"), v(p, "spineZ"), "YXZ");
  rig.head.rotation.set(v(p, "headX"), v(p, "headY"), 0);
  for (const [s, arm] of [["r", rig.rArm], ["l", rig.lArm]] as const) {
    arm.root.rotation.set(v(p, `${s}ShX`), v(p, `${s}ShY`), v(p, `${s}ShZ`));
    arm.mid.rotation.set(v(p, `${s}El`), v(p, `${s}ElY`), 0);
    arm.end.rotation.set(v(p, `${s}WrX`), v(p, `${s}WrY`), v(p, `${s}WrZ`));
  }
  for (const [s, leg] of [["r", rig.rLeg], ["l", rig.lLeg]] as const) {
    leg.root.rotation.set(v(p, `${s}HipX`), v(p, `${s}HipY`), v(p, `${s}HipZ`));
    leg.mid.rotation.set(v(p, `${s}Knee`), 0, 0);
    // Ankle keeps the foot flat on the floor by default; `Ank` adds toe-down (positive) or toe-up (negative).
    leg.end.rotation.set(v(p, `${s}Ank`) - v(p, "pelvisX") - v(p, `${s}HipX`) - v(p, `${s}Knee`), 0, 0);
  }
  // Drop the body so the lowest heel or toe touches the floor, then add any jump height.
  rig.root.updateMatrixWorld(true);
  const tmp = new THREE.Vector3();
  let minY = Infinity;
  for (const f of rig.feet) minY = Math.min(minY, f.getWorldPosition(tmp).y);
  rig.root.position.y = -minY + (p.air ?? 0);
}

function buildCourt(scene: THREE.Scene) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(700, 900), new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
  const line = (x: number, z: number, w: number, d: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.2, z);
    scene.add(m);
  };
  // One half of a doubles court; the net is at z = +260.
  const half = 670, width = 610, net = 260;
  line(-width / 2, net - half / 2, 4, half);
  line(width / 2, net - half / 2, 4, half);
  line(-width / 2 + 46, net - half / 2, 4, half);
  line(width / 2 - 46, net - half / 2, 4, half);
  line(0, net - half, width, 4);
  line(0, net - half + 76, width, 4);
  line(0, net - 198, width, 4);
  line(0, net - (half - 198) / 2 - 198 + 0, 4, half - 198);
  const netMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width + 20, 76),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
  );
  netMesh.position.set(0, 155 - 38, net);
  scene.add(netMesh);
  const tape = new THREE.Mesh(new THREE.BoxGeometry(width + 20, 4, 1), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  tape.position.set(0, 155, net);
  scene.add(tape);
  for (const x of [-(width / 2 + 10), width / 2 + 10]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 155, 10), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    post.position.set(x, 77.5, net);
    scene.add(post);
  }
}

export type BodyViewerHandle = { time: number };

export function BodyViewer3D({
  move,
  playing,
  speed,
  seek,
  onTime,
  className = "",
  cam = [-380, 190, 210],
}: {
  move: string;
  playing: boolean;
  speed: number;
  seek: { t: number; n: number } | null;
  onTime?: (t: number) => void;
  className?: string;
  cam?: [number, number, number];
}) {
  const mount = useRef<HTMLDivElement>(null);
  const state = useRef({ move, playing, speed, seek, onTime });
  useEffect(() => {
    state.current = { move, playing, speed, seek, onTime };
  }, [move, playing, speed, seek, onTime]);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x06110c, 700, 1400);
    const camera = new THREE.PerspectiveCamera(38, 1, 1, 3000);
    camera.position.set(cam[0], cam[1], cam[2]);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(200, 500, 250);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -300, right: 300, top: 300, bottom: -300, near: 10, far: 1200 });
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x86efac, 0.8);
    rim.position.set(-300, 200, -200);
    scene.add(rim);

    buildCourt(scene);
    const rig = buildPlayer();
    scene.add(rig.root);

    const trailGeo = new THREE.BufferGeometry();
    const trailPts = new Float32Array(60 * 3);
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPts, 3));
    const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.8 }));
    trail.frustumCulled = false;
    scene.add(trail);
    let trailN = 0;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 95, 0);
    controls.enableDamping = true;
    controls.minDistance = 150;
    controls.maxDistance = 900;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.enablePan = false;
    controls.update();

    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let t = 0;
    let lastMove = "";
    let lastSeek = -1;
    let reported = -1;
    const clock = new THREE.Clock();
    let raf = 0;
    const tmp = new THREE.Vector3();
    const loop = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const s = state.current;
      const m = MOVES[s.move] ?? MOVES.ready;
      if (s.move !== lastMove) { t = 0; lastMove = s.move; trailN = 0; }
      if (s.seek && s.seek.n !== lastSeek) { t = s.seek.t; lastSeek = s.seek.n; trailN = 0; }
      if (s.playing) {
        t += dt * s.speed;
        if (t > m.duration) { t = 0; trailN = 0; }
      }
      applyPose(rig, poseAt(m, t));
      // Racket-head trail, so the swing path is visible.
      if (s.playing) {
        rig.racketHead.getWorldPosition(tmp);
        if (trailN < 60) trailN++;
        trailPts.copyWithin(3, 0, (60 - 1) * 3);
        trailPts[0] = tmp.x; trailPts[1] = tmp.y; trailPts[2] = tmp.z;
        trailGeo.setDrawRange(0, trailN);
        trailGeo.attributes.position.needsUpdate = true;
      }
      // Follow the player gently so lunges and footwork stay in view.
      controls.target.lerp(tmp.set(rig.root.position.x, 95, rig.root.position.z), 0.05);
      controls.update();
      renderer.render(scene, camera);
      const rounded = Math.round(t * 20) / 20;
      if (s.onTime && rounded !== reported) { reported = rounded; s.onTime(t); }
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
      el.removeChild(renderer.domElement);
    };
    // The scene is built once; `cam` only sets the starting view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mount} className={`touch-none ${className}`} role="img" aria-label="3D badminton player. Drag to rotate." />;
}
