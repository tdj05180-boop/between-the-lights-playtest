// Shared by ordinary story sequences and optional NPC/observation messages.
// Cinematic cues and empty staging steps retain their authored timing.
export const DIALOGUE_LINE_MS=2500;
// Longest current ordinary story line: 29 non-whitespace characters.
// Keep its previous duration; shorter lines scale down with a readable floor.
export const DIALOGUE_REFERENCE_LENGTH=29;
export function dialogueDuration(text){
  const length=Array.from(text.trim().replace(/\s/gu,'')).length;
  return Math.round(Math.max(1200,Math.min(DIALOGUE_LINE_MS,DIALOGUE_LINE_MS*length/DIALOGUE_REFERENCE_LENGTH)));
}
export function dialogueSteps(sequence){
  return sequence.cinematic?sequence.lines:sequence.lines.map(line=>
    line.text.trim()?{...line,durationMs:dialogueDuration(line.text)}:line);
}
