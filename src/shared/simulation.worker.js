import {Simulation} from "./Simulation.js";
import {CONFIG} from "./constants.js";
import {createSnapshotEncoder} from "./snapshotTransport.js";
const encoder=createSnapshotEncoder();
let simulation=new Simulation(),playing=false,speed=1,remainder=0,last=performance.now(),published=0,runId=0;
const send=(full=false)=>{postMessage({...encoder.encode(simulation.snapshot(),runId,{full}),playing});published=performance.now();};
self.onmessage=({data})=>{
  if(data.type==="resync"){send(true);return;}
  if(data.type==="reset"){simulation=new Simulation(data.scenario,data.options);playing=false;remainder=0;runId=data.runId;}
  if(data.type==="playing")playing=data.value&&!simulation.complete;
  if(data.type==="speed")speed=data.value;
  last=performance.now();send();
};
setInterval(()=>{
  const now=performance.now(),elapsed=Math.min(.25,(now-last)/1000);last=now;
  if(playing){remainder+=elapsed*speed;while(remainder>=CONFIG.dt&&!simulation.complete){simulation.step();remainder-=CONFIG.dt;}
    if(simulation.complete)playing=false;
    if(now-published>=33||!playing)send();
  }
},16);
send();
