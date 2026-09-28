import React,{useEffect,useRef,useState} from "react";
import MissionControlView from "./MissionControlView.jsx";
import "../flight.css";

export function useMissionBroadcast(snapshot,running,runId,performance){
  const session=useRef(crypto.randomUUID()),channel=useRef(null),current=useRef(null);
  current.current={type:"snapshot",snapshot,running,runId,performance,sentAt:Date.now()};
  useEffect(()=>{const c=new BroadcastChannel(`areion-${session.current}`);channel.current=c;c.onmessage=e=>{if(e.data?.type==="hello")c.postMessage(current.current);};const timer=setInterval(()=>c.postMessage({...current.current,sentAt:Date.now()}),250);return()=>{clearInterval(timer);c.close();};},[]);
  useEffect(()=>{channel.current?.postMessage(current.current);},[snapshot,running,runId]);
  const url=`${location.pathname}?station=${session.current}`;
  return {url,open:()=>window.open(url,`mission-${session.current}`,"width=1200,height=900")};
}

export default function MissionStation(){
  const [packet,setPacket]=useState(null),[now,setNow]=useState(Date.now());
  useEffect(()=>{const id=new URLSearchParams(location.search).get("station"),c=new BroadcastChannel(`areion-${id}`);c.onmessage=e=>{if(e.data?.type==="snapshot")setPacket(e.data);};c.postMessage({type:"hello"});const timer=setInterval(()=>setNow(Date.now()),1000);return()=>{c.close();clearInterval(timer);};},[]);
  const stale=packet&&now-packet.sentAt>3000;
  return <main className="station-page"><header><b>AREION · TEAM INDENTATION / SECONDARY STATION</b><span role="status">{!packet?"Waiting for primary flight…":stale?"Connection stale · last received data":packet.snapshot.complete?"Mission complete":packet.running?"Live · read only":"Paused · read only"}</span></header>{packet?<MissionControlView snapshot={packet.snapshot} performance={packet.performance}/>:<p>Keep the primary simulation open in another window on this computer.</p>}</main>;
}
