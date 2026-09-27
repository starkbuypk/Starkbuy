const KEY = 'sb_recently_viewed';
const MAX = 8;

export function recordView(productId: string): void {
  try {
    const existing: string[] = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    const next = [productId, ...existing.filter(id => id !== productId)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export function getRecentIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}
