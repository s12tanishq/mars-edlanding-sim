// Append-only recordings cross the worker/window boundary once. Snapshot arrays
// remain immutable for React: old UI snapshots never gain future samples.
const fields=["history","trajectory","events"];

export function createSnapshotEncoder(){
  let lastRun=null,sequence=0,lengths=Object.fromEntries(fields.map(key=>[key,0]));
  return {encode(snapshot,runId,{full=false}={}){
    full=full||runId!==lastRun||fields.some(key=>snapshot[key].length<lengths[key]);
    const baseSequence=sequence,series={},state={...snapshot};
    for(const key of fields){
      const start=full?0:lengths[key];
      series[key]={start,values:snapshot[key].slice(start)};
      lengths[key]=snapshot[key].length;delete state[key];
    }
    lastRun=runId;
    return {runId,sequence:++sequence,baseSequence,full,snapshot:state,series};
  }};
}

export function createSnapshotDecoder(){
  let runId=null,sequence=0,recordings=null;
  return {decode(packet){
    if(packet.sequence<=sequence)return {status:"duplicate"};
    if(!packet.full&&(packet.runId!==runId||packet.baseSequence!==sequence||!recordings))return {status:"gap"};
    const next={};
    for(const key of fields){
      const part=packet.series[key],previous=packet.full?[]:recordings[key];
      if(part.start!==previous.length)return {status:"gap"};
      next[key]=part.values.length?previous.concat(part.values):previous;
    }
    runId=packet.runId;sequence=packet.sequence;recordings=next;
    return {status:"ok",snapshot:{...packet.snapshot,...next}};
  }};
}
