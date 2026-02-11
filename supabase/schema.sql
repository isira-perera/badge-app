-- ============================================================================
-- Badge/Achievement App - Supabase Schema
-- ============================================================================
-- Paste this entire file into the Supabase SQL Editor and run it.
-- It creates tables, RLS policies, triggers, views, and storage config.
-- ============================================================================


-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles: mirrors auth.users, auto-populated via trigger (see section 3)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url  TEXT,
  is_admin    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS
  'Public user profiles, auto-created when a new user signs up.';

-- ---------------------------------------------------------------------------
-- badges: shared badge definitions that any authenticated user can create
-- ---------------------------------------------------------------------------
CREATE TABLE public.badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  task        TEXT NOT NULL,
  image_url   TEXT,
  created_by  UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.badges IS
  'Global badge definitions. "task" describes what a user must do to earn the badge. '
  '"image_url" is nullable and gets filled once an AI-generated image is ready.';

-- ---------------------------------------------------------------------------
-- user_badges: junction table - who earned what, plus a personal reflection
-- ---------------------------------------------------------------------------
CREATE TABLE public.user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  badge_id    UUID NOT NULL REFERENCES public.badges (id) ON DELETE CASCADE,
  learning    TEXT NOT NULL,
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- a user can only earn a given badge once
  UNIQUE (user_id, badge_id)
);

COMMENT ON TABLE public.user_badges IS
  'Records which user earned which badge, along with their personal learning reflection.';


-- ============================================================================
-- 2. ROW-LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on every table ------------------------------------------------
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profiles policies
-- ---------------------------------------------------------------------------

-- Any logged-in user can see all profiles
CREATE POLICY "profiles: authenticated read"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile only
CREATE POLICY "profiles: owner update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING  (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Only admins can delete profiles
CREATE POLICY "profiles: admin delete"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Allow the trigger function (runs as postgres) to insert profiles
CREATE POLICY "profiles: service insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ---------------------------------------------------------------------------
-- badges policies
-- ---------------------------------------------------------------------------

-- Any logged-in user can view badges
CREATE POLICY "badges: authenticated read"
  ON public.badges FOR SELECT
  TO authenticated
  USING (true);

-- Any logged-in user can create a badge
CREATE POLICY "badges: authenticated insert"
  ON public.badges FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can update badges
CREATE POLICY "badges: admin update"
  ON public.badges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can delete badges
CREATE POLICY "badges: admin delete"
  ON public.badges FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- user_badges policies
-- ---------------------------------------------------------------------------

-- Any logged-in user can view all earned badges
CREATE POLICY "user_badges: authenticated read"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (true);

-- Users can award themselves a badge (user_id must be their own)
CREATE POLICY "user_badges: owner insert"
  ON public.user_badges FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own earned-badge records (e.g. edit their reflection)
CREATE POLICY "user_badges: owner update"
  ON public.user_badges FOR UPDATE
  TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Only admins can delete user_badges
CREATE POLICY "user_badges: admin delete"
  ON public.user_badges FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );


-- ============================================================================
-- 3. TRIGGER: auto-create a profile when a new user signs up
-- ============================================================================

-- The function extracts the part before '@' from the email to use as the
-- initial display_name. It runs as SECURITY DEFINER so it can bypass RLS.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      split_part(NEW.email, '@', 1),
      'user'
    )
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Trigger function: creates a profiles row whenever a new auth.users row is inserted.';

-- Attach the trigger to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- 4. VIEWS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- leaderboard: profiles ranked by number of badges earned
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.leaderboard
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.display_name,
  p.avatar_url,
  COUNT(ub.id)::int AS badge_count
FROM public.profiles p
LEFT JOIN public.user_badges ub ON ub.user_id = p.id
GROUP BY p.id, p.display_name, p.avatar_url
ORDER BY badge_count DESC;

COMMENT ON VIEW public.leaderboard IS
  'Profiles ranked by total badges earned (descending).';

-- ---------------------------------------------------------------------------
-- recent_activity: latest 50 badge awards with user + badge info
-- ---------------------------------------------------------------------------
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
  b.image_url    AS badge_image_url
FROM public.user_badges ub
JOIN public.profiles    p ON p.id = ub.user_id
JOIN public.badges      b ON b.id = ub.badge_id
ORDER BY ub.awarded_at DESC
LIMIT 50;

COMMENT ON VIEW public.recent_activity IS
  'The 50 most recent badge awards, joined with profile and badge details.';


-- ============================================================================
-- 5. STORAGE: public bucket for badge images
-- ============================================================================

-- Create the bucket (public so images can be displayed without auth)
INSERT INTO storage.buckets (id, name, public)
VALUES ('badge-images', 'badge-images', true);

-- Authenticated users can upload files to the badge-images bucket
CREATE POLICY "badge-images: authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'badge-images');

-- Anyone (including anonymous visitors) can read/download badge images
CREATE POLICY "badge-images: public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'badge-images');


-- ============================================================================
-- Done! Your badge app schema is ready.
-- ============================================================================
