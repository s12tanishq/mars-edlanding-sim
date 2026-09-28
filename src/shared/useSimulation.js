import {useEffect,useRef,useState} from "react";
import {Simulation} from "./Simulation.js";
export function useSimulation(){
  const [snapshot,setSnapshot]=useState(()=>new Simulation().snapshot()),live=useRef(snapshot);
  const [running,setRunning]=useState(false),[started,setStarted]=useState(false),[speed,setSpeed]=useState(1),[runId,setRunId]=useState(0),[scenario,setScenario]=useState("nominal");
  const worker=useRef(null),expected=useRef(0),lastUI=useRef(0),playing=useRef(false);
  useEffect(()=>{
    const w=new Worker(new URL("./simulation.worker.js",import.meta.url),{type:"module"});worker.current=w;
    w.onmessage=({data})=>{if(data.runId!==expected.current)return;live.current=data.snapshot;playing.current=data.playing;setRunning(data.playing);if(performance.now()-lastUI.current>90||!data.playing){setSnapshot(data.snapshot);lastUI.current=performance.now();}};
    return()=>w.terminate();
  },[]);
  function reset(next=scenario,options={}){expected.current++;playing.current=false;setRunning(false);setStarted(false);setScenario(next);setRunId(expected.current);const fresh=new Simulation(next,options).snapshot();live.current=fresh;setSnapshot(fresh);worker.current?.postMessage({type:"reset",scenario:next,options,runId:expected.current});}
  function toggle(){if(live.current.complete)return;setStarted(true);playing.current=!playing.current;setRunning(playing.current);worker.current?.postMessage({type:"playing",value:playing.current});}
  function changeSpeed(value){setSpeed(value);worker.current?.postMessage({type:"speed",value});}
  return {live,snapshot,running,started,speed,setSpeed:changeSpeed,runId,scenario,reset,toggle};
}
