import test from "node:test";
import assert from "node:assert/strict";
import {Simulation} from "../src/shared/Simulation.js";
import {createSnapshotEncoder,createSnapshotDecoder} from "../src/shared/snapshotTransport.js";

test("incremental transport preserves every record and terminal result of a full flight",()=>{
  const sim=new Simulation(),encoder=createSnapshotEncoder(),decoder=createSnapshotDecoder();
  let old,historyRecords=0,trajectoryRecords=0,eventRecords=0;
  while(!sim.complete){
    for(let i=0;i<3&&!sim.complete;i++)sim.step();
    const source=sim.snapshot(),packet=structuredClone(encoder.encode(source,0));
    const decoded=decoder.decode(packet);
    assert.equal(decoded.status,"ok");
    const {history,trajectory,events,...expectedHeader}=source;
    const {history:actualHistory,trajectory:actualTrajectory,events:actualEvents,...actualHeader}=decoded.snapshot;
    assert.deepEqual(actualHeader,expectedHeader);
    assert.equal(actualHistory.length,history.length);assert.equal(actualTrajectory.length,trajectory.length);assert.equal(actualEvents.length,events.length);
    historyRecords+=packet.series.history.values.length;
    trajectoryRecords+=packet.series.trajectory.values.length;
    eventRecords+=packet.series.events.values.length;
    if(old)assert.equal(old.snapshot.history.length,old.length,"Earlier React snapshot mutated");
    old={snapshot:decoded.snapshot,length:decoded.snapshot.history.length};
  }
  assert.ok(old.snapshot.complete);assert.ok(old.snapshot.result);
  assert.deepEqual(old.snapshot,sim.snapshot());
  assert.equal(historyRecords,sim.history.length);assert.equal(trajectoryRecords,sim.trajectory.length);assert.equal(eventRecords,sim.events.length);
});

test("transport detects missing packets, resyncs, rejects duplicates, and resets",()=>{
  const sim=new Simulation(),encoder=createSnapshotEncoder(),decoder=createSnapshotDecoder();
  const first=encoder.encode(sim.snapshot(),0);assert.equal(decoder.decode(first).status,"ok");
  sim.step();encoder.encode(sim.snapshot(),0); // dropped
  sim.step();const missed=encoder.encode(sim.snapshot(),0);
  assert.equal(decoder.decode(missed).status,"gap");
  const full=encoder.encode(sim.snapshot(),0,{full:true});
  assert.deepEqual(decoder.decode(full).snapshot,sim.snapshot());
  assert.equal(decoder.decode(full).status,"duplicate");
  sim.reset("storm");const reset=encoder.encode(sim.snapshot(),1);
  assert.equal(reset.full,true);assert.deepEqual(decoder.decode(reset).snapshot,sim.snapshot());
  assert.equal(decoder.decode(missed).status,"duplicate");
});

test("unchanged recordings retain identity, including paused heartbeats and late observers",()=>{
  const sim=new Simulation(),encoder=createSnapshotEncoder(),decoder=createSnapshotDecoder();
  const a=decoder.decode(encoder.encode(sim.snapshot(),0)).snapshot;
  const packet=encoder.encode(sim.snapshot(),0),b=decoder.decode(packet).snapshot;
  for(const key of ["history","trajectory","events"]){assert.equal(a[key],b[key]);assert.equal(packet.series[key].values.length,0);}
  const observer=createSnapshotDecoder();assert.equal(observer.decode(packet).status,"gap");
  assert.deepEqual(observer.decode(encoder.encode(sim.snapshot(),0,{full:true})).snapshot,sim.snapshot());
});
