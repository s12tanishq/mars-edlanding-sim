import React,{useEffect,useRef,useState} from "react";
import MissionControlView from "./MissionControlView.jsx";
import {createSnapshotEncoder,createSnapshotDecoder} from "../shared/snapshotTransport.js";
import "../flight.css";

export function useMissionBroadcast(snapshot,running,runId,performance){
  const session=useRef(crypto.randomUUID()),channel=useRef(null),current=useRef(null);
  current.current={type:"snapshot",snapshot,running,runId,performance,sentAt:Date.now()};
  useEffect(()=>{
    const c=new BroadcastChannel(`areion-${session.current}`),encoder=createSnapshotEncoder();
    const send=(full=false)=>{const {snapshot,runId,...metadata}=current.current;c.postMessage({...metadata,...encoder.encode(snapshot,runId,{full}),sentAt:Date.now()});};
    channel.current=send;c.onmessage=e=>{if(e.data?.type==="hello")send(true);};
    const timer=setInterval(()=>send(),250);
    return()=>{clearInterval(timer);channel.current=null;c.close();};
  },[]);
  useEffect(()=>{channel.current?.();},[snapshot,running,runId]);
  const url=`${location.pathname}?station=${session.current}`;
  return {url,open:()=>window.open(url,`mission-${session.current}`,"width=1200,height=900")};
}

export default function MissionStation(){
  const [packet,setPacket]=useState(null),[now,setNow]=useState(Date.now());
  useEffect(()=>{
    const id=new URLSearchParams(location.search).get("station"),c=new BroadcastChannel(`areion-${id}`),decoder=createSnapshotDecoder();let resyncPending=false;
    c.onmessage=e=>{
      if(e.data?.type!=="snapshot")return;
      const decoded=decoder.decode(e.data);
      if(decoded.status==="gap"){if(!resyncPending){resyncPending=true;c.postMessage({type:"hello"});}return;}
      if(decoded.status==="ok"){resyncPending=false;setPacket({...e.data,snapshot:decoded.snapshot});}
    };
    c.postMessage({type:"hello"});const timer=setInterval(()=>setNow(Date.now()),1000);return()=>{c.close();clearInterval(timer);};
  },[]);
  const stale=packet&&now-packet.sentAt>3000;
  return <main className="station-page"><header><b>AREION · TEAM INDENTATION / SECONDARY STATION</b><span role="status">{!packet?"Waiting for primary flight…":stale?"Connection stale · last received data":packet.snapshot.complete?"Mission complete":packet.running?"Live · read only":"Paused · read only"}</span></header>{packet?<MissionControlView snapshot={packet.snapshot} performance={packet.performance}/>:<p>Keep the primary simulation open in another window on this computer.</p>}</main>;
}
