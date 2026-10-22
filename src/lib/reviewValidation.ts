export interface ReviewDraft {
  rating: number | null;
  title: string;
  body: string;
}

export type ReviewValidationError = 'rating' | 'body' | 'title_too_long' | 'body_too_long';

/** Client-side form validation only; the secure backend must repeat these checks. */
export function validateReviewDraft(draft: ReviewDraft): ReviewValidationError[] {
  const errors: ReviewValidationError[] = [];
  if (!Number.isInteger(draft.rating) || draft.rating === null || draft.rating < 1 || draft.rating > 5) {
    errors.push('rating');
  }
  if (!draft.body.trim()) errors.push('body');
  if (draft.title.length > 120) errors.push('title_too_long');
  if (draft.body.length > 3000) errors.push('body_too_long');
  return errors;
}
