// Shared by ordinary story sequences and optional NPC/observation messages.
// Cinematic cues and empty staging steps retain their authored timing.
export const DIALOGUE_LINE_MS=2500;
export function dialogueSteps(sequence){
  return sequence.cinematic?sequence.lines:sequence.lines.map(line=>
    line.text.trim()?{...line,durationMs:DIALOGUE_LINE_MS}:line);
}
