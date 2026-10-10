// Active milliseconds supplied by GameTime. Integrate at demand boundaries,
// not a capped animation delta, including a delayed foreground frame.
export class ManagementState{
 constructor(config){this.c=config;this.pool=0;this.riders=[...config.riders];this.loads=[...config.loads];this.now=0;this.safeSince=this.loads.every(l=>l<=config.safeLimit)?0:null;this.risks=0;this.failed=false;}
 demand(ms=this.now){return this.c.patterns[Math.min(this.c.patterns.length-1,Math.floor(ms/this.c.changeMs))];}
 advance(ms){const c=this.c;while(this.now<ms){const end=Math.min(ms,(Math.floor(this.now/c.changeMs)+1)*c.changeMs),dt=(end-this.now)/1000,demand=this.demand(),before=[...this.loads],wasUnsafe=before.some(l=>l>c.safeLimit);this.loads=this.loads.map((l,i)=>Math.max(0,Math.min(100,l+(demand[i]-this.riders[i])*c.rate*dt)));const unsafe=this.loads.some(l=>l>c.safeLimit);if(unsafe){if(!wasUnsafe)this.risks++;this.safeSince=null;}else if(wasUnsafe){const recover=Math.max(...before.map((l,i)=>l>c.safeLimit?(l-c.safeLimit)/((this.riders[i]-demand[i])*c.rate)*1000:0));this.safeSince=this.now+recover;}else if(this.safeSince===null)this.safeSince=this.now;if(this.loads.some(l=>l>=100))this.failed=true;this.now=end;}if(ms>c.limitMs)this.failed=true;return this;}
 get safeMs(){return this.safeSince===null?0:this.now-this.safeSince;}
}
