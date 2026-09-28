import test from "node:test";
import assert from "node:assert/strict";
import {Simulation} from "../src/shared/Simulation.js";
import {terrainHeight,terrainNormal} from "../src/shared/terrain.js";
import {heatFlux,thermalStep} from "../src/physics/heating.js";
import {computeForces} from "../src/physics/forces.js";
import {createSimulationState} from "../src/shared/simulationState.js";
import {stepDustParticle} from "../src/scene/particleDynamics.js";
import {createFlightRover} from "../src/scene/FlightRover.js";
function run(options={}){const sim=new Simulation("storm",options);while(!sim.complete)sim.step();return sim;}
test("Sutton–Graves SI benchmark and speed/density scaling",()=>{
  assert.ok(Math.abs(heatFlux(.01,1000,1)-19027)<1e-9);
  assert.equal(heatFlux(0,1000),0);
  assert.ok(Math.abs(heatFlux(.01,2000)/heatFlux(.01,1000)-8)<1e-10);
  assert.ok(thermalStep(600,0,1)<600);
  assert.ok(thermalStep(210,10000,.1)>210);
});
test("lift is perpendicular to air velocity and has no free propulsion",()=>{
  const s=createSimulationState(),d=computeForces(s,{throttle:0,steering:{x:0,z:0},lift:{x:1,z:0}},{x:20,y:0,z:0},1/60);
  const dot=Object.keys(d.lift).reduce((sum,k)=>sum+d.lift[k]*d.relativeVelocity[k],0);
  assert.ok(Math.abs(dot)<1e-6);assert.ok(Math.hypot(...Object.values(d.lift))>0);assert.equal(d.actualThrottle,0);
});
test("terrain has natural local relief with stable normals and no flat target pad",()=>{
  assert.equal(terrainHeight(0,0),0);
  const heights=Array.from({length:11},(_,i)=>terrainHeight(i*12-60,30));assert.ok(Math.max(...heights)-Math.min(...heights)>.5);
  const n=terrainNormal(20,30);assert.ok(Math.abs(Math.hypot(n.x,n.y,n.z)-1)<1e-10);
});
test("storm modifies atmosphere and sensor conditions while flight lands on local ground",()=>{
  const sim=run();assert.equal(sim.result.success,true);assert.ok(sim.events.some(e=>e.message.includes("Dust front")));
  assert.equal(sim.state.altitude,0);assert.equal(sim.state.position.y,terrainHeight(sim.state.position.x,sim.state.position.z));
  assert.ok(sim.environment.densityScale>1);assert.ok(sim.environment.sensorMultiplier>1);
  assert.ok(sim.result.fuelEfficiency>0&&sim.result.fuelEfficiency<100);
});
test("halving timestep keeps storm touchdown and peak load within tolerance",()=>{
  const a=run({dt:1/60}),b=run({dt:1/120});
  assert.equal(b.result.success,true);assert.ok(Math.abs(a.result.verticalSpeed-b.result.verticalSpeed)<.12);
  assert.ok(Math.abs(a.result.distance-b.result.distance)<12);assert.ok(Math.abs(a.result.peakG-b.result.peakG)<.08);
});
test("dust follows wind, respects ground and rebounds from rover boundary",()=>{
  let p={x:15,y:10,z:0},v={x:0,y:0,z:0};for(let i=0;i<60;i++)stepDustParticle(p,v,1/60,{x:10,y:0,z:0},{x:0,y:0,z:0});
  assert.ok(p.x>15);assert.ok(p.y>=terrainHeight(p.x,p.z));
  p={x:1,y:.9,z:0};v={x:-4,y:0,z:0};stepDustParticle(p,v,.01,{x:0,y:0,z:0},{x:0,y:0,z:0});assert.ok(p.x>=1.45);assert.ok(v.x>=0);
});
test("flight rover fits geometry and material budget",()=>{
  const rover=createFlightRover();assert.ok(rover.userData.triangles<5000);assert.ok(rover.userData.drawCalls<=6);
  rover.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
});
test("navigation interruption and degraded engines recover within landing limits",()=>{
  for(const scenario of ["sensor","engine"]){
    const sim=new Simulation(scenario);while(!sim.complete)sim.step();
    assert.equal(sim.result.success,true,scenario);
    if(scenario==="sensor")assert.equal(sim.events.filter(e=>e.message.includes("Navigation signal")).length,2);
    if(scenario==="engine")assert.equal(sim.environment.engineEfficiency,.8);
  }
});
