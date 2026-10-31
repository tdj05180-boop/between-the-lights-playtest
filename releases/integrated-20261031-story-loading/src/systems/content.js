// Small registries and scoped lifetimes, shared by production and test content.
export class Registry {
  constructor(kind){this.kind=kind;this.entries=new Map();}
  register(id,definition){if(typeof id!=='string'||!id||this.entries.has(id))throw Error(`${this.kind}: duplicate/invalid ID ${id}`);this.entries.set(id,definition);return this;}
  get(id){if(!this.entries.has(id))throw Error(`Unregistered ${this.kind}: ${id}`);return this.entries.get(id);}
}
export class Scope {
  constructor(){this.cleanups=[];this.closed=false;}
  own(cleanup){if(this.closed){cleanup();return ()=>{};}this.cleanups.push(cleanup);return cleanup;}
  listen(target,event,handler,options){target.addEventListener(event,handler,options);return this.own(()=>target.removeEventListener(event,handler,options));}
  dispose(){if(this.closed)return;this.closed=true;const errors=[];for(const f of this.cleanups.reverse())try{f();}catch(e){errors.push(e);}this.cleanups=[];if(errors.length)throw new AggregateError(errors,'Content cleanup failed');}
}
export class InputLocks {
  constructor(){this.owners=new Map();}
  acquire(policy={movement:true,camera:true,interaction:true}){const token=Symbol();this.owners.set(token,{...policy});return ()=>this.owners.delete(token);}
  locked(channel){return [...this.owners.values()].some(p=>p[channel]===true);}
}
