import * as THREE from "three";
import {mergeGeometries} from "three/addons/utils/BufferGeometryUtils.js";

// Authored flight LOD: six material batches, no image textures.
export function createFlightRover() {
  const group=new THREE.Group(),bins=new Map();
  const palettes={foil:["#ab9868",.55,.48],body:["#dad9cc",.45,.5],tire:["#343636",.6,.65],metal:["#9a9c96",.7,.4],glass:["#13242c",.6,.2],dark:["#343832",.35,.6]};
  const add=(g,key,p=[0,0,0],rot=[0,0,0])=>{const m=new THREE.Matrix4().compose(new THREE.Vector3(...p),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),new THREE.Vector3(1,1,1));g.applyMatrix4(m);if(!bins.has(key))bins.set(key,[]);bins.get(key).push(g);};
  const box=(s,k,p)=>add(new THREE.BoxGeometry(...s),k,p);
  const bar=(a,b,r=.035)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av);const g=new THREE.CylinderGeometry(r,r,v.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));add(g,"metal",av.add(bv).multiplyScalar(.5).toArray());};
  box([1.7,.62,1.85],"foil",[0,.94,0]);box([1.9,.14,2.05],"body",[0,1.31,0]);box([1.2,.18,.75],"body",[0,1.45,-.35]);
  for(const side of [-1,1])for(const z of [-1.1,0,1.1]){
    const x=side*1.12;
    add(new THREE.CylinderGeometry(.37,.37,.3,20),"tire",[x,.37,z],[0,0,Math.PI/2]);
    add(new THREE.CylinderGeometry(.2,.2,.315,12),"metal",[x,.37,z],[0,0,Math.PI/2]);
    for(let i=0;i<12;i++){const a=i*Math.PI/6;add(new THREE.BoxGeometry(.32,.024,.035),"metal",[x,.37+Math.cos(a)*.369,z+Math.sin(a)*.369],[-a,0,0]);}
    bar([side*.76,1.08,z*.25],[x,.41,z],.045);
  }
  bar([.52,1.4,.62],[.52,2.25,.62],.07);box([.57,.31,.3],"body",[.52,2.3,.62]);
  for(const x of [.36,.66])add(new THREE.CylinderGeometry(.075,.075,.12,12),"glass",[x,2.32,.82],[Math.PI/2,0,0]);
  add(new THREE.CylinderGeometry(.34,.28,.12,20),"body",[-.5,1.55,-.25]);bar([-.5,1.4,-.25],[-.5,1.56,-.25]);
  box([.64,.48,.64],"dark",[0,1.05,-1.17]);for(let i=0;i<6;i++)box([.77,.025,.68],"metal",[0,.88+i*.07,-1.17]);
  bar([-.65,1,.82],[-.8,.63,1.15],.06);bar([-.8,.63,1.15],[.5,.69,1.15],.055);add(new THREE.CylinderGeometry(.2,.2,.25,12),"dark",[.6,.7,1.16],[Math.PI/2,0,0]);
  bar([-.72,1.4,-.62],[-.72,2.07,-.62],.018);
  let triangles=0;
  for(const [key,geometries] of bins){const geo=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());const [color,metalness,roughness]=palettes[key];const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,metalness,roughness}));mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);triangles+=geo.index.count/3;}
  group.userData={triangles,drawCalls:bins.size};return group;
}
