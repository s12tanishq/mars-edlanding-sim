// Usage: node scripts/check-visual-equivalence.js /absolute/path/to/baseline
// Loads both source trees in memory; no browser or renderer approximations.
import {build} from "esbuild";
import {createHash} from "node:crypto";
import {resolve} from "node:path";
import assert from "node:assert/strict";
import {performance} from "node:perf_hooks";

export async function loadVisuals(root){
  const files={Dust:"Dust.js",HeatTrail:"HeatTrail.js",Parachute:"Parachute.jsx",RocketPlume:"RocketPlume.jsx",TrajectoryLine:"TrajectoryLine.jsx"};
  const {outputFiles}=await build({stdin:{contents:Object.entries(files).map(([name,file])=>`export {create${name}} from './src/scene/${file}';`).join("\n"),resolveDir:resolve(root)},bundle:true,write:false,format:"esm",platform:"node",minify:true,define:{"import.meta.env.BASE_URL":'"/"'}});
  return import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);
}

// Hash all currently visible geometry, transforms, material values and uniforms.
// UUIDs, allocation identities and buffer-upload bookkeeping are not visual data.
export function visualDigest(root){
  const hash=createHash("sha256");
  const value=v=>hash.update(JSON.stringify(v));
  root.updateMatrixWorld(true);
  root.traverseVisible(o=>{
    value([o.type,o.matrixWorld.elements,o.castShadow,o.receiveShadow,o.renderOrder,o.frustumCulled]);
    if(o.geometry){
      value(o.geometry.drawRange);
      for(const [key,a] of Object.entries(o.geometry.attributes)){value([key,a.itemSize,a.normalized]);hash.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));}
      if(o.geometry.index)hash.update(Buffer.from(o.geometry.index.array.buffer));
    }
    for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){
      value([m.type,m.color?.toArray(),m.emissive?.toArray(),m.emissiveIntensity,m.roughness,m.metalness,m.opacity,m.transparent,m.side,m.depthWrite,m.depthTest,m.blending,m.vertexShader,m.fragmentShader]);
      if(m.uniforms)for(const [key,u] of Object.entries(m.uniforms))value([key,u.value]);
    }
  });
  return hash.digest("hex");
}

export function replay(api,{hash=true}={}){
  const dust=api.createDust(),heat=api.createHeatTrail(),chute=api.createParachute(),plume=api.createRocketPlume(),trail=api.createTrajectoryLine();
  // Vector from the loaded Three copy, without an extra module instance.
  const position=chute.group.position.clone(),points=[],digests=[],costs=[];
  let clock=0;
  for(let i=0;i<600;i++){
    const phase=i<80?"aerobraking":i<300?"parachute":i<520?"poweredDescent":i<560?"landed":"crashed";
    const dt=i%17===0?0:i%11===0?.05:1/60;clock+=dt;
    const age=p=>p==="parachute"&&i>=80?(i-80)/60:p==="poweredDescent"&&i>=300?(i-300)/60:null;
    const frame={dt,clock,phase,age},wind={x:Math.sin(i*.03)*22,y:Math.cos(i*.05),z:Math.cos(i*.02)*17};
    const state={phase,altitude:Math.max(0,90-i*.17),fuel:500-i*.3,heatFlux:8500,velocity:{x:8,y:-35,z:-7}};
    position.set(i*.005,Math.max(0,90-i*.17),Math.sin(i*.025)*12);
    const start=performance.now();
    dust.update(state,frame,wind,position,.68,false,1.5,.7);
    heat.update(state,frame,wind,position,false,1.5);
    chute.update(state,frame,position,wind,false,140);
    plume.update(state,.68,frame,wind,5.3,1.5);
    if(i%6===0)points.push({x:position.x,y:position.y,z:position.z});
    trail.update(points);costs.push(performance.now()-start);
    if(hash&&i%20===0)digests.push([i,...[dust.object,heat.group,chute.group,plume.group,trail.object].map(visualDigest)]);
  }
  costs.sort((a,b)=>a-b);
  return {digests,cpu:{median:costs[Math.floor(costs.length*.5)],p95:costs[Math.floor(costs.length*.95)]}};
}

if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname){
  assert.ok(process.argv[2],"Supply an untouched baseline directory");
  const before=await loadVisuals(process.argv[2]),after=await loadVisuals(process.cwd());
  replay(before,{hash:false});replay(after,{hash:false});
  const a=replay(before),b=replay(after);
  assert.deepEqual(b.digests,a.digests,"A visible geometry/material/animation value changed");
  console.log(JSON.stringify({exactVisualCheckpoints:a.digests.length,components:5,frames:600,beforeCPU:a.cpu,afterCPU:b.cpu,note:"CPU update microbenchmark only; not browser FPS or GPU timing"},null,2));
}
