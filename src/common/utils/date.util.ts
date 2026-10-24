export function toIsoString(date: Date = new Date()): string {
  return date.toISOString();
}

export function formatDateTime(date: Date = new Date()): string {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}
