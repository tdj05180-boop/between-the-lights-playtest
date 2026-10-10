import {Scope} from './content.js';

export class MinigameHost {
  constructor({registry,clock,locks,onResult,onError=error=>{throw error;},onInputChange=()=>{},input=()=>({}),world=()=>null}){Object.assign(this,{registry,clock,locks,onResult,onError,onInputChange,input,world});this.current=null;}
  get active(){return !!this.current;}
  get hasInteraction(){return !!this.current?.instance?.interaction;}
  interactionTarget(){return this.clock.paused?null:this.current?.instance?.interaction?.target()??null;}
  interact(){if(this.clock.paused)return;try{this.current?.instance?.interaction?.act();}catch(e){this.abort(e);}}
  start(id,config={},metadata={}){
    if(this.active)throw Error('A minigame is already active');
    const definition=this.registry.get(id),scope=new Scope();
    const s={id,scope,metadata,start:this.clock.elapsed(),last:this.clock.elapsed(),timers:new Set(),paused:this.clock.paused,instance:null};
    this.current=s;
    s.policy=definition.input??{movement:true,camera:true,interaction:true};
    scope.own(this.locks.acquire(s.policy));this.onInputChange(s.policy);
    const live=()=>this.current===s&&!this.clock.paused;
    const context={
      elapsedMs:()=>Math.max(0,this.clock.elapsed()-s.start),
      lockInput:(policy)=>{const unlock=this.locks.acquire(policy);let released=false;const release=()=>{if(released)return;released=true;unlock();this.onInputChange(policy);};scope.own(release);this.onInputChange(policy);return release;},
      input:()=>live()?this.input():{},
      world:()=>this.world(), // Borrowed scene/player; content owns only what it adds.
      finish:result=>{if(live())this.finish(result,s);},
      listen:(target,type,fn,options)=>scope.listen(target,type,event=>{if(live())try{fn(event);}catch(e){this.abort(e);}},options),
      own:cleanup=>scope.own(cleanup),
      mount:(parent,node)=>{parent.appendChild(node);scope.own(()=>node.remove());return node;},
      after:(durationMs,fn)=>{if(!Number.isFinite(durationMs)||durationMs<0)throw Error('Invalid minigame durationMs');const t={at:this.clock.elapsed()+durationMs,fn};s.timers.add(t);return ()=>s.timers.delete(t);}
    };
    try{s.instance=definition.create(context,structuredClone(config));if(!s.instance||typeof s.instance.dispose!=='function')throw Error(`Minigame ${id} must provide dispose()`);s.instance.start?.();if(this.current===s&&s.paused)s.instance.pause?.();}
    catch(e){this.abort(e);}
  }
  syncPause(){const s=this.current;if(!s||s.paused===this.clock.paused)return;s.paused=this.clock.paused;try{if(s.paused)s.instance?.pause?.();else s.instance?.resume?.();}catch(e){this.abort(e);}}
  tick(){this.syncPause();const s=this.current;if(!s||this.clock.paused)return;const now=this.clock.elapsed(),dt=Math.max(0,now-s.last)/1000;s.last=now;
    try{for(const t of [...s.timers]){if(now>=t.at){s.timers.delete(t);t.fn();if(this.current!==s)return;}}s.instance?.update?.({dt,elapsedMs:now-s.start,input:this.input()});}catch(e){this.abort(e);}
  }
  finish(result,s=this.current){if(!s||this.current!==s)return;if(!result||!['success','failure'].includes(result.status))return this.abort(Error('Minigame result requires success/failure status'));
    const metadata=s.metadata;this.stop();Promise.resolve(this.onResult({...result},metadata)).catch(this.onError);
  }
  stop(){const s=this.current;if(!s)return;this.current=null;s.timers.clear();const errors=[];try{s.instance?.dispose();}catch(e){errors.push(e);}try{s.scope.dispose();}catch(e){errors.push(e);}finally{this.onInputChange(s.policy);}if(errors.length)throw new AggregateError(errors,'Minigame disposal failed');}
  abort(error){try{this.stop();}catch(cleanup){error=new AggregateError([error,cleanup],'Minigame failed');}this.onError(error);}
  snapshot(){const s=this.current;return s?{id:s.id,elapsedMs:this.clock.elapsed()-s.start,paused:s.paused,timers:s.timers.size,updates:typeof s.instance?.update==='function'}:null;}
}
