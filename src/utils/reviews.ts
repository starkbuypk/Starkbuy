export interface Review {
  id: string;
  userId: string;
  displayName: string;
  avatar?: string;
  rating: number;
  text: string;
  date: string;
}

const KEY = 'sb_reviews';

function getAll(): Record<string, Review[]> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; }
}

export function getReviews(productId: string): Review[] {
  return getAll()[productId] ?? [];
}

export function addReview(productId: string, review: Review): void {
  const all = getAll();
  all[productId] = [review, ...(all[productId] ?? [])];
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function hasUserReviewed(productId: string, userId: string): boolean {
  return getReviews(productId).some(r => r.userId === userId);
}

export function deleteReview(productId: string, reviewId: string): void {
  const all = getAll();
  all[productId] = (all[productId] ?? []).filter(r => r.id !== reviewId);
  localStorage.setItem(KEY, JSON.stringify(all));
}
