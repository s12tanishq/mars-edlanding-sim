import * as THREE from "three";
export function createHeatTrail(){
  const group=new THREE.Group(),count=700,pos=new Float32Array(count*3),ages=new Float32Array(count),seeds=new Float32Array(count);
  for(let i=0;i<count;i++){ages[i]=i/count;seeds[i]=(Math.sin(i*127.1)*43758.54)%1;}
  // Keep double precision and the original angle expression; these never change.
  const cosines=new Float64Array(count),sines=new Float64Array(count);
  for(let i=0;i<count;i++){const angle=i*2.39996+seeds[i];cosines[i]=Math.cos(angle);sines[i]=Math.sin(angle);}
  const rel=new THREE.Vector3(),side=new THREE.Vector3(),across=new THREE.Vector3();
  const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(pos,3));geo.setAttribute("age",new THREE.BufferAttribute(ages,1));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{heat:{value:0},pixelRatio:{value:1}},vertexShader:`attribute float age;varying float a;uniform float pixelRatio;void main(){a=age;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp((220.+a*500.)*pixelRatio/max(1.,-p.z),2.,100.);}`,fragmentShader:`varying float a;uniform float heat;void main(){float r=length(gl_PointCoord-.5)*2.;float glow=exp(-r*r*4.)*(1.-smoothstep(.7,1.,r));vec3 c=mix(vec3(1.,.75,.24),vec3(.9,.055,.007),a);gl_FragColor=vec4(c,glow*heat*(1.-a)*.20);}`});
  const particles=new THREE.Points(geo,material);particles.frustumCulled=false;group.add(particles);
  const haloMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{heat:{value:0}},vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 v;uniform float heat;void main(){float a=pow(sin(v.y*3.14159),2.);gl_FragColor=vec4(1.,.19,.015,a*heat*.5);}`});
  const halo=new THREE.Mesh(new THREE.TorusGeometry(2.6,.35,12,64),haloMat);halo.rotation.x=Math.PI/2;halo.position.y=.3;group.add(halo);
  const wakeMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{heat:{value:0},clock:{value:0}},vertexShader:`varying vec2 v;uniform float clock;void main(){v=uv;vec3 p=position;float flutter=sin(uv.x*50.+uv.y*19.-clock*8.)*uv.y*.3;p.x+=flutter;p.z+=flutter*.6;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying vec2 v;uniform float heat;uniform float clock;void main(){float streak=.3+.7*pow(.5+.5*sin(v.x*100.+sin(v.y*20.-clock*6.)*2.),3.);float fade=pow(1.-v.y,2.)*smoothstep(0.,.08,v.y);vec3 c=mix(vec3(1.,.57,.12),vec3(.8,.025,.004),v.y);gl_FragColor=vec4(c,heat*fade*streak*.52);}`});
  const wake=new THREE.Mesh(new THREE.CylinderGeometry(5.2,2.6,18,64,24,true),wakeMaterial);wake.position.y=9.3;group.add(wake);
  return {group,update(state,frame,wind,position,preview,pixelRatio){
    const heat=preview||state.phase!=="aerobraking"?0:Math.min(1,state.heatFlux/9000);
    group.visible=heat>.001;if(!group.visible)return;group.position.copy(position);material.uniforms.heat.value=heat;material.uniforms.pixelRatio.value=pixelRatio;haloMat.uniforms.heat.value=heat;
    wakeMaterial.uniforms.heat.value=heat;wakeMaterial.uniforms.clock.value=frame.clock;
    rel.set(wind.x-state.velocity.x,wind.y-state.velocity.y,wind.z-state.velocity.z);const speed=rel.length();rel.normalize();
    side.set(1,0,0);across.crossVectors(rel,side).normalize();side.crossVectors(across,rel).normalize();
    for(let i=0;i<count;i++){
      const a=(i/count+frame.clock*.75)%1,radius=2.4+a*(2+heat*4),length=a*(7+speed*.012);
      pos[i*3]=rel.x*length+(side.x*cosines[i]+across.x*sines[i])*radius;
      pos[i*3+1]=.3+rel.y*length+(side.y*cosines[i]+across.y*sines[i])*radius;
      pos[i*3+2]=rel.z*length+(side.z*cosines[i]+across.z*sines[i])*radius;ages[i]=a;
    }
    geo.attributes.position.needsUpdate=true;geo.attributes.age.needsUpdate=true;
  }};
}
