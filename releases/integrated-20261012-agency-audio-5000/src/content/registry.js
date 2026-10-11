import {Registry} from '../systems/content.js';
import {createCandidateAvatar} from '../models/candidate-avatar.js';
import {legacyRoom} from '../spaces/legacy-room.js';
export const minigames=new Registry('minigame');
export const spaces=new Registry('space').register('legacy-room',legacyRoom);
export const appearances=new Registry('appearance').register('default',{create:createCandidateAvatar});
export function resolveChapter(data){
  const space=spaces.get(data.sceneId);appearances.get(data.appearanceId??'default');
  for(const quest of data.quests??[])if(quest.type==='minigame')minigames.get(quest.minigameId);
  if(data.quests?.some(q=>['boxes','light'].includes(q.type))&&!space.legacyGames)throw Error(`Space ${data.sceneId} does not provide legacy box/lantern anchors`);
  return {...data,spawn:data.spawn??space.spawn,interactions:data.interactions??space.interactions??[]};
}
