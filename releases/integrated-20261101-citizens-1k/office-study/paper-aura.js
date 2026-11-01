import * as T from '../src/vendor/three.module.min.js';

// Paper-shaped rectangular light volume; no actual lights or particles.
export function createPaperAura(){
 const geometry=new T.BufferGeometry(),positions=[],uvs=[],indices=[];
 const corners=[[-.125,-.17],[.125,-.17],[.125,.17],[-.125,.17]];
 for(let i=0;i<4;i++){
  const [x,z]=corners[i],[nx,nz]=corners[(i+1)%4],b=i*4;
  positions.push(x,0,z,nx,0,nz,x*1.15,1.05,z*1.15,nx*1.15,1.05,nz*1.15);
  uvs.push(0,0,1,0,0,1,1,1);indices.push(b,b+1,b+2,b+2,b+1,b+3);
 }
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);
 const material=new T.ShaderMaterial({
  uniforms:{...T.UniformsLib.fog,t:{value:0},color:{value:new T.Color(0xffd28a)}},
  transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,
  blending:T.AdditiveBlending,fog:true,
  vertexShader:`varying vec2 vUv;
   #include <fog_pars_vertex>
   void main(){vUv=uv;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
    gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
   }`,
  fragmentShader:`uniform float t;uniform vec3 color;varying vec2 vUv;
   #include <fog_pars_fragment>
   void main(){
    // Broad feathering removes the hard vertical edges without widening the paper footprint.
    float edge=smoothstep(0.0,0.32,min(vUv.x,1.0-vUv.x));
    float heightFade=pow(1.0-smoothstep(0.0,0.94,vUv.y),1.45)*smoothstep(0.0,0.025,vUv.y);
    float flow=0.92+0.08*sin(vUv.y*12.0-t*1.8);
    gl_FragColor=vec4(color,edge*heightFade*flow*0.18);
    #include <fog_fragment>
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 return {
  attach(parent){const m=new T.Mesh(geometry,material);m.name='CollectiblePaperAura';m.position.y=.012;m.renderOrder=2;parent.add(m);return m;},
  update(dt){material.uniforms.t.value+=dt;}
 };
}
