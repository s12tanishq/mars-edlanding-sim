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
    const resize=()=>{renderer.setSize(el.clientWidth,300);camera.aspect=el.clientWidth/300;camera.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(el);resize();
    renderer.setAnimationLoop(()=>{const s=live.current,n=Math.min(16000,s.trajectory.length);for(let i=0;i<n;i++){const p=s.trajectory[i];pos.set([p.x/10,p.y/180,p.z/10],i*3);}geo.attributes.position.needsUpdate=true;geo.setDrawRange(0,n);const p=s.state.position;marker.position.set(p.x/10,p.y/180,p.z/10);controls.update();renderer.render(world,camera);});
    return()=>{ro.disconnect();renderer.setAnimationLoop(null);controls.dispose();world.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});renderer.dispose();renderer.domElement.remove();};
  },[]);
  return <div className="trajectory-review"><div ref={host} aria-label="Live rotatable 3D trajectory"/><small>Drag to rotate · horizontal scale ×18 relative to altitude to reveal drift</small></div>;
}
