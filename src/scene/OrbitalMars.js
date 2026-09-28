import * as THREE from "three";
import { createRandom } from "../shared/random.js";

const MARS_RADIUS = 3389500;
export const ORBITAL_ROTATION_RATE = 0.006;

export function advanceOrbitalRotation(rotation, dt) {
  return rotation + Math.max(0, dt) * ORBITAL_ROTATION_RATE;
}

function createPlanetMaterial(map) {
  // The Viking mosaic already contains its original photometric relief. An
  // unlit material preserves those measured colours without double-lighting
  // the baked imagery into white bands or oversaturated dark plains.
  return new THREE.MeshBasicMaterial({
    map,
    color: "#ffffff",
  });
}

function createStarField(pixelRatio) {
  const random = createRandom(90210);
  const count = 950;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const y = random() * 2 - 1;
    const angle = random() * Math.PI * 2;
    const radius = 1750000;
    const planar = Math.sqrt(1 - y * y);
    positions.set(
      [Math.cos(angle) * planar * radius, y * radius, Math.sin(angle) * planar * radius],
      i * 3,
    );
    seeds[i] = random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    uniforms: {
      time: { value: 0 },
      pixelRatio: { value: pixelRatio },
    },
    vertexShader: `
      attribute float seed;
      varying float vBrightness;
      uniform float time;
      uniform float pixelRatio;
      void main() {
        vBrightness = 0.42 + seed * 0.42 + sin(time * (0.22 + seed * 0.21) + seed * 31.0) * 0.08;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (0.75 + seed * 1.45) * pixelRatio;
      }
    `,
    fragmentShader: `
      varying float vBrightness;
      void main() {
        float radius = length(gl_PointCoord - 0.5) * 2.0;
        float alpha = (1.0 - smoothstep(0.2, 1.0, radius)) * vBrightness;
        gl_FragColor = vec4(mix(vec3(0.66, 0.74, 0.88), vec3(1.0, 0.91, 0.76), vBrightness), alpha);
      }
    `,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

function createComet({ origin, direction, phase, opacity }) {
  const points = 15;
  const positions = new Float32Array(points * 3);
  const alpha = new Float32Array(points);
  for (let i = 0; i < points; i++) alpha[i] = opacity * (1 - i / points) ** 2;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
  );
  geometry.setAttribute("alpha", new THREE.BufferAttribute(alpha, 1));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float alpha;
      varying float vAlpha;
      void main() {
        vAlpha = alpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() { gl_FragColor = vec4(0.72, 0.81, 0.95, vAlpha); }
    `,
  });
  const line = new THREE.Line(geometry, material);
  line.frustumCulled = false;
  line.userData = {
    origin: new THREE.Vector3(...origin),
    direction: new THREE.Vector3(...direction).normalize(),
    phase,
  };
  return line;
}

export function createOrbitalMars(map, pixelRatio = 1) {
  const group = new THREE.Group();
  const planetGroup = new THREE.Group();
  planetGroup.position.y = -MARS_RADIUS;
  group.add(planetGroup);

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(MARS_RADIUS, 144, 88),
    createPlanetMaterial(map),
  );
  const planetTilt = new THREE.Group();
  planetTilt.rotation.z = THREE.MathUtils.degToRad(25.19);
  planet.rotation.y = -0.2;
  planetTilt.add(planet);
  planetGroup.add(planetTilt);

  const celestial = new THREE.Group();
  const stars = createStarField(pixelRatio);
  celestial.add(stars);
  const comets = [
    createComet({
      origin: [-460000, -250000, -1520000],
      direction: [1, -0.08, 0.12],
      phase: 0.17,
      opacity: 0.12,
    }),
    createComet({
      origin: [360000, 90000, -1650000],
      direction: [-0.78, -0.16, 0.2],
      phase: 0.68,
      opacity: 0.075,
    }),
  ];
  celestial.add(...comets);
  group.add(celestial);

  let elapsed = 0;
  return {
    group,
    update(dt, camera, visible) {
      group.visible = visible;
      if (!visible) return;
      elapsed += Math.max(0, dt);
      planet.rotation.y = advanceOrbitalRotation(planet.rotation.y, dt);
      celestial.position.copy(camera.position);
      stars.material.uniforms.time.value = elapsed;
      for (const comet of comets) {
        const { origin, direction, phase } = comet.userData;
        const travel = (((elapsed * 0.006 + phase) % 1) - 0.5) * 720000;
        const head = origin.clone().addScaledVector(direction, travel);
        const attribute = comet.geometry.attributes.position;
        for (let i = 0; i < attribute.count; i++) {
          const taper = i * 6500;
          attribute.setXYZ(
            i,
            head.x - direction.x * taper,
            head.y - direction.y * taper + Math.sin(elapsed * 0.1 + i * 0.25) * 350,
            head.z - direction.z * taper,
          );
        }
        attribute.needsUpdate = true;
      }
    },
    dispose() {
      group.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose());
        else object.material?.dispose();
      });
    },
  };
}
