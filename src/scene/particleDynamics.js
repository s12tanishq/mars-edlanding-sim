import {terrainHeight} from "../shared/terrain.js";
// One-way coupled Lagrangian dust: drag relaxation, gravity, surface and body contact.
// Particles do not feed forces back into the flight truth.
export function stepDustParticle(p,v,dt,wind,rover,throttle=0) {
  const dx=p.x-rover.x,dz=p.z-rover.z,r=Math.hypot(dx,dz),ground=terrainHeight(p.x,p.z);
  const exhaust=throttle*Math.exp(-Math.max(0,rover.y-ground)/18)*Math.exp(-r/12);
  const targetX=wind.x+(r>.01?dx/r:0)*exhaust*32,targetY=wind.y+exhaust*12,targetZ=wind.z+(r>.01?dz/r:0)*exhaust*32;
  const blend=1-Math.exp(-dt/.65);
  v.x+=(targetX-v.x)*blend;v.y+=(targetY-v.y)*blend;v.z+=(targetZ-v.z)*blend;
  v.y-=3.71*dt;
  p.x+=v.x*dt;p.y+=v.y*dt;p.z+=v.z*dt;
  const floor=terrainHeight(p.x,p.z)+.035;
  if(p.y<floor){p.y=floor;v.y=Math.abs(v.y)*.16;v.x*=.96;v.z*=.96;}
  const rx=p.x-rover.x,rz=p.z-rover.z,rr=Math.hypot(rx,rz);
  if(p.y>rover.y+.15&&p.y<rover.y+1.6&&rr<1.45){
    const nx=rr>.0001?rx/rr:1,nz=rr>.0001?rz/rr:0;
    p.x=rover.x+nx*1.45;p.z=rover.z+nz*1.45;
    const vn=v.x*nx+v.z*nz;if(vn<0){v.x-=1.2*vn*nx;v.z-=1.2*vn*nz;}
  }
}
