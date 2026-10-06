import test from "node:test";
import assert from "node:assert/strict";
import {loadVisuals,visualDigest} from "../scripts/check-visual-equivalence.js";
import {createVisualTimeline} from "../src/scene/motion.js";

const api=await loadVisuals(new URL("../",import.meta.url).pathname);

test("trajectory uploads only appended coordinates and resets at the same point count",()=>{
  const trail=api.createTrajectoryLine(),attribute=trail.object.geometry.attributes.position;
  const points=[{x:1,y:2,z:3}];trail.update(points);
  const version=attribute.version;attribute.clearUpdateRanges();
  trail.update(points);assert.equal(attribute.version,version);assert.deepEqual(attribute.updateRanges,[]);
  points.push({x:4,y:5,z:6});trail.update(points);
  assert.deepEqual(attribute.updateRanges,[{start:3,count:3}]);
  assert.equal(attribute.array[4],Math.fround(5.02));
  trail.reset();trail.update([{x:-1,y:2,z:-3},{x:-4,y:5,z:-6}]);
  assert.equal(attribute.array[0],-1);assert.equal(attribute.array[5],-6);
});

test("reused cloth, dust and plume reproduce a fresh mission exactly after reset",()=>{
  for(const name of ["Parachute","Dust","RocketPlume"]){
    const reused=api[`create${name}`](),fresh=api[`create${name}`]();
    const position=fresh.group?.position.clone()??{x:0,y:8,z:0};
    const state={phase:"poweredDescent",altitude:8,fuel:400,velocity:{x:8,y:-10,z:2}};
    const wind={x:8,y:.5,z:-6};
    function step(effect,i){
      const frame={dt:1/60,clock:i/60,phase:state.phase,age:p=>p==="parachute"?i/60:p==="poweredDescent"?i/60:null};
      if(name==="Dust")effect.update(state,frame,wind,position,.7,false,1.5,.8);
      if(name==="Parachute")effect.update(state,frame,position,wind,false,170);
      if(name==="RocketPlume")effect.update(state,.7,frame,wind,4,1.5);
    }
    for(let i=0;i<100;i++)step(reused,i);
    reused.reset();
    for(let i=0;i<100;i++){step(reused,i);step(fresh,i);assert.equal(visualDigest(reused.group??reused.object),visualDigest(fresh.group??fresh.object),`${name} frame ${i}`);}
  }
});

test("resetting the persistent visual clock clears terminal time and deployment marks",()=>{
  const reused=createVisualTimeline(),fresh=createVisualTimeline();
  reused.update({time:10,complete:false,state:{phase:"parachute"}},.05,false,true);
  reused.update({time:20,complete:true,state:{phase:"landed"}},.05,false,false);reused.reset();
  const snapshot={time:0,complete:false,state:{phase:"aerobraking"}};
  const a=reused.update(snapshot,.016,false,true),b=fresh.update(snapshot,.016,false,true);
  assert.equal(a.clock,b.clock);assert.equal(a.dt,b.dt);assert.equal(a.age("parachute"),null);assert.equal(a.age("landed"),null);
});
