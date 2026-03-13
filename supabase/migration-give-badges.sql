-- ============================================================================
-- Migration: "Give a Badge" re-architecture
-- ============================================================================
-- Adds given_by column, updates RLS policy, and refreshes views.
-- Safe to run on existing schema. Existing data can be cleared first if needed.
-- ============================================================================

-- 1. Add given_by column to user_badges
ALTER TABLE public.user_badges
  ADD COLUMN IF NOT EXISTS given_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL;

-- 2. Drop old RLS insert policy and create new one
DROP POLICY IF EXISTS "user_badges: owner insert" ON public.user_badges;
DROP POLICY IF EXISTS "user_badges: authenticated give" ON public.user_badges;

CREATE POLICY "user_badges: authenticated give"
  ON public.user_badges FOR INSERT
  TO authenticated
  WITH CHECK (given_by = auth.uid() AND user_id != auth.uid());

-- 3. Refresh leaderboard view (adds badges_given count)
CREATE OR REPLACE VIEW public.leaderboard
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.display_name,
  p.avatar_url,
  COUNT(ub.id)::int AS badge_count,
  (SELECT COUNT(*)::int FROM public.user_badges g WHERE g.given_by = p.id) AS badges_given
FROM public.profiles p
LEFT JOIN public.user_badges ub ON ub.user_id = p.id
GROUP BY p.id, p.display_name, p.avatar_url
ORDER BY badge_count DESC;

-- 4. Refresh recent_activity view (adds giver info)
CREATE OR REPLACE VIEW public.recent_activity
WITH (security_invoker = true) AS
SELECT
  ub.id          AS activity_id,
  ub.awarded_at,
  ub.learning,
  p.id           AS user_id,
  p.display_name,
  p.avatar_url,
  b.id           AS badge_id,
  b.name         AS badge_name,
  b.task         AS badge_task,
  b.image_url    AS badge_image_url,
  giver.id       AS giver_id,
  giver.display_name AS giver_display_name
FROM public.user_badges ub
JOIN public.profiles    p ON p.id = ub.user_id
JOIN public.badges      b ON b.id = ub.badge_id
LEFT JOIN public.profiles giver ON giver.id = ub.given_by
ORDER BY ub.awarded_at DESC
LIMIT 50;
