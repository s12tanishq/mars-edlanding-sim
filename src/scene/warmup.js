import * as THREE from "three";

// Preparing GPU resources never calls a simulation/animation update. Temporary
// visibility and light changes are restored synchronously before the next RAF.
export function createSceneWarmup(renderer,world,sun,extraTextures,isBriefing){
  let requested=false,busy=false,disposed=false;
  const camera=new THREE.PerspectiveCamera(43,1,.25,2000000);
  camera.position.set(6,15,32);camera.lookAt(0,7,0);
  function configured(shadows,action){
    const visibility=[];
    world.traverse(o=>{visibility.push([o,o.visible]);o.visible=true;});
    const castShadow=sun.castShadow,position=sun.position.clone(),target=sun.target.position.clone();
    sun.castShadow=shadows;sun.position.set(-36,48,22);sun.target.position.set(0,0,0);
    try{return action();}finally{
      for(const [object,visible] of visibility)object.visible=visible;
      sun.castShadow=castShadow;sun.position.copy(position);sun.target.position.copy(target);
    }
  }
  function uploadTextures(){
    const textures=new Set(extraTextures);
    world.traverse(o=>{
      for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){
        for(const value of Object.values(m))if(value?.isTexture)textures.add(value);
        if(m.uniforms)for(const u of Object.values(m.uniforms))if(u.value?.isTexture)textures.add(u.value);
      }
    });
    for(const texture of textures)if(texture.image)renderer.initTexture(texture);
  }
  async function prepare(){
    busy=true;requested=false;
    try{
      uploadTextures();
      await configured(false,()=>renderer.compileAsync(world,camera));
      if(disposed)return;
      if(!isBriefing()){requested=true;return;}
      await configured(true,()=>renderer.compileAsync(world,camera));
      if(disposed)return;
      if(!isBriefing()){requested=true;return;}
      // Do not render synthetic poses to warm buffers: that can initialize
      // geometry bounds/render caches differently from the first real frame.
    }catch(error){
      // Preparation is optional. Normal rendering can still initialize lazily.
      if(!disposed)console.warn("Scene preparation deferred to normal rendering",error);
    }finally{busy=false;}
  }
  return {
    request(){requested=true;},
    update(){if(requested&&!busy&&!disposed&&isBriefing())void prepare();},
    dispose(){disposed=true;},
  };
}
