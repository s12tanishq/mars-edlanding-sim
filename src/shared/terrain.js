// One deterministic height field for flight contact, dust and rendering (metres).
// No target-distance mask, flattened pad, or radial mound.
const smooth = x => x * x * (3 - 2 * x);
const hash = (x, z) => { const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return n - Math.floor(n); };
export function terrainNoise(x, z) {
  const a = Math.floor(x), b = Math.floor(z), u = smooth(x - a), v = smooth(z - b);
  return (hash(a,b)*(1-u)+hash(a+1,b)*u)*(1-v)+(hash(a,b+1)*(1-u)+hash(a+1,b+1)*u)*v;
}
function relief(x,z) {
  return (terrainNoise(x/9200+3.4,z/9200-7.1)-.5)*1500
    + (terrainNoise(x/1700+11,z/1700+5)-.5)*140
    + (terrainNoise(x/160+19,z/160+23)-.5)*7
    + Math.sin(x*.036+z*.018+terrainNoise(x/130,z/130)*3)*.22
    + (terrainNoise(x/19+3,z/19+8)-.5)*.35;
}
const datum = relief(0,0);
export function terrainHeight(x,z) { return relief(x,z)-datum; }
export function terrainNormal(x,z) {
  const dx=(terrainHeight(x+.5,z)-terrainHeight(x-.5,z)), dz=(terrainHeight(x,z+.5)-terrainHeight(x,z-.5));
  const n=Math.hypot(dx,1,dz); return {x:-dx/n,y:1/n,z:-dz/n};
}
