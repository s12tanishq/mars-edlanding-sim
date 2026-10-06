import React,{useEffect,useRef} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
export default function TrajectoryReview({snapshot}){
  const host=useRef(null),live=useRef(snapshot);live.current=snapshot;
  useEffect(()=>{
    const el=host.current,renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(1);el.appendChild(renderer.domElement);
    const world=new THREE.Scene();world.background=new THREE.Color("#14202a");
    const camera=new THREE.PerspectiveCamera(42,1,.1,10000);camera.position.set(90,150,300);
    const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,90,0);controls.enableDamping=true;
    const grid=new THREE.GridHelper(180,12,"#47575d","#293c44");world.add(grid);
    const pos=new Float32Array(16000*3),geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(pos,3));geo.setDrawRange(0,0);
    const mat=new THREE.LineBasicMaterial({color:"#efc788"}),line=new THREE.Line(geo,mat);line.frustumCulled=false;world.add(line);
    const marker=new THREE.Mesh(new THREE.SphereGeometry(2,12,8),new THREE.MeshBasicMaterial({color:"#ffffff"}));world.add(marker);
    let dirty=true,lastCount=0,lastTime=-1,lastSnapshot=null;
    const lastPosition=new THREE.Vector3(),lastQuaternion=new THREE.Quaternion();
    const invalidate=()=>{dirty=true;};controls.addEventListener("change",invalidate);
    const resize=()=>{renderer.setSize(el.clientWidth,300);camera.aspect=el.clientWidth/300;camera.updateProjectionMatrix();dirty=true;};const ro=new ResizeObserver(resize);ro.observe(el);resize();
    renderer.setAnimationLoop(()=>{
      const s=live.current,n=Math.min(16000,s.trajectory.length);
      if(s.time<lastTime||n<lastCount||(s.time===0&&s!==lastSnapshot))lastCount=0;
      if(n>lastCount){
        for(let i=lastCount;i<n;i++){const p=s.trajectory[i];pos[i*3]=p.x/10;pos[i*3+1]=p.y/180;pos[i*3+2]=p.z/10;}
        geo.attributes.position.addUpdateRange(lastCount*3,(n-lastCount)*3);geo.attributes.position.needsUpdate=true;
      }
      if(s!==lastSnapshot){dirty=true;const p=s.state.position;marker.position.set(p.x/10,p.y/180,p.z/10);}
      geo.setDrawRange(0,n);lastCount=n;lastTime=s.time;lastSnapshot=s;
      // OrbitControls keeps exactly the same damping cadence. Its change event
      // invalidates the view; a settled, unchanged view needs no GPU submission.
      controls.update();
      if(!camera.position.equals(lastPosition)||!camera.quaternion.equals(lastQuaternion))dirty=true;
      if(dirty){renderer.render(world,camera);lastPosition.copy(camera.position);lastQuaternion.copy(camera.quaternion);dirty=false;}
    });
    return()=>{ro.disconnect();renderer.setAnimationLoop(null);controls.dispose();world.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});renderer.dispose();renderer.domElement.remove();};
  },[]);
  return <div className="trajectory-review"><div ref={host} aria-label="Live rotatable 3D trajectory"/><small>Drag to rotate · horizontal scale ×18 relative to altitude to reveal drift</small></div>;
}
