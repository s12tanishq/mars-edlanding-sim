import * as THREE from "three";
import {createRandom} from "../shared/random.js";
import {terrainHeight} from "../shared/terrain.js";
import {stepDustParticle} from "./particleDynamics.js";
export function createDust(){
  const count=1800,positions=new Float32Array(count*3),alpha=new Float32Array(count),sizes=new Float32Array(count),random=createRandom(882);
  const particles=Array.from({length:count},()=>({p:{x:0,y:0,z:0},v:{x:0,y:0,z:0},life:0}));
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));geometry.setAttribute("alpha",new THREE.BufferAttribute(alpha,1));geometry.setAttribute("size",new THREE.BufferAttribute(sizes,1));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{pixelRatio:{value:1}},vertexShader:`attribute float alpha;attribute float size;varying float a;uniform float pixelRatio;void main(){a=alpha;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(size*pixelRatio*300./max(1.,-p.z),1.,100.);}`,fragmentShader:`varying float a;void main(){float r=length(gl_PointCoord-.5)*2.;float soft=exp(-r*r*3.)*(1.-smoothstep(.6,1.,r));gl_FragColor=vec4(.56,.36,.19,a*soft);}`});
  const object=new THREE.Points(geometry,material);object.frustumCulled=false;
  let impactAge=-1;
  return {object,update(state,frame,wind,position,throttle,preview,pixelRatio,storm=0){
    const near=Math.max(0,1-state.altitude/70),terminal=["landed","crashed"].includes(state.phase);
    if(terminal&&impactAge<0)impactAge=0;
    if(impactAge>=0)impactAge+=frame.dt;
    const impact=impactAge>=0?Math.exp(-impactAge*2)*(state.phase==="crashed"?1:.35):0;
    const strength=preview?0:Math.min(1,storm*.65+near*throttle+impact);
    object.visible=strength>.008;if(!object.visible)return;
    material.uniforms.pixelRatio.value=pixelRatio;
    for(let i=0;i<count;i++){
      const p=particles[i];
      if(p.life<=0||Math.hypot(p.p.x-position.x,p.p.z-position.z)>95||Math.abs(p.p.y-position.y)>80){
        const local=i<count*.65&&near>.1,r=local?2+random()*14:random()*65,a=random()*Math.PI*2;
        p.p={x:position.x+Math.cos(a)*r,y:0,z:position.z+Math.sin(a)*r};
        p.p.y=local?terrainHeight(p.p.x,p.p.z)+.1:Math.max(terrainHeight(p.p.x,p.p.z)+.1,position.y+(random()-.35)*50);
        p.v={x:wind.x+(local?Math.cos(a)*impact*20:0),y:local?impact*10:wind.y,z:wind.z+(local?Math.sin(a)*impact*20:0)};
        p.life=1+random()*5;sizes[i]=local?.6+random()*2.2:.15+random()*1.5;
      }
      const steps=Math.max(1,Math.ceil(frame.dt*60)),dt=frame.dt/steps;
      for(let s=0;s<steps;s++)stepDustParticle(p.p,p.v,dt,wind,position,throttle);
      p.life-=frame.dt;positions.set([p.p.x,p.p.y,p.p.z],i*3);alpha[i]=strength*Math.min(1,p.life)*.14;
    }
    geometry.attributes.position.needsUpdate=true;geometry.attributes.alpha.needsUpdate=true;geometry.attributes.size.needsUpdate=true;
  }};
}
