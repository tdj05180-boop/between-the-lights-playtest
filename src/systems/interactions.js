export class InteractionRegistry {
  constructor(entries){this.entries=new Map(entries.map(e=>[e.id,{...e}]));}
  get(id){return this.entries.get(id);}
  candidates(ids){return ids.map(id=>this.get(id)).filter(Boolean);}
  nearest(position,entries){let best=null,min=Infinity;for(const t of entries){const d=Math.hypot(position.x-t.x,position.z-t.z);if(d<t.radius&&d<min){best=t;min=d;}}return best;}
  // Change a logical anchor without touching a mesh or its child names.
  move(id,x,z){const target=this.get(id);if(!target)throw Error(`Unknown interaction ${id}`);Object.assign(target,{x,z});}
  // Optional facing-aware selection. Legacy nearest() remains unchanged.
  rank(position,yaw,target){
    if(!target||target.enabled===false)return Infinity;
    const dx=target.x-position.x,dz=target.z-position.z;
    const angle=target.yaw??0,c=Math.cos(angle),s=Math.sin(angle);
    const lx=dx*c-dz*s,lz=dx*s+dz*c;
    const edge=Math.hypot(Math.max(0,Math.abs(lx)-(target.halfWidth??0)),Math.max(0,Math.abs(lz)-(target.halfDepth??0)));
    // Large props may use a nearby access anchor while facing the actual visible object.
    const fx=(target.facingX??target.x)-position.x,fz=(target.facingZ??target.z)-position.z,fd=Math.hypot(fx,fz);
    const facing=fd<.01?1:(fx*Math.sin(yaw)+fz*Math.cos(yaw))/fd;
    if(edge>(target.radius??1.45)||facing<(target.minFacing??.12))return Infinity;
    return edge+.6*(1-facing);
  }
  select(position,yaw,entries,currentId=null){
    const ranked=entries.map(t=>({t,score:this.rank(position,yaw,t)})).filter(v=>Number.isFinite(v.score)).sort((a,b)=>a.score-b.score||String(a.t.id).localeCompare(String(b.t.id)));
    const best=ranked[0],current=ranked.find(v=>v.t.id===currentId);
    return (current&&best&&current.score<=best.score+.12?current:best)?.t??null;
  }
  // Revalidate exactly the displayed ID. Never substitute another target on press.
  validate(id,position,yaw,entries){const t=entries.find(t=>t.id===id);return Number.isFinite(this.rank(position,yaw,t))?t:null;}
}
