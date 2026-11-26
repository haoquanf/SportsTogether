"use client";

// Full-body 3D badminton player, built from simple shapes in code and posed by
// joint angles (degrees). Keyframed moves live in lib/moves.ts. The figure faces
// +z (towards the net) and is right-handed. Feet are kept on the floor
// automatically unless a pose sets `air` (jumps).

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MOVES, poseAt } from "@/lib/moves";
import { applyPose, buildPlayer } from "@/lib/player-rig";

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
