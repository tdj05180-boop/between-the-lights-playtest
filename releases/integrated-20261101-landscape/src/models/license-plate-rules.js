// Private passenger registrations only. Historical/source notes are in the review report.
export const PRIVATE_1996='가나다라마거너더러머고노도로모구누두루무';
export const PRIVATE_MODERN='가나다라마거너더러머버서어저고노도로모보소오조구누두루무부수우주';
export const PLATE_RULES=Object.freeze({
 2003:Object.freeze({min:27,max:31,letters:PRIVATE_1996,region:'부산',width:.335,height:.170}),
 2019:Object.freeze({min:1,max:69,letters:PRIVATE_MODERN,region:'',width:.520,height:.110}),
 2026:Object.freeze({min:100,max:699,letters:PRIVATE_MODERN,region:'',width:.520,height:.110})
});
const referenceNumbers=new Set(['부산33나1996','55라2006','666마2019','123가4568','부산27무6162']);
function hash(value){let h=2166136261;for(const ch of value)h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
// A scene-local allocator is seeded by era + stable traffic ID. Reusing a car never
// calls this again; recreating the fleet reproduces its registrations and designs.
export function plateRegistrations(era,ids){
 const rule=PLATE_RULES[era];if(!rule)throw Error('Unknown plate era '+era);
 if(new Set(ids.map(String)).size!==ids.length)throw Error('Duplicate vehicle IDs');
 const capacity=(rule.max-rule.min+1)*rule.letters.length*9000;
 if(ids.length>capacity)throw Error('Passenger plate range exhausted');
 const sorted=[...ids].sort((a,b)=>String(a).localeCompare(String(b),'en'));
 const filmIds=new Set(era===2026?[...sorted].sort((a,b)=>hash('film:'+a)-hash('film:'+b)).slice(0,Math.round(ids.length*.35)):[]);
 const used=new Set(),result=new Map();
 for(const id of sorted){
  let code=hash(era+':private:'+id)%capacity,number,prefix,letter,serial;
  do{
   prefix=String(rule.min+code%(rule.max-rule.min+1)).padStart(2,'0');
   letter=rule.letters[Math.floor(code/(rule.max-rule.min+1))%rule.letters.length];
   serial=String(1000+Math.floor(code/((rule.max-rule.min+1)*rule.letters.length)));
   number=rule.region+prefix+letter+serial;code=(code+104729)%capacity;
  }while(used.has(number)||referenceNumbers.has(number));
  used.add(number);result.set(id,Object.freeze({era,id,number,prefix,letter,serial,region:rule.region,style:era===2003?'busan-green':filmIds.has(id)?'kor-film':'white-paint',width:rule.width,height:rule.height}));
 }
 return ids.map(id=>result.get(id));
}
