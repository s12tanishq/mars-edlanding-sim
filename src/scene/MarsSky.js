import * as THREE from "three";
const ASSET_BASE = import.meta.env.BASE_URL;

export function createMarsSky(manager) {
  const photo = new THREE.TextureLoader(manager).load(
    `${ASSET_BASE}assets/mars-panorama.jpg`,
  );
  photo.colorSpace = THREE.SRGBColorSpace;
  // Only the unobstructed top sky strip is sampled: no photographed ground floating at altitude.
  // The real sky's lateral colour variation is retained; a gradient extends the missing zenith.
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    uniforms: { photo: { value: photo }, altitude: { value: 0 } },
    vertexShader: `varying vec3 direction; void main(){ direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D photo; uniform float altitude; varying vec3 direction;
      void main(){ vec3 d=normalize(direction); float u=atan(d.z,d.x)/6.2831853+.5;
        float v=clamp(.995+d.y*.002,.993,.998); vec3 photographic=texture2D(photo,vec2(u,v)).rgb;
        photographic=mix(photographic,vec3(.19,.17,.16),.62);
        vec3 zenith=mix(vec3(.19,.175,.165),vec3(.075,.068,.068),smoothstep(45000.,120000.,altitude));
        vec3 c=mix(photographic,zenith,smoothstep(.065,.68,d.y));
        c=mix(c,vec3(.215,.185,.17),1.-smoothstep(-.4,.0,d.y));
        c=mix(c,vec3(.003,.005,.009),smoothstep(45000.,160000.,altitude));gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(900000, 48, 24),
    material,
  );
  mesh.renderOrder = -1000;
  mesh.frustumCulled = false;
  return {
    mesh,
    update(camera, altitude) {
      mesh.position.copy(camera.position);
      material.uniforms.altitude.value = altitude;
    },
  };
}
