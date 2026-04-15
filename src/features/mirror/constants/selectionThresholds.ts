/**
 * Final selection and ranking adjacency (tune without touching generation).
 */

/**
 * If the top candidate’s `rankScore` is below this, no `main` card is emitted.
 * Supporting cards may still appear when they meet the support floor (see `selectFinalReflections`).
 */
export const MIRROR_SELECTION_MIN_RANK_SCORE_FOR_MAIN = 40;

/** Supporting cards require at least this `rankScore` (in addition to category diversity). */
export const MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT = 34;

/**
 * When two candidates’ `rankScore` differ by at most this amount, prefer the one with higher
 * statement specificity (more grounded / less generic fallback copy).
 */
export const MIRROR_SELECTION_RANK_SCORE_NEAR_DELTA = 5;

/** Maximum supporting reflections (not including main). */
export const MIRROR_SELECTION_MAX_SUPPORTING = 4;
