import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { clamp01, deploymentVisual, ease, stageHeight } from "./motion.js";
import { createFlightRover } from "./FlightRover.js";

const ASSET_BASE = import.meta.env.BASE_URL;

export const ENGINES = [-1, 1].flatMap((x) =>
  [-1, 1].flatMap((z) => [-0.2, 0.2].map((d) => [x * 2.15, 0, z * 1.3 + d])),
);
export function disposeObject(root) {
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set();
  root.traverse((o) => {
    if (o.geometry) geometries.add(o.geometry);
    for (const m of o.material
      ? Array.isArray(o.material)
        ? o.material
        : [o.material]
      : []) {
      materials.add(m);
      for (const v of Object.values(m)) if (v?.isTexture) textures.add(v);
    }
  });
  geometries.forEach((x) => x.dispose());
  materials.forEach((x) => x.dispose());
  textures.forEach((x) => x.dispose());
}
export function createLander(manager, onAsset) {
  const group = new THREE.Group(),
    rover = new THREE.Group(),
    stage = new THREE.Group(),
    shell = new THREE.Group(),
    backshell = new THREE.Group(),
    heatShield = new THREE.Group();
  group.add(rover, stage, shell);
  shell.add(backshell, heatShield);
  const flightModel=createFlightRover();rover.add(flightModel);
  let detailedModel=null,optimizedModel=null,requested=false;
  const metal = new THREE.MeshStandardMaterial({
    color: "#c0c1b9",
    metalness: 0.7,
    roughness: 0.38,
  });
  const foil = new THREE.MeshStandardMaterial({
    color: "#968261",
    metalness: 0.63,
    roughness: 0.51,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: "#242626",
    roughness: 0.8,
  });
  const shellMat = new THREE.MeshStandardMaterial({
    color: "#dfd9c9",
    roughness: 0.82,
    transparent: true,
  });
  const heatMat = new THREE.MeshStandardMaterial({
    color: "#362a21",
    roughness: 0.8,
    emissive: "#ff4712",
    transparent: true,
  });
  const mesh = (geo, mat, parent, pos) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  // Small fallback body is shown only while NASA asset loads or when load fails.
  const fallback = mesh(
    new THREE.BoxGeometry(2.2, 0.7, 1.5),
    foil,
    rover,
    [0, 0.8, 0],
  );
  const decoder = new DRACOLoader(manager)
    .setDecoderPath(`${ASSET_BASE}draco/`)
    .setDecoderConfig({ type: "wasm" });
  decoder.setWorkerLimit(2);
  const loader = new GLTFLoader(manager).setDRACOLoader(decoder);
  let disposed = false;
  fallback.visible=false;
  const loadModel=(original=false)=>{if(original){if(requested)return;requested=true;onAsset?.("Loading NASA inspection model…");}loader.load(
    original
      ? `${ASSET_BASE}assets/perseverance.glb`
      : `${ASSET_BASE}assets/perseverance-flight.glb`,
    (gltf) => {
      if (disposed) {
        disposeObject(gltf.scene);
        return;
      }
      const model = gltf.scene;
      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model),
        size = bounds.getSize(new THREE.Vector3());
      // Normalize to a roughly 3 m wheel-span/length for the mission vehicle.
      const scale = 3.1 / Math.max(size.x, size.z);
      model.scale.multiplyScalar(scale);
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model),
        centre = box.getCenter(new THREE.Vector3());
      model.position.add(new THREE.Vector3(-centre.x, -box.min.y, -centre.z));
      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      rover.add(model);
      if(original)detailedModel=model;else optimizedModel=model;
      model.visible=false;
      fallback.visible = false;
      onAsset?.(original?"NASA original ready":"Optimized NASA rover ready");
    },
    undefined,
    () => onAsset?.("Rover asset unavailable · placeholder active"),
  );};
  loadModel();
  // Custom illustrative descent stage, not a NASA-certified stage model.
  mesh(new THREE.BoxGeometry(3.8, 0.36, 2.7), foil, stage, [0, 0.3, 0]);
  mesh(new THREE.BoxGeometry(2.5, 0.15, 1.9), metal, stage, [0, 0.56, 0]);
  for (const x of [-1, 1]) {
    mesh(new THREE.SphereGeometry(0.52, 20, 12), metal, stage, [
      x * 0.93,
      0.84,
      0,
    ]);
    mesh(new THREE.BoxGeometry(0.12, 0.3, 3.3), dark, stage, [x * 1.8, 0.2, 0]);
  }
  ENGINES.forEach(([x, y, z]) =>
    mesh(
      new THREE.CylinderGeometry(0.105, 0.22, 0.45, 16, 1, true),
      dark,
      stage,
      [x, y, z],
    ),
  );
  const back = mesh(
    new THREE.ConeGeometry(2.65, 2.7, 64, 1, true),
    shellMat,
    backshell,
    [0, 2.2, 0],
  );
  mesh(
    new THREE.CylinderGeometry(2.65, 2.65, 0.18, 64),
    shellMat,
    backshell,
    [0, 0.9, 0],
  );
  const shield = mesh(
    new THREE.SphereGeometry(
      2.7,
      64,
      20,
      0,
      Math.PI * 2,
      Math.PI / 2,
      Math.PI / 2,
    ),
    heatMat,
    heatShield,
    [0, 0.7, 0],
  );
  shield.scale.y = 0.22;
  const heatUniform={value:0};
  heatMat.onBeforeCompile=shader=>{
    shader.uniforms.heatLevel=heatUniform;
    shader.fragmentShader="uniform float heatLevel;\n"+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
      float edge=pow(1.-abs(dot(normalize(vNormal),normalize(vViewPosition))),2.);
      totalEmissiveRadiance=mix(vec3(.9,.035,.002),vec3(1.,.57,.12),heatLevel)*heatLevel*(3.+edge*4.);`);
  };
  const cables = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({
      color: "#e8dfc7",
      transparent: true,
      opacity: 0.8,
    }),
  );
  const cablePos = new Float32Array(18);
  cables.geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(cablePos, 3),
  );
  group.add(cables);
  const heatLight = new THREE.PointLight("#ff5625", 0, 14, 2);
  heatLight.position.y = 0.2;
  group.add(heatLight);
  stage.traverse((o) => {
    if (o.material) {
      o.material = o.material.clone();
      o.material.transparent = true;
      o.material.opacity = 1;
    }
  });
  let stageY = 2.9;
  return {
    group,
    stage,
    update(state, frame, preview = false, detailed=false, wind={x:0,z:0}) {
      if(detailed)loadModel(true);
      flightModel.visible=!optimizedModel&&!(detailed&&detailedModel);
      if(optimizedModel)optimizedModel.visible=!(detailed&&detailedModel);
      if(detailedModel)detailedModel.visible=detailed;
      const chuteAge = frame.age("parachute"),
        powerAge = frame.age("poweredDescent");
      const deployment = deploymentVisual(frame);
      const power = powerAge === null ? 0 : ease(powerAge / 0.72);
      const terminal = state.phase === "landed" || state.phase === "crashed";
      const endAge = frame.age(state.phase) ?? 0;
      stageY = stageHeight(state.altitude);
      const shieldAge = chuteAge === null ? 0 : Math.max(0, chuteAge - 0.32);
      const shieldRelease = ease(shieldAge / 1.15);
      heatShield.position.set(
        wind.x * shieldAge * 0.055,
        -shieldRelease * (2.4 + shieldAge * 3.1),
        wind.z * shieldAge * 0.055,
      );
      heatShield.rotation.set(shieldAge * 0.7, shieldAge * 0.36, shieldAge * 0.9);
      backshell.position.y = shieldRelease * 2.4;
      heatShield.visible = !preview &&
        (state.phase === "aerobraking" || (chuteAge !== null && shieldAge < 5));
      backshell.visible = !preview &&
        (state.phase === "aerobraking" ||
          (state.phase === "parachute" && deployment.lineStretch <= 0.001));
      shell.visible = heatShield.visible || backshell.visible;
      shellMat.opacity = 1;
      heatMat.opacity = 1;
      rover.visible = preview ||
        (state.phase === "parachute" && (chuteAge ?? 0) > 0.58) ||
        !["aerobraking", "parachute"].includes(state.phase);

      stage.position.set(0, stageY - (1 - power) * 1.4, 0);
      stage.scale.set(0.55 + power * 0.45, Math.max(0.08, power), 0.55 + power * 0.45);
      if (terminal) {
        stage.position.x += endAge * 4.5;
        stage.position.y += endAge * 3.8;
        stage.rotation.z = -Math.min(0.5, endAge * 0.18);
      } else stage.rotation.z = 0;
      stage.visible = !preview && powerAge !== null && (!terminal || endAge < 4.5);
      cables.visible = stage.visible && !terminal;
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3,
          x = Math.cos(a) * 0.85,
          z = Math.sin(a) * 0.65;
        const j=i*6;
        cablePos[j]=x;cablePos[j+1]=1.3;cablePos[j+2]=z;
        cablePos[j+3]=x*1.35;cablePos[j+4]=stageY+.1;cablePos[j+5]=z*1.35;
      }
      cables.geometry.attributes.position.needsUpdate = true;
      cables.material.opacity = 0.8;
      const heat = preview ? 0 : clamp01((state.heatFlux ?? 0)/9000);
      heatUniform.value=heat;
      heatMat.emissiveIntensity = heat * 3.2;
      heatLight.intensity = heatShield.visible ? heat * 15 : 0;
    },
    get stageY() {
      return stage.position.y;
    },
    get assetStatus(){return optimizedModel?"Optimized NASA rover ready":"Flight rover ready";},
    get renderBudget(){return detailedModel?.visible?{triangles:199521,drawCalls:252}:optimizedModel?{triangles:46809,drawCalls:118}:flightModel.userData;},
    dispose() {
      disposed = true;
      decoder.dispose();
    },
  };
}
