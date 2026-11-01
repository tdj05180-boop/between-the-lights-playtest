import {suiteLighting} from '../src/models/interior-plan.js';

// Lighting belongs to physical suites; do not independently illuminate corner panes.
export function nightSuiteLighting(id,seed,storey,cell){
 const state=suiteLighting(seed,storey,cell);
 let lit=state.lit;
 // Preserve B03's locally approved evening occupancy; other suites are unchanged.
 if(id==='B03'&&lit){
  const n=Math.sin(seed*127.1+storey*311.7+cell.ix*74.7+cell.iz*173.3)*43758.5453;
  lit=n-Math.floor(n)>.58;
 }
 // Night rooms must separate from the unlit exterior. This affects upper suites
 // only; storefronts, street lighting and the playable office use their own setup.
 return {...state,lit,strength:lit?1.65+(state.strength-.52)*1.2:.008};
}
