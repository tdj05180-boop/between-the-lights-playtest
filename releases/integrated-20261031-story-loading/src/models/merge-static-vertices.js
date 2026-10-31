import * as T from '../vendor/three.module.min.js';
import {mergeVertices} from '../vendor/BufferGeometryUtils.js';

// Same tolerance and first-vertex retention as Three's mergeVertices. Static
// Float32 meshes avoid constructing a long decimal string for every vertex.
// Hash collisions are checked component-by-component, never treated as matches.
export function mergeStaticVertices(geometry,tolerance=1e-5){
 const entries=Object.entries(geometry.attributes);
 if(!entries.length||Object.keys(geometry.morphAttributes).length||entries.some(([,a])=>a.isInterleavedBufferAttribute||a.normalized||!(a.array instanceof Float32Array)||a.itemSize>4))return mergeVertices(geometry,tolerance);
 tolerance=Math.max(tolerance,Number.EPSILON);
 const multiplier=Math.pow(10,Math.log10(1/tolerance)),add=tolerance*.5*multiplier;
 const attrs=entries.map(([,a])=>a),sourceIndex=geometry.index,vertexCount=sourceIndex?sourceIndex.count:attrs[0].count;
 const count=attrs[0].count,heads=new Map(),next=new Int32Array(count),representative=new Uint32Array(count),resultIndices=new Uint32Array(vertexCount);
 const sourceMatches=sourceIndex?new Uint32Array(count):null;
 const buffers=attrs.map(a=>new Float32Array(a.array.length));let unique=0;
 function equal(source,other){for(const a of attrs){const size=a.itemSize,values=a.array;for(let k=0;k<size;k++)if(~~(values[source*size+k]*multiplier+add)!==~~(values[other*size+k]*multiplier+add))return false;}return true;}
 for(let i=0;i<vertexCount;i++){
  const source=sourceIndex?sourceIndex.getX(i):i;
  if(sourceMatches?.[source]){resultIndices[i]=sourceMatches[source]-1;continue;}
  let hash=2166136261;
  for(const a of attrs){const size=a.itemSize,values=a.array;for(let k=0;k<size;k++)hash=Math.imul(hash^~~(values[source*size+k]*multiplier+add),16777619);}
  let match=heads.get(hash)??-1;while(match!==-1&&!equal(source,representative[match]))match=next[match];
  if(match===-1){match=unique++;representative[match]=source;next[match]=heads.get(hash)??-1;heads.set(hash,match);
   for(let j=0;j<attrs.length;j++){const a=attrs[j],size=a.itemSize;for(let k=0;k<size;k++)buffers[j][match*size+k]=a.array[source*size+k];}
  }
  resultIndices[i]=match;if(sourceMatches)sourceMatches[source]=match+1;
 }
 const result=geometry.clone();
 entries.forEach(([name,a],j)=>result.setAttribute(name,new a.constructor(buffers[j].slice(0,unique*a.itemSize),a.itemSize,a.normalized)));
 result.setIndex(new T.BufferAttribute(unique>65535?resultIndices:Uint16Array.from(resultIndices),1));
 return result;
}
