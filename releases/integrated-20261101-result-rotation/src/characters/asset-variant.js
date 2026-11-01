// Only distant outdoor agency citizens use offline-resampled maps. All other
// chapters, the hero and indoor staff retain their original assets.
export const agencyCitizenKeys=Object.freeze(['woman','man','elder','professor','grandmother','distantMan','distantWoman']);
const citizens=new Set(agencyCitizenKeys);
export function characterAssetKey(scene,key){return scene==='life-agency'&&citizens.has(key)?key+'-agency-1k':key;}
