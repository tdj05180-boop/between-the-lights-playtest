import {Scope} from './content.js';
import {withLoading} from './time.js';

// Each factory owns its scene. renderer/camera/player are persistent borrowed resources.
export class SpaceHost {
  constructor({registry,clock,context,beforeChange=()=>{},onLoaded=()=>{}}){Object.assign(this,{registry,clock,context,beforeChange,onLoaded});this.current=null;this.busy=false;}
  async change(id,chapter){
    if(this.busy)throw Error('Space transition already in progress');
    const definition=this.registry.get(id);this.busy=true;
    try{return await withLoading(this.clock,async()=>{
      this.beforeChange();const previous=this.current;this.current=null;
      if(previous){try{await previous.instance.exit?.();}finally{try{previous.instance.dispose();}finally{previous.scope.dispose();}}}
      const scope=new Scope();let instance;
      try{instance=await definition.create({...this.context,scope,chapter});if(!instance?.scene||!instance.world||typeof instance.dispose!=='function'||typeof instance.canWalk!=='function')throw Error(`Invalid space adapter: ${id}`);await instance.enter?.();this.current={id,instance,scope};this.onLoaded(instance,definition);return instance;}
      catch(e){if(this.current?.instance===instance)this.current=null;try{instance?.dispose?.();}finally{scope.dispose();}throw e;}
    });}finally{this.busy=false;}
  }
}
