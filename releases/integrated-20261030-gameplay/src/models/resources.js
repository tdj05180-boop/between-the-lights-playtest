// Only call for resources owned by this visual (never shared world materials).
export function objectResources(object) {
 const geometries=new Set(),materials=new Set(),textures=new Set(),skeletons=new Set();
 object.traverse(node=>{if(node.geometry)geometries.add(node.geometry);if(node.skeleton)skeletons.add(node.skeleton);
  for(const m of (Array.isArray(node.material)?node.material:[node.material]))if(m){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}
 });
 return {geometries,materials,textures,skeletons};
}
export function disposeObject(object,{preserve=new Set()}={}) {
 const {geometries,materials,textures,skeletons}=objectResources(object);
 // A preserved material also preserves every texture referenced by that material.
 for(const material of materials)if(preserve.has(material))for(const value of Object.values(material))if(value?.isTexture)preserve.add(value);
 for(const set of [geometries,materials,textures,skeletons])for(const resource of [...set])if(preserve.has(resource))set.delete(resource);
 for(const x of geometries)x.dispose();for(const x of materials)x.dispose();for(const x of textures){x.dispose();x.source?.data?.close?.();}for(const x of skeletons)x.dispose();
 return {geometries:geometries.size,materials:materials.size,textures:textures.size,skeletons:skeletons.size};
}
