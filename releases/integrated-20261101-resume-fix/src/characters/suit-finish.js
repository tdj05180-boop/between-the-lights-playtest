// Correct painted spill only on the connected jacket. Preserve actual shirt/skin.
export function finishSuit(model){model.traverse(n=>{
 if(!n.isMesh||!n.geometry.getAttribute('_jacket_mask'))return;
 const previous=n.material.onBeforeCompile;
 n.material.onBeforeCompile=s=>{
  previous?.(s);
  s.vertexShader='attribute float _arm_mask; attribute float _jacket_mask; attribute float _cuff_distance; varying float vArmMask; varying float vJacketMask; varying float vCuffDistance;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvArmMask=_arm_mask; vJacketMask=_jacket_mask; vCuffDistance=_cuff_distance;');
  s.fragmentShader='varying float vArmMask; varying float vJacketMask; varying float vCuffDistance;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 float clothOnSkin=vArmMask;
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.855,.397,.209),clothOnSkin);
 float whiteSpill=smoothstep(0.035,0.09,dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)));
 float skinSpill=smoothstep(.025,.075,diffuseColor.r-diffuseColor.b)*smoothstep(.012,.055,diffuseColor.r-diffuseColor.g);
 float spill=max(whiteSpill,skinSpill)*vJacketMask;
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.030,.034,.047),spill);
 float cuff=(1.0-smoothstep(.010,.011,vCuffDistance))*vJacketMask;
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.76,.745,.72),cuff);`);
 };
 n.material.customProgramCacheKey=()=> 'suit-jacket-cuffs-skin-v6';
});}

