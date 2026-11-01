// Character maps are shared by all instances and owned by the scene asset cache.
// Upload unchanged pixels once, then release ImageBitmap's decoded CPU copy.
// A lost WebGL context requires the runtime's existing explicit reload flow.
const uploaded=new WeakSet();
let uploadedMaps=0,releasedBytes=0;
export function uploadCharacterTextures(root,renderer){
 if(!renderer?.initTexture)return;
 const textures=new Set();
 root.traverse(n=>{for(const m of Array.isArray(n.material)?n.material:[n.material])if(m)for(const t of Object.values(m))if(t?.isTexture)textures.add(t);});
 for(const t of textures){
  if(uploaded.has(t))continue;
  const image=t.source?.data;
  if(typeof image?.close!=='function')continue; // HTMLImageElement fallback stays browser-managed.
  const width=image.width,height=image.height,previous=t.onUpdate;
  let confirmed=false;
  t.onUpdate=texture=>{confirmed=true;previous?.(texture);};
  try{renderer.initTexture(t);}finally{t.onUpdate=previous;}
  if(!confirmed)throw Error('Character texture upload did not complete');
  image.close();uploaded.add(t);uploadedMaps++;releasedBytes+=width*height*4;
  t.userData.uploadedImageSize=[width,height];
 }
}
export function textureMemoryStatus(){return {uploadedMaps,releasedDecodedBytes:releasedBytes,resolutionChanged:false};}
