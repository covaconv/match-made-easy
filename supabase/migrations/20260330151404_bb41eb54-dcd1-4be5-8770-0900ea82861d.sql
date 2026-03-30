
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('founder', 'mentor')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE TABLE public.founder_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  majors text[] NOT NULL DEFAULT '{}',
  startup_name text NOT NULL,
  startup_stage text NOT NULL,
  industry text NOT NULL,
  main_challenge text NOT NULL,
  support_needs text[] NOT NULL DEFAULT '{}',
  meeting_frequency text NOT NULL,
  three_month_goal text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.founder_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founders can read own profile" ON public.founder_profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Founders can update own profile" ON public.founder_profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Founders can insert own profile" ON public.founder_profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE TABLE public.mentor_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  majors text[] NOT NULL DEFAULT '{}',
  "current_role" text NOT NULL,
  experience_background text[] NOT NULL DEFAULT '{}',
  expertise text[] NOT NULL DEFAULT '{}',
  industries text[] NOT NULL DEFAULT '{}',
  preferred_mentee_stages text[] NOT NULL DEFAULT '{}',
  meeting_frequency text NOT NULL,
  monthly_time text NOT NULL,
  mentoring_capacity text NOT NULL,
  current_matches integer NOT NULL DEFAULT 0,
  three_month_outcome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can read own profile" ON public.mentor_profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Mentors can update own profile" ON public.mentor_profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Mentors can insert own profile" ON public.mentor_profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE TABLE public.meetups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid NOT NULL REFERENCES public.founder_profiles(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES public.mentor_profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_meetups_founder ON public.meetups(founder_id);
CREATE INDEX idx_meetups_mentor ON public.meetups(mentor_id);
CREATE INDEX idx_meetups_status ON public.meetups(status);

CREATE POLICY "Founders can create meetups" ON public.meetups
  FOR INSERT TO authenticated WITH CHECK (founder_id = auth.uid());
CREATE POLICY "Founders can read own meetups" ON public.meetups
  FOR SELECT TO authenticated USING (founder_id = auth.uid());
CREATE POLICY "Mentors can read their meetups" ON public.meetups
  FOR SELECT TO authenticated USING (mentor_id = auth.uid());
CREATE POLICY "Mentors can update meetup status" ON public.meetups
  FOR UPDATE TO authenticated USING (mentor_id = auth.uid()) WITH CHECK (mentor_id = auth.uid());

CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id uuid NOT NULL REFERENCES public.meetups(id) ON DELETE CASCADE,
  given_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  qualitative_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_feedback_meetup ON public.feedback(meetup_id);

CREATE OR REPLACE FUNCTION public.validate_feedback_rating()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_feedback_rating
  BEFORE INSERT OR UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.validate_feedback_rating();

CREATE POLICY "Participants can insert feedback" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meetups m
      WHERE m.id = meetup_id AND m.status = 'completed'
        AND (m.founder_id = auth.uid() OR m.mentor_id = auth.uid())
    ) AND given_by = auth.uid()
  );

CREATE POLICY "Participants can read feedback" ON public.feedback
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.meetups m
      WHERE m.id = meetup_id
        AND (m.founder_id = auth.uid() OR m.mentor_id = auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_founder_profiles_updated_at
  BEFORE UPDATE ON public.founder_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_mentor_profiles_updated_at
  BEFORE UPDATE ON public.mentor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'founder'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
