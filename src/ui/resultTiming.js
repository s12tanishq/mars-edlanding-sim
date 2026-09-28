export const RESULT_REVEAL_DELAY_MS = 3200;

export function resultRevealDelay(result) {
  return result ? RESULT_REVEAL_DELAY_MS : 0;
}
