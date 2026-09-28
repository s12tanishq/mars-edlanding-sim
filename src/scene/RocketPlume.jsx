import * as THREE from "three";
import { ENGINES } from "./Lander.jsx";
import { clamp01, damp } from "./motion.js";
export function createRocketPlume() {
  const group = new THREE.Group(),
    count = 640,
    positions = new Float32Array(count * 3),
    alpha = new Float32Array(count);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
  );
  geometry.setAttribute(
    "alpha",
    new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage),
  );
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { level: { value: 0 }, pixelRatio: { value: 1 } },
    vertexShader: `attribute float alpha; varying float a; uniform float level; uniform float pixelRatio; void main(){a=alpha;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp((100.+level*120.)*pixelRatio/max(1.,-p.z),1.,34.);}`,
    fragmentShader: `varying float a; uniform float level; void main(){float r=length(gl_PointCoord-.5)*2.;float soft=exp(-r*r*4.)*(1.-smoothstep(.65,1.,r));gl_FragColor=vec4(mix(vec3(.58,.74,.94),vec3(.94,.72,.42),r),soft*a*level*1.4);}`,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  group.add(points);
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: "#d8e3df",
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const coreGeometry = new THREE.CylinderGeometry(0.075, 0.3, 1, 20, 1, true);
  const cores = ENGINES.map(([x, , z]) => {
    const m = new THREE.Mesh(coreGeometry, coreMaterial);
    m.position.set(x, -0.5, z);
    group.add(m);
    return m;
  });
  let displayed = 0;
  return {
    group,
    update(state, throttle, frame, wind, stageY, pixelRatio = 1) {
      const target =
        state.phase === "poweredDescent" && state.fuel > 0
          ? clamp01(throttle)
          : 0;
      displayed = damp(
        displayed,
        target,
        target > displayed ? 7 : 11,
        frame.dt,
      );
      group.visible = displayed > 0.001;
      group.position.y = stageY - 0.25;
      material.uniforms.level.value = displayed;
      material.uniforms.pixelRatio.value = pixelRatio;
      if (!group.visible) return;
      coreMaterial.opacity = displayed * 0.2;
      cores.forEach((core) => {
        core.scale.y = 0.4 + displayed * 4;
        core.position.y = -core.scale.y / 2;
      });
      for (let i = 0; i < count; i++) {
        const engine = ENGINES[i % 8],
          age = (Math.floor(i / 8) / 80 + frame.clock * 2.1) % 1;
        const length = 0.7 + displayed * 7,
          spread = (0.08 + age * 0.6) * displayed,
          a =
            ((Math.sin(i * 127.1) * 43758.5453) % 1) * Math.PI * 2 +
            frame.clock * 0.2;
        positions.set(
          [
            engine[0] + Math.cos(a) * spread + wind.x * 0.004 * age * age,
            -age * length,
            engine[2] + Math.sin(a) * spread + wind.z * 0.004 * age * age,
          ],
          i * 3,
        );
        alpha[i] = Math.sin(Math.PI * age) ** 1.2;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.alpha.needsUpdate = true;
    },
  };
}
