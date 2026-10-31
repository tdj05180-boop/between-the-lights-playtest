// Same subdued exterior surface for real-room and opaque LOD windows.
// Analytic tint only: no fabricated reflected windows, textures or extra passes.
export const nightDarkSurfaceGLSL=`
vec3 nightDarkSurface(float grazing,float height){
 vec3 tint=mix(vec3(0.007,0.013,0.022),vec3(0.014,0.024,0.039),grazing);
 return tint*mix(0.88,1.08,smoothstep(0.0,1.0,height));
}
`;
