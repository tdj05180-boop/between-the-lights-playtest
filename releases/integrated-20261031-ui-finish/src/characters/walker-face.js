// Only the forehead UV island above the eyebrows. Preserve hair geometry,
// eyelids, brows and mouth; sample the same original texture's clean forehead.
export function finishWalkerFace(model){model.traverse(n=>{
 if(!n.isSkinnedMesh||!n.material.map)return;
 const before=n.material.onBeforeCompile;
 n.material.onBeforeCompile=s=>{before?.(s);
  s.vertexShader='varying vec3 vFaceBind;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFaceBind=position;');
  s.fragmentShader='varying vec3 vFaceBind;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float facePatch=step(.496,vMapUv.x)*step(vMapUv.x,.536)*step(.177,vMapUv.y)*step(vMapUv.y,.229);
   facePatch*=smoothstep(.915,.9165,vFaceBind.y)*(1.0-smoothstep(.946,.953,vFaceBind.y))*step(.035,vFaceBind.z);
   float ink=1.0-smoothstep(.30,.55,dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)));
   vec3 clean=texture2D(map,vec2(.51458,.18970)).rgb;
   diffuseColor.rgb=mix(diffuseColor.rgb,clean,facePatch*ink);`);
 };n.material.customProgramCacheKey=()=> 'male-walker-forehead-clean-v1';
});}

