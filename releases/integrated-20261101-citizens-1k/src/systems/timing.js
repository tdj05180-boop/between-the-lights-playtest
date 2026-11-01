// Shared with the original lantern: unchanged target interval and oscillator.
export const timingHit=p=>p>=.4&&p<=.64;
export const timingPosition=(seconds,hits)=>.5+.47*Math.sin(seconds*(1.4+hits*.16)-Math.PI/2);
