import * as THREE from "three";
import { createRandom } from "../shared/random.js";
import { terrainHeight, terrainNoise } from "../shared/terrain.js";
export { terrainHeight } from "../shared/terrain.js";

const ASSET_BASE = import.meta.env.BASE_URL;
const MARS_RADIUS = 3389500;

function loadTerrainTexture(loader, name, anisotropy, srgb = false) {
  const texture = loader.load(`${ASSET_BASE}assets/terrain-${name}.jpg`);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function enhanceTerrainMaterial(material, marsGlobalMap, jezeroOrbitalMap, jezeroDetailMap) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.marsGlobalMap = { value: marsGlobalMap };
    shader.uniforms.jezeroOrbitalMap = { value: jezeroOrbitalMap };
    shader.uniforms.jezeroDetailMap = { value: jezeroDetailMap };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
         varying vec3 areionTerrainPosition;
         varying vec3 areionTerrainNormal;`,
      )
      .replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
         areionTerrainNormal = normalize(objectNormal);`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         areionTerrainPosition = transformed;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform sampler2D marsGlobalMap;
        uniform sampler2D jezeroOrbitalMap;
        uniform sampler2D jezeroDetailMap;
        varying vec3 areionTerrainPosition;
        varying vec3 areionTerrainNormal;

        float areionTerrainHash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float areionTerrainNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(areionTerrainHash(i), areionTerrainHash(i + vec2(1,0)), f.x),
            mix(areionTerrainHash(i + vec2(0,1)), areionTerrainHash(i + vec2(1,1)), f.x),
            f.y
          );
        }
        float areionTerrainFbm(vec2 p) {
          float value = 0.0;
          value += areionTerrainNoise(p) * 0.52;
          value += areionTerrainNoise(p * 2.07 + vec2(13.1, 7.7)) * 0.26;
          value += areionTerrainNoise(p * 4.13 - vec2(3.8, 9.2)) * 0.14;
          value += areionTerrainNoise(p * 8.31 + vec2(5.4, 1.7)) * 0.08;
          return value;
        }
        float areionCraterLayer(vec2 worldPoint, float cellSize) {
          vec2 gridPoint = worldPoint / cellSize;
          vec2 cell = floor(gridPoint);
          vec2 localPoint = fract(gridPoint) - 0.5;
          vec2 jitter = vec2(
            areionTerrainHash(cell + vec2(7.1, 2.4)),
            areionTerrainHash(cell + vec2(1.9, 8.3))
          ) - 0.5;
          float distanceToCentre = length(localPoint - jitter * 0.58);
          float radius = mix(0.095, 0.245, areionTerrainHash(cell + vec2(4.2, 5.6)));
          float width = max(0.012, radius * 0.09);
          float rim = exp(-pow((distanceToCentre - radius) / width, 2.0));
          float bowl = 1.0 - smoothstep(radius * 0.20, radius * 0.82, distanceToCentre);
          float exists = step(0.46, areionTerrainHash(cell + vec2(9.7, 1.3)));
          return exists * (rim * 0.72 - bowl * 0.33);
        }`,
      )
      .replace(
        "#include <map_fragment>",
        `#ifdef USE_MAP
          vec2 worldPoint = areionTerrainPosition.xz;
          vec2 nearUv = worldPoint / 5.0;
          vec2 midUv = mat2(0.8, -0.6, 0.6, 0.8) * worldPoint / 145.0 + vec2(0.31, 0.73);
          vec2 farUv = mat2(0.94, -0.34, 0.34, 0.94) * worldPoint / 3400.0 + vec2(0.67, 0.19);
          vec3 nearTexture = texture2D(map, nearUv).rgb;
          vec3 midTexture = texture2D(map, midUv).rgb;
          vec3 farTexture = texture2D(map, farUv).rgb;

          float viewDistance = length(cameraPosition - areionTerrainPosition);
          float nearWeight = 1.0 - smoothstep(260.0, 2300.0, viewDistance);
          float midWeight = 1.0 - smoothstep(3500.0, 34000.0, viewDistance);
          vec3 sampledTexture = mix(farTexture, midTexture, midWeight);
          sampledTexture = mix(sampledTexture, nearTexture, nearWeight);
          float textureValue = dot(sampledTexture, vec3(0.2126, 0.7152, 0.0722));

          float broad = areionTerrainFbm(worldPoint / 9200.0 + vec2(1.2, -4.7));
          float regional = areionTerrainFbm(worldPoint / 2100.0 - vec2(8.3, 2.1));
          float localVariation = areionTerrainFbm(worldPoint / 430.0 + vec2(3.7, 11.2));
          float craters = areionCraterLayer(worldPoint, 4400.0) * 0.75;
          craters += areionCraterLayer(worldPoint + vec2(900.0, -1700.0), 980.0) * 0.34;

          float radiusFromOrigin = length(worldPoint);
          float curvature = pow(max(0.0, radiusFromOrigin - 6000.0), 2.0) / (2.0 * ${MARS_RADIUS.toFixed(1)});
          float physicalElevation = areionTerrainPosition.y + curvature;
          float elevation = clamp(physicalElevation / 1000.0, -0.55, 0.65);
          float slope = 1.0 - clamp(areionTerrainNormal.y, 0.0, 1.0);
          float strata = sin((worldPoint.x * 0.00072 + worldPoint.y * 0.00041) + broad * 7.0) * 0.5 + 0.5;

          vec3 ironDust = vec3(0.62, 0.305, 0.165);
          vec3 paleSediment = vec3(0.76, 0.455, 0.255);
          vec3 basalt = vec3(0.255, 0.135, 0.095);
          vec3 rockFace = vec3(0.43, 0.245, 0.155);
          vec3 palette = mix(ironDust, paleSediment, smoothstep(0.28, 0.76, broad + elevation * 0.22));
          float basaltPatch = smoothstep(0.59, 0.82, regional + localVariation * 0.18);
          palette = mix(palette, basalt, basaltPatch * 0.72);
          palette = mix(palette, rockFace, smoothstep(0.08, 0.46, slope) * 0.68);
          palette *= 0.88 + (localVariation - 0.5) * 0.24 + (strata - 0.5) * 0.08;
          palette *= 1.0 + craters * 0.28;
          palette *= 0.74 + textureValue * mix(0.48, 0.66, nearWeight);

          vec3 vertexTint = diffuseColor.rgb;
          vec3 localSurface = palette * mix(vec3(1.0), vertexTint * 1.85, 0.24);

          // The far field uses the same NASA Viking mosaic as the orbital globe.
          // This projection is centred on Jezero crater; the detailed local material
          // remains completely unchanged inside the landing area.
          const float jezeroLatitude = 0.3219;
          const float jezeroLongitude = 1.3520;
          float latitude = jezeroLatitude + worldPoint.y / ${MARS_RADIUS.toFixed(1)};
          float longitude = jezeroLongitude + worldPoint.x / (${MARS_RADIUS.toFixed(1)} * cos(jezeroLatitude));
          vec2 globalUv = vec2(fract(longitude / 6.2831853 + 0.5), clamp(0.5 - latitude / 3.1415927, 0.001, 0.999));
          vec3 orbitalSurface = texture2D(marsGlobalMap, globalUv).rgb;
          float globalLum = dot(orbitalSurface, vec3(0.2126, 0.7152, 0.0722));
          vec3 dustyReference = vec3(0.53, 0.34, 0.25) * (0.72 + globalLum * 0.62);
          orbitalSurface = mix(dustyReference, orbitalSurface * vec3(1.12, 1.06, 1.0), 0.5);

          const float mosaicLeft = 1.3378;
          const float mosaicRight = 1.3624;
          const float mosaicTop = 0.3313;
          const float mosaicBottom = 0.3068;
          vec2 jezeroUv = vec2(
            (longitude - mosaicLeft) / (mosaicRight - mosaicLeft),
            (mosaicTop - latitude) / (mosaicTop - mosaicBottom)
          );
          float insideMosaic = step(0.0, jezeroUv.x) * step(jezeroUv.x, 1.0)
            * step(0.0, jezeroUv.y) * step(jezeroUv.y, 1.0);
          vec4 jezeroSample = texture2D(jezeroOrbitalMap, clamp(jezeroUv, 0.001, 0.999));
          float orbitalDetail = dot(jezeroSample.rgb, vec3(0.2126, 0.7152, 0.0722));
          orbitalDetail = clamp((orbitalDetail - 0.5) * 1.35 + 0.5, 0.0, 1.0);

          // Continue the same real Jezero orbital-image character beyond the
          // finite source mosaic. Three differently rotated samples suppress
          // visible repetition and remove the former rectangular boundary.
          vec2 detailUvA = mat2(0.94, -0.342, 0.342, 0.94) * worldPoint / 18500.0;
          vec2 detailUvB = mat2(0.574, 0.819, -0.819, 0.574) * worldPoint / 29500.0 + vec2(0.31, 0.67);
          vec2 detailUvC = mat2(-0.766, 0.643, -0.643, -0.766) * worldPoint / 11200.0 + vec2(0.73, 0.18);
          float repeatedDetail = dot(texture2D(jezeroDetailMap, detailUvA).rgb, vec3(0.2126, 0.7152, 0.0722)) * 0.5;
          repeatedDetail += dot(texture2D(jezeroDetailMap, detailUvB).rgb, vec3(0.2126, 0.7152, 0.0722)) * 0.3;
          repeatedDetail += dot(texture2D(jezeroDetailMap, detailUvC).rgb, vec3(0.2126, 0.7152, 0.0722)) * 0.2;
          repeatedDetail = clamp((repeatedDetail - 0.5) * 1.15 + 0.5, 0.0, 1.0);

          float edgeDistance = min(min(jezeroUv.x, 1.0 - jezeroUv.x), min(jezeroUv.y, 1.0 - jezeroUv.y));
          float mosaicFeather = smoothstep(0.0, 0.12, edgeDistance) * jezeroSample.a * insideMosaic;
          float continuousDetail = mix(repeatedDetail, orbitalDetail, mosaicFeather);
          orbitalSurface *= mix(0.58, 1.42, continuousDetail);

          float globalWeight = smoothstep(1800.0, 6500.0, viewDistance);
          diffuseColor.rgb = mix(localSurface, orbitalSurface, globalWeight);
        #endif`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
         float areionRoughVariation = areionTerrainFbm(areionTerrainPosition.xz / 520.0);
         roughnessFactor = clamp(roughnessFactor * (0.86 + areionRoughVariation * 0.18), 0.72, 1.0);`,
      );
  };
  material.customProgramCacheKey = () => "areion-viking-far-terrain-v3";
}

export function createTerrain(
  manager,
  anisotropy = 8,
  marsGlobalMap,
  jezeroOrbitalMap,
  jezeroDetailMap,
) {
  const group = new THREE.Group();
  const loader = new THREE.TextureLoader(manager);
  const map = loadTerrainTexture(loader, "color", anisotropy, true);
  const normalMap = loadTerrainTexture(loader, "normal", anisotropy);
  const roughnessMap = loadTerrainTexture(loader, "roughness", anisotropy);
  const material = new THREE.MeshStandardMaterial({
    map,
    normalMap,
    roughnessMap,
    normalScale: new THREE.Vector2(0.9, 0.9),
    roughness: 1,
    vertexColors: true,
  });
  enhanceTerrainMaterial(material, marsGlobalMap, jezeroOrbitalMap, jezeroDetailMap);

  // Dense local sampling joins a continuous horizon; no target-dependent flattening.
  const radii = [0];
  for (let radius = 3; radius <= 600; radius += 3) radii.push(radius);
  for (let radius = 624; radius < 800000; radius *= 1.055) radii.push(radius);
  radii.push(800000);

  const sectors = 384;
  const positions = [];
  const uvs = [];
  const colors = [];
  const indices = [];
  for (let ring = 0; ring < radii.length; ring++) {
    for (let i = 0; i <= sectors; i++) {
      const angle = (i / sectors) * Math.PI * 2;
      const radius = radii[ring];
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions.push(
        x,
        terrainHeight(x, z) - Math.max(0, radius - 6000) ** 2 / (2 * MARS_RADIUS) - 0.015,
        z,
      );
      uvs.push(x / 5, z / 5);
      const broad = terrainNoise(x / 2400 + 8, z / 2400 - 4);
      const regional = terrainNoise(x / 370 + 11, z / 370 + 7);
      const band = terrainNoise(x / 43, z / 43);
      colors.push(
        0.45 + broad * 0.24 + regional * 0.06,
        0.27 + broad * 0.13 + band * 0.035,
        0.15 + broad * 0.08,
      );
      if (ring && i < sectors) {
        const current = ring * (sectors + 1) + i;
        const previous = current - sectors - 1;
        indices.push(previous, previous + 1, current, previous + 1, current + 1, current);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const ground = new THREE.Mesh(geometry, material);
  ground.receiveShadow = true;
  group.add(ground);

  const random = createRandom(82);
  const dummy = new THREE.Object3D();
  const rockMaterial = new THREE.MeshStandardMaterial({
    map,
    normalMap,
    roughness: 1,
    color: "#756457",
    normalScale: new THREE.Vector2(0.6, 0.6),
  });
  for (const [count, range, scale] of [
    [2400, 320, 0.25],
    [800, 2400, 2.3],
  ]) {
    const rockGeometry = new THREE.IcosahedronGeometry(1, 0);
    const rocks = new THREE.InstancedMesh(rockGeometry, rockMaterial, count);
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(random()) * range;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const size = scale * (0.1 + random() ** 3 * 2);
      dummy.position.set(x, terrainHeight(x, z) + size * 0.12, z);
      dummy.scale.set(size, size * 0.55, size * 0.83);
      dummy.rotation.set(random(), random() * Math.PI * 2, random());
      dummy.updateMatrix();
      rocks.setMatrixAt(i, dummy.matrix);
    }
    rocks.castShadow = true;
    rocks.receiveShadow = true;
    group.add(rocks);
  }
  return group;
}
