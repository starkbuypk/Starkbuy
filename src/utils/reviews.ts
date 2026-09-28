import { supabase } from '../lib/supabase';

export interface Review {
  id: string;
  userId: string | null;
  displayName: string;
  avatar?: string;
  rating: number;
  text: string;
  date: string;
  images?: string[];
}

export async function getReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map(row => ({
    id: row.id,
    userId: row.user_id ?? null,
    displayName: row.display_name,
    avatar: row.avatar ?? undefined,
    rating: row.rating,
    text: row.review_text,
    date: row.created_at,
    images: Array.isArray(row.images) ? row.images : [],
  }));
}

export async function addReview(
  productId: string,
  review: { userId: string | null; displayName: string; avatar?: string; rating: number; text: string; images?: string[] }
): Promise<void> {
  const { error } = await supabase.from('product_reviews').insert({
    product_id: productId,
    user_id: review.userId || null,
    display_name: review.displayName,
    avatar: review.avatar || null,
    rating: review.rating,
    review_text: review.text,
    images: review.images ?? [],
  });
  if (error) throw new Error(error.message);
}

export async function hasUserReviewed(productId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('product_reviews')
    .select('id')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase.from('product_reviews').delete().eq('id', reviewId);
  if (error) throw new Error(error.message);
}

export async function getAllReviews(): Promise<(Review & { productId: string })[]> {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map(row => ({
    id: row.id,
    productId: row.product_id,
    userId: row.user_id ?? null,
    displayName: row.display_name,
    avatar: row.avatar ?? undefined,
    rating: row.rating,
    text: row.review_text,
    date: row.created_at,
    images: Array.isArray(row.images) ? row.images : [],
  }));
}
