/**
 * Format a time in ms to a duration of time eg. 1 second(s)
 */
export function formatDuration(ms: number) {
  let time = ms / 1000;
  if (time < 60) return `${Math.ceil(time)} second(s)`;

  time /= 60;
  if (time < 60) return `${Math.ceil(time)} minute(s)`;

  time /= 60;
  return `${Math.ceil(time)} hour(s)`;
}
