export class AppearanceHost {
  constructor(registry,slot){this.registry=registry;this.slot=slot;this.id='default';}
  apply(id='default'){const preset=this.registry.get(id);if(id===this.id)return;const adapter=preset.create();if(!adapter?.object||typeof adapter.dispose!=='function')throw Error(`Invalid appearance adapter: ${id}`);this.slot.replace(adapter);this.id=id;}
}
