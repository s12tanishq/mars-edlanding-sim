import * as THREE from "three";

export function createTrajectoryLine() {
  const capacity = 16000;
  const coordinates = new Float32Array(capacity * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(coordinates, 3).setUsage(THREE.DynamicDrawUsage),
  );
  geometry.setDrawRange(0, 0);
  const object = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({
      color: "#b9ecd2",
      transparent: true,
      opacity: 0.9,
      fog: false,
    }),
  );
  object.frustumCulled = false;
  let lastLength = 0;
  return {
    object,
    reset(){lastLength=0;geometry.setDrawRange(0,0);geometry.attributes.position.clearUpdateRanges();},
    update(points) {
      if (points.length < lastLength) lastLength = 0;
      const count = Math.min(points.length, capacity);
      if(count===lastLength){geometry.setDrawRange(0,count);return;}
      for (let i = lastLength; i < count; i++) {
        coordinates[i * 3] = points[i].x;
        coordinates[i * 3 + 1] = points[i].y + 0.02;
        coordinates[i * 3 + 2] = points[i].z;
      }
      geometry.attributes.position.addUpdateRange(lastLength*3,(count-lastLength)*3);
      lastLength = count;
      geometry.setDrawRange(0, count);
      geometry.attributes.position.needsUpdate = true;
    },
  };
}
