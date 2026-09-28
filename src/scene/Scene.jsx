import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createLander, disposeObject } from "./Lander.jsx";
import { createParachute } from "./Parachute.jsx";
import { createRocketPlume } from "./RocketPlume.jsx";
import { createTrajectoryLine } from "./TrajectoryLine.jsx";
import { createTerrain } from "./Terrain.jsx";
import { createMarsSky } from "./MarsSky.js";
import { createDust } from "./Dust.js";
import {createHeatTrail} from "./HeatTrail.js";
import { createOrbitalMars } from "./OrbitalMars.js";
import {
  createJezeroDetailTexture,
  createJezeroOrbitalTexture,
  createMarsVikingTexture,
} from "./MarsGlobalTexture.js";
import {terrainHeight,terrainNormal} from "../shared/terrain.js";
import {
  createVisualTimeline,
  damp,
  ease,
  deploymentVisual,
} from "./motion.js";

export default function Scene({
  live,
  runId,
  cameraMode = "follow",
  briefing = false,
  running = false,
  onAsset,
  onPerformance,
  detailed=false,
}) {
  const host = useRef(null),
    props = useRef({ cameraMode, briefing, running, onAsset,onPerformance,detailed });
  props.current = { cameraMode, briefing, running, onAsset,onPerformance,detailed };
  const [error, setError] = useState(null);
  useEffect(() => {
    const container = host.current;
    let renderer,
      disposed = false;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      setError(
        "WebGL is unavailable. Try a browser with hardware acceleration enabled.",
      );
      return;
    }
    const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute(
      "aria-label",
      "Live 3D Perseverance-inspired Mars scene. Drag to orbit; scroll to zoom.",
    );
    renderer.domElement.setAttribute("role", "img");
    container.appendChild(renderer.domElement);
    const manager = new THREE.LoadingManager();
    manager.onError = (url) => {
      if (!disposed)
        props.current.onAsset?.(`Asset failed: ${url.split("/").at(-1)}`);
    };
    const world = new THREE.Scene();
    world.background = new THREE.Color("#a58160");
    world.fog = new THREE.FogExp2("#ab8a68", 0.000045);
    const camera = new THREE.PerspectiveCamera(43, 1, 0.25, 2000000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minDistance = 4.8;
    controls.maxDistance = 2500000;
    controls.maxPolarAngle = Math.PI * 0.49;
    const pmrem = new THREE.PMREMGenerator(renderer),
      room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04);
    world.environment = env.texture;
    world.environmentIntensity = 0.32;
    room.dispose();
    pmrem.dispose();
    const hemisphere = new THREE.HemisphereLight("#eedcc4", "#816346", 2);
    world.add(hemisphere);
    const sun = new THREE.DirectionalLight("#fff1d3", 3.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -22,
      right: 22,
      top: 22,
      bottom: -22,
      near: 1,
      far: 130,
    });
    sun.shadow.normalBias = 0.035;
    sun.shadow.bias = -0.00008;
    world.add(sun, sun.target);
    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const marsGlobalMap = createMarsVikingTexture(manager, maxAnisotropy);
    const jezeroOrbitalMap = createJezeroOrbitalTexture(manager, maxAnisotropy);
    const jezeroDetailMap = createJezeroDetailTexture(manager, maxAnisotropy);
    const terrain = createTerrain(
      manager,
      maxAnisotropy,
      marsGlobalMap,
      jezeroOrbitalMap,
      jezeroDetailMap,
    );
    world.add(terrain);
    const sky = createMarsSky(manager);
    world.add(sky.mesh);
    const orbitalMars = createOrbitalMars(marsGlobalMap, pixelRatio);
    world.add(orbitalMars.group);
    const craft = new THREE.Group(),
      attitude = new THREE.Group();
    craft.add(attitude);
    world.add(craft);
    const lander = createLander(manager, (message) => {
      if (!disposed) props.current.onAsset?.(message);
    });
    attitude.add(lander.group);
    const chute = createParachute();
    world.add(chute.group);
    const plume = createRocketPlume();
    attitude.add(plume.group);
    const dust = createDust();
    world.add(dust.object);
    const heatTrail=createHeatTrail();world.add(heatTrail.group);
    const trail = createTrajectoryLine();
    world.add(trail.object);
    trail.object.material.opacity = 0.95;
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(1, 12, 8),
      new THREE.MeshBasicMaterial({ color: "#fff2d3", fog: false }),
    );
    world.add(marker);
    const timeline = createVisualTimeline(),
      target = new THREE.Vector3(),
      offset = new THREE.Vector3(),
      desired = new THREE.Quaternion(),
      up = new THREE.Vector3(0, 1, 0),
      direction = new THREE.Vector3();
    let previousWall = performance.now(),
      previousMode = null,
      previousIntro = null,
      cameraHeight = 1.2,
      modeAge = 0;
    let statsStart=performance.now(),statsFrames=0,submitTime=0;
    const startOffset = new THREE.Vector3(),
      endOffset = new THREE.Vector3();
    let movingCamera = false,
      automaticFraming = true;
    const resize = () => {
      const w = container.clientWidth,
        h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      if (props.current.briefing && w > 700)
        camera.setViewOffset(w, h, -w * 0.14, 0, w, h);
      else if (w <= 700) camera.setViewOffset(w, h, 0, h * 0.16, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const endCameraMove = () => {
      movingCamera = false;
      automaticFraming = false;
    };
    controls.addEventListener("start", endCameraMove);
    renderer.setAnimationLoop((now) => {
      const renderStart=performance.now();
      const snapshot = live.current;
      if (!snapshot) return;
      const wallDt = Math.min(0.05, Math.max(0, (now - previousWall) / 1000));
      previousWall = now;
      const { briefing: preview, cameraMode: mode } = props.current;
      const orbital=preview&&mode!=="inspection";
      terrain.visible=!orbital;craft.visible=!orbital;
      sun.castShadow=!orbital&&(!preview? snapshot.state.altitude<100: true);
      const { state, wind, diagnostics, trajectory } = snapshot,
        frame = timeline.update(
          snapshot,
          wallDt,
          preview,
          props.current.running,
        );
      // Surface preview is explicitly labelled. The flight always uses the true position.
      craft.position.set(
        preview ? 0 : state.position.x,
        preview ? terrainHeight(0,0)+0.04 : state.position.y + 0.04,
        preview ? 0 : state.position.z,
      );
      lander.update(state, frame, preview,props.current.detailed&&!orbital,wind);
      chute.update(state, frame, craft.position, wind, preview,diagnostics.dynamicPressure||0);
      heatTrail.update(state,frame,wind,craft.position,preview,pixelRatio);
      plume.update(
        preview ? { ...state, phase: "preview" } : state,
        diagnostics.actualThrottle || 0,
        frame,
        wind,
        lander.stageY,
        pixelRatio,
      );
      dust.update(
        state,
        frame,
        wind,
        craft.position,
        diagnostics.actualThrottle || 0,
        preview,
        pixelRatio,
        snapshot.environment?.storm ?? 0,
      );
      if (
        !preview &&
        state.phase === "poweredDescent" &&
        diagnostics.direction
      ) {
        direction.set(
          diagnostics.direction.x,
          diagnostics.direction.y,
          diagnostics.direction.z,
        );
        desired.setFromUnitVectors(up, direction.normalize());
      } else if(!preview&&["aerobraking","parachute"].includes(state.phase)) {
        direction.set((wind.x-state.velocity.x)*.003,1,(wind.z-state.velocity.z)*.003).normalize();
        desired.setFromUnitVectors(up,direction);
      } else if(snapshot.complete) {
        const n=terrainNormal(state.position.x,state.position.z);desired.setFromUnitVectors(up,new THREE.Vector3(n.x,n.y,n.z));
        if(state.phase==="crashed")desired.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),.65));
      } else desired.identity();
      // Tilt is the commanded direction, not a six-DoF attitude solution.
      attitude.quaternion.slerp(desired, 1 - Math.exp(-5 * frame.dt));
      if (preview) attitude.quaternion.identity();
      trail.update(trajectory);
      trail.object.visible = !preview;
      const overview = mode === "trajectory" && !preview;
      const deploy = deploymentVisual(frame);
      const cutawayAge = frame.age("poweredDescent");
      const cutawayFraming =
        cutawayAge === null
          ? 1
          : 1 - ease(THREE.MathUtils.clamp(cutawayAge / 3.2, 0, 1));
      const craneHeight =
        state.phase === "poweredDescent"
          ? Math.max(0, lander.stageY - 3) * 0.45
          : 0;
      cameraHeight = damp(
        cameraHeight,
        preview
          ? 1.1
          : 1.4 + deploy.canopy * cutawayFraming * 7 + craneHeight,
        4,
        frame.dt,
      );
      if(orbital)target.set(0,-3389500,0);
      else if (overview) target.set(0, 16000, 0);
      else
        target.copy(craft.position).add(new THREE.Vector3(0, cameraHeight, 0));
      if (previousMode === null) {
        controls.target.copy(target);
        camera.position.copy(target).add(new THREE.Vector3(6, 3.5, 7.5));
      }
      if (mode !== previousMode || preview !== previousIntro) {
        resize();
        camera.far = orbital ? 30000000 : 2000000;
        camera.updateProjectionMatrix();
        startOffset.copy(camera.position).sub(controls.target);
        endOffset.copy(
          orbital ? new THREE.Vector3(3000000,1000000,15000000) : overview
            ? new THREE.Vector3(30000, 18000, 46000)
            : preview
              ? new THREE.Vector3(5, 1.7, 6.8)
              : new THREE.Vector3(19, 8, 24),
        );
        if (!overview)
          endOffset.multiplyScalar(Math.max(1, 0.72 / camera.aspect));
        modeAge = 0;
        movingCamera = true;
        automaticFraming = true;
        previousMode = mode;
        previousIntro = preview;
      }
      offset.copy(target).sub(controls.target);
      camera.position.add(offset);
      controls.target.copy(target);
      if (movingCamera) {
        modeAge += wallDt;
        camera.position
          .copy(target)
          .add(startOffset.clone().lerp(endOffset, ease(modeAge / 1.1)));
        if (modeAge >= 1.1) movingCamera = false;
      }
      if (automaticFraming && !movingCamera && !overview && !preview) {
        const cutawayDistance =
          cutawayAge !== null && cutawayAge < 3.2
            ? THREE.MathUtils.lerp(65, 32, ease(cutawayAge / 3.2))
            : null;
        const distance = snapshot.complete
          ? 10.5
          : cutawayDistance ?? (state.phase === "parachute"
            ? 65
            : state.altitude < 120
              ? 24
              : 32);
        offset.copy(camera.position).sub(target);
        offset.setLength(
          damp(
            offset.length(),
            distance * Math.max(1, 0.72 / camera.aspect),
            3,
            frame.dt,
          ),
        );
        camera.position.copy(target).add(offset);
      }
      marker.visible = overview;
      marker.position.copy(craft.position);
      marker.scale.setScalar(250);
      const altitude = preview
        ? 0
        : overview
          ? Math.max(state.altitude, camera.position.y)
          : state.altitude;
      world.fog.density = THREE.MathUtils.lerp(
        0.000035,
        0.00000055,
        THREE.MathUtils.smoothstep(altitude, 0, 3500),
      );
      if(orbital)world.fog.density=0;
      else world.fog.density+=(snapshot.environment?.storm ?? 0)*.004;
      hemisphere.intensity = orbital ? 0.12 : 2;
      sun.intensity = orbital ? 2.15 : 3.2;
      world.environmentIntensity = orbital ? 0.055 : 0.32;
      if(orbital){
        sun.position.set(-5500000,1800000,3200000);
        sun.target.position.set(0,-3389500,0);
      }else{
        sun.position.copy(craft.position).add(new THREE.Vector3(-36, 48, 22));
        sun.target.position.copy(craft.position);
      }
      controls.minDistance = orbital ? 5000000 : 4.8;
      controls.maxDistance = orbital ? 25000000 : 2500000;
      controls.update();
      // Stop orbiting beneath the collision plane near the surface.
      if(!orbital){const floor=terrainHeight(camera.position.x,camera.position.z)+.5;if(camera.position.y<floor)camera.position.y=floor;}
      orbitalMars.update(wallDt,camera,orbital);
      sky.update(camera, orbital?200000:altitude);
      renderer.render(world, camera);
      statsFrames++;submitTime+=performance.now()-renderStart;
      if(now-statsStart>=1000){props.current.onPerformance?.({fps:statsFrames*1000/(now-statsStart),frameMs:(now-statsStart)/statsFrames,submitMs:submitTime/statsFrames,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,rover:lander.renderBudget});statsStart=now;statsFrames=0;submitTime=0;}
    });
    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      controls.dispose();
      lander.dispose();
      disposeObject(world);
      jezeroOrbitalMap.dispose();
      jezeroDetailMap.dispose();
      sky.mesh.material.uniforms.photo.value.dispose();
      env.dispose();
      sun.shadow.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [live, runId]);
  return (
    <div ref={host} className="scene-canvas">
      {error && (
        <div className="webgl-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
