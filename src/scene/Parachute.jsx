import * as THREE from "three";
import { deploymentVisual, damp } from "./motion.js";
export function createParachute() {
  const group = new THREE.Group(),
    canopy = new THREE.Group();
  group.add(canopy);
  const materials = ["#e6ddc8", "#bc452d"].map(
    (color) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.9,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
      }),
  );
  const lines = new THREE.LineBasicMaterial({
    color: "#e2d5be",
    transparent: true,
    depthWrite: false,
  });
  const pilotMaterial = new THREE.MeshStandardMaterial({
    color: "#bc452d",
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  const pilot = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2),
    pilotMaterial,
  );
  pilot.scale.y = 0.42;
  group.add(pilot);
  const deploymentBag = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.42, 0.72, 12),
    new THREE.MeshStandardMaterial({ color: "#d7cbb8", roughness: 0.86 }),
  );
  group.add(deploymentBag);
  const cutawayShell = new THREE.Group();
  const cutawayMaterial = new THREE.MeshStandardMaterial({
    color: "#d8d2c5",
    roughness: 0.84,
    side: THREE.DoubleSide,
  });
  const cutawayCone = new THREE.Mesh(
    new THREE.ConeGeometry(2.65, 2.7, 48, 1, true),
    cutawayMaterial,
  );
  cutawayCone.position.y = 2.2;
  cutawayShell.add(cutawayCone);
  const cutawayRim = new THREE.Mesh(
      new THREE.CylinderGeometry(2.65, 2.65, 0.18, 48),
      cutawayMaterial,
  );
  cutawayRim.position.y = 0.9;
  cutawayShell.add(cutawayRim);
  group.add(cutawayShell);
  const panels = [];
  for (let i = 0; i < 24; i++) {
    const geometry = new THREE.SphereGeometry(
      6.8,
      5,
      12,
      (i / 24) * Math.PI * 2,
      Math.PI / 12,
      0.11,
      Math.PI / 2 - 0.11,
    );
    const panel = new THREE.Mesh(geometry, materials[i % 4 === 0 ? 1 : 0]);
    panel.scale.y = 0.48;
    panel.castShadow = true;
    canopy.add(panel);
    panels.push({ panel, base: geometry.attributes.position.array.slice(), velocities:new Float32Array(geometry.attributes.position.array.length) });
    const a = (i / 24) * Math.PI * 2;
    canopy.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(Math.cos(a) * 0.65, -13.5, Math.sin(a) * 0.65),
          new THREE.Vector3(Math.cos(a) * 6.8, 0, Math.sin(a) * 6.8),
        ]),
        lines,
      ),
    );
  }
  let releasedPosition = null,
    releaseWind = new THREE.Vector3(),
    tiltX = 0,
    tiltZ = 0, angularX=0,angularZ=0;
  return {
    group,
    update(state, frame, position, wind, preview = false, pressure=0) {
      const v = deploymentVisual(frame),
        terminal = ["landed", "crashed"].includes(state.phase);
      group.visible =
        !preview && !terminal && v.pilot > 0.001 && v.releaseAge < 6.5;
      if (!group.visible) return;
      const inflate = 0.025 + 0.975 * v.canopy;
      canopy.scale.set(inflate, 0.16 + 0.84 * v.canopy, inflate);
      canopy.position.y = 5.5 + v.lineStretch * 11;
      canopy.rotation.y = Math.sin(frame.clock * 1.7) * (1 - v.canopy) * 0.32;
      pilot.visible = v.canopy < 0.72 && v.releaseAge === 0;
      pilot.position.set(
        wind.x * 0.035 * v.pilot,
        4.2 + v.pilot * 14,
        wind.z * 0.035 * v.pilot,
      );
      pilot.scale.setScalar(0.18 + v.pilot * 0.82);
      pilot.scale.y *= 0.42;
      deploymentBag.visible = v.lineStretch < 0.96 && v.releaseAge === 0;
      deploymentBag.position.set(0, 4.1 + v.lineStretch * 10.2, 0);
      deploymentBag.rotation.z = frame.clock * 2.4;
      // Once the suspension lines take load, the backshell belongs to the
      // parachute assembly. It remains attached through descent and leaves
      // with the canopy at powered-descent cutaway.
      cutawayShell.visible =
        frame.phase === "poweredDescent" ||
        (frame.phase === "parachute" && v.lineStretch > 0.001);
      // Lift the backshell to the bridle junction as the heat shield falls.
      // This keeps it attached to the chute without covering the exposed rover.
      cutawayShell.position.y = v.shieldRelease * 2.4;
      if (frame.phase === "poweredDescent") {
        if (!releasedPosition) {
          releasedPosition = position.clone();
          releaseWind.set(wind.x, 0, wind.z);
        }
        const t = v.releaseAge;
        releaseWind.lerp(new THREE.Vector3(wind.x, 0, wind.z), 1 - Math.exp(-1.7 * frame.dt));
        // Keep the presentation relative to the descending vehicle so a 10x
        // replay cannot fling the cutaway hundreds of metres off camera in a
        // single visual second. The drift still follows the simulated wind.
        group.position
          .copy(position)
          .addScaledVector(releaseWind, t * 0.5 + t * t * 0.07)
          .add(new THREE.Vector3(0, t * 7.5 + t * t * 1.2, 0));
      } else {
        releasedPosition = null;
        group.position.copy(position);
      }
      // Bounded response to actual simulated wind. Fabric ripple is cosmetic.
      const targetX=THREE.MathUtils.clamp((wind.z-state.velocity.z)*.012,-.3,.3),targetZ=THREE.MathUtils.clamp(-(wind.x-state.velocity.x)*.012,-.3,.3);
      const steps=Math.max(1,Math.ceil(frame.dt*120)),dt=frame.dt/steps;
      for(let s=0;s<steps;s++){
        angularX+=(12*(targetX-tiltX)-4*angularX)*dt;angularZ+=(12*(targetZ-tiltZ)-4*angularZ)*dt;
        tiltX+=angularX*dt;tiltZ+=angularZ*dt;
      }
      const tumble = v.releaseAge > 0 ? Math.min(1.1, v.releaseAge * 0.22) : 0;
      group.rotation.set(
        tiltX + Math.sin(v.releaseAge * 1.3) * tumble,
        v.releaseAge * 0.32,
        tiltZ + Math.sin(v.releaseAge * 0.9 + 1.2) * tumble,
      );
      materials.forEach((m) => (m.opacity = 1));
      lines.opacity = 0.72;
      for (const { panel, base, velocities } of panels) {
        const p = panel.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const j = i * 3;
          const ripple =
            Math.sin(frame.clock * 3 + base[j] * 1.2 + base[j + 2]) *
            (0.025+Math.min(1,pressure/100)*.14) *
            Math.min(1, Math.hypot(wind.x, wind.z) / 12);
          const target=base[j+1]+ripple;
          let y=p.getY(i);
          for(let s=0;s<steps;s++){velocities[j+1]+=(55*(target-y)-8*velocities[j+1])*dt;y+=velocities[j+1]*dt;}
          p.setXYZ(i, base[j], y, base[j + 2]);
        }
        p.needsUpdate = true;
      }
    },
  };
}
