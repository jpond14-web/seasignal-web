-- Signal Flare: Accountability Loop for SeaSignal
-- Creates all tables, enums, RLS policies, triggers, and indexes

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE public.flare_category AS ENUM (
  'unsafe_water',
  'wage_theft',
  'forced_overtime',
  'document_retention',
  'unsafe_conditions',
  'harassment_abuse',
  'environmental_violation',
  'food_safety',
  'medical_neglect',
  'other'
);

CREATE TYPE public.flare_status AS ENUM (
  'pending',
  'published',
  'flagged',
  'removed'
);

CREATE TYPE public.flare_severity AS ENUM (
  'concern',
  'violation',
  'critical'
);

CREATE TYPE public.issue_stage AS ENUM (
  'monitoring',
  'emerging',
  'investigating',
  'company_contacted',
  'published',
  'resolved',
  'unresolved'
);

CREATE TYPE public.article_type AS ENUM (
  'investigation',
  'guide',
  'resolution_spotlight'
);

CREATE TYPE public.article_status AS ENUM (
  'draft',
  'review',
  'published'
);

CREATE TYPE public.outreach_type AS ENUM (
  'initial_contact',
  'follow_up',
  'company_response',
  'resolution_verification'
);

-- ============================================================
-- TABLES
-- ============================================================

-- Signal Articles (editorial content — created first as signal_issues references it)
CREATE TABLE public.signal_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_type public.article_type NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  author_id UUID REFERENCES public.profiles(id) ON UPDATE NO ACTION,
  status public.article_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  related_regulations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_articles_status ON public.signal_articles(status);
CREATE INDEX idx_articles_type ON public.signal_articles(article_type);
CREATE INDEX idx_articles_published ON public.signal_articles(published_at);

-- Signal Issues (aggregated issue per company+category)
CREATE TABLE public.signal_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON UPDATE NO ACTION,
  category public.flare_category NOT NULL,
  stage public.issue_stage DEFAULT 'monitoring',
  assigned_to UUID REFERENCES public.profiles(id) ON UPDATE NO ACTION,
  flare_count INT DEFAULT 0,
  corroboration_total INT DEFAULT 0,
  vessel_count INT DEFAULT 0,
  first_reported_at TIMESTAMPTZ,
  last_reported_at TIMESTAMPTZ,
  company_contacted_at TIMESTAMPTZ,
  company_response TEXT,
  company_responded_at TIMESTAMPTZ,
  resolution_description TEXT,
  resolution_date TIMESTAMPTZ,
  resolution_verified_by UUID REFERENCES public.profiles(id) ON UPDATE NO ACTION,
  is_recurring BOOLEAN DEFAULT false,
  article_id UUID UNIQUE REFERENCES public.signal_articles(id) ON UPDATE NO ACTION,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, category)
);

CREATE INDEX idx_issues_company ON public.signal_issues(company_id);
CREATE INDEX idx_issues_stage ON public.signal_issues(stage);

-- Signal Flares (individual seafarer reports)
CREATE TABLE public.signal_flares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON UPDATE NO ACTION,
  vessel_id UUID REFERENCES public.vessels(id) ON UPDATE NO ACTION,
  issue_id UUID REFERENCES public.signal_issues(id) ON UPDATE NO ACTION,
  category public.flare_category NOT NULL,
  severity public.flare_severity DEFAULT 'concern',
  title TEXT NOT NULL,
  description TEXT,
  incident_date_start DATE,
  incident_date_end DATE,
  attachments JSONB DEFAULT '[]',
  is_anonymous BOOLEAN DEFAULT true,
  batch_release_at TIMESTAMPTZ,
  status public.flare_status DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_flares_company ON public.signal_flares(company_id);
CREATE INDEX idx_flares_status ON public.signal_flares(status);
CREATE INDEX idx_flares_category ON public.signal_flares(category);
CREATE INDEX idx_flares_issue ON public.signal_flares(issue_id);
CREATE INDEX idx_flares_batch ON public.signal_flares(batch_release_at) WHERE status = 'pending';

-- Signal Flare Corroborations
CREATE TABLE public.signal_flare_corroborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flare_id UUID NOT NULL REFERENCES public.signal_flares(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  vessel_id UUID REFERENCES public.vessels(id) ON UPDATE NO ACTION,
  statement TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(flare_id, profile_id)
);

CREATE INDEX idx_corroborations_flare ON public.signal_flare_corroborations(flare_id);
CREATE INDEX idx_corroborations_profile ON public.signal_flare_corroborations(profile_id);

-- Signal Outreach Log (company communication trail)
CREATE TABLE public.signal_outreach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.signal_issues(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  outreach_type public.outreach_type NOT NULL,
  sent_to_email TEXT,
  sent_by UUID REFERENCES public.profiles(id) ON UPDATE NO ACTION,
  message_content TEXT,
  response_content TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX idx_outreach_issue ON public.signal_outreach_log(issue_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.signal_flares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_flare_corroborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_outreach_log ENABLE ROW LEVEL SECURITY;

-- Signal Flares: anyone can read published+released, authenticated users can insert their own
CREATE POLICY "Published flares are viewable by everyone"
  ON public.signal_flares FOR SELECT
  USING (status = 'published' AND batch_release_at <= now());

CREATE POLICY "Users can insert their own flares"
  ON public.signal_flares FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all flares"
  ON public.signal_flares FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE auth_user_id = auth.uid() AND is_admin = true
    )
  );

-- Corroborations: anyone can read, authenticated users insert their own
CREATE POLICY "Corroborations are viewable by everyone"
  ON public.signal_flare_corroborations FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own corroborations"
  ON public.signal_flare_corroborations FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Signal Issues: publicly readable (non-monitoring stages)
CREATE POLICY "Active issues are viewable by everyone"
  ON public.signal_issues FOR SELECT
  USING (stage != 'monitoring');

CREATE POLICY "Admins can manage all issues"
  ON public.signal_issues FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE auth_user_id = auth.uid() AND is_admin = true
    )
  );

-- Signal Articles: published articles are public
CREATE POLICY "Published articles are viewable by everyone"
  ON public.signal_articles FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can manage all articles"
  ON public.signal_articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE auth_user_id = auth.uid() AND is_admin = true
    )
  );

-- Outreach Log: admin only
CREATE POLICY "Admins can manage outreach logs"
  ON public.signal_outreach_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE auth_user_id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================
-- TRIGGERS: Auto-link flares to issues, maintain counts
-- ============================================================

-- When a flare is published, find or create the matching issue and link it
CREATE OR REPLACE FUNCTION public.link_flare_to_issue()
RETURNS TRIGGER AS $$
DECLARE
  v_issue_id UUID;
BEGIN
  -- Only act when a flare transitions to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    -- Find or create the issue for this company+category
    INSERT INTO public.signal_issues (company_id, category, first_reported_at, last_reported_at, flare_count, vessel_count)
    VALUES (NEW.company_id, NEW.category, NEW.created_at, NEW.created_at, 0, 0)
    ON CONFLICT (company_id, category)
    DO UPDATE SET last_reported_at = GREATEST(signal_issues.last_reported_at, NEW.created_at),
                  updated_at = now()
    RETURNING id INTO v_issue_id;

    -- Link the flare to the issue
    NEW.issue_id := v_issue_id;

    -- Update counts on the issue
    UPDATE public.signal_issues
    SET flare_count = (
          SELECT COUNT(*) FROM public.signal_flares
          WHERE issue_id = v_issue_id AND status = 'published'
        ) + 1, -- +1 for the current flare being published
        vessel_count = (
          SELECT COUNT(DISTINCT vessel_id) FROM public.signal_flares
          WHERE issue_id = v_issue_id AND status = 'published' AND vessel_id IS NOT NULL
        ) + CASE WHEN NEW.vessel_id IS NOT NULL THEN 1 ELSE 0 END,
        updated_at = now()
    WHERE id = v_issue_id;

    -- Auto-advance stage based on thresholds
    UPDATE public.signal_issues
    SET stage = CASE
      WHEN flare_count >= 5 OR vessel_count >= 3 THEN 'emerging'::public.issue_stage
      ELSE stage
    END
    WHERE id = v_issue_id AND stage = 'monitoring';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_link_flare_to_issue
  BEFORE UPDATE ON public.signal_flares
  FOR EACH ROW
  EXECUTE FUNCTION public.link_flare_to_issue();

-- Also handle initial insert that's immediately published (admin publish)
CREATE TRIGGER trg_link_flare_to_issue_insert
  BEFORE INSERT ON public.signal_flares
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION public.link_flare_to_issue();

-- When a corroboration is added, update the issue's corroboration_total
CREATE OR REPLACE FUNCTION public.update_corroboration_count()
RETURNS TRIGGER AS $$
DECLARE
  v_issue_id UUID;
BEGIN
  -- Get the issue_id from the flare
  SELECT issue_id INTO v_issue_id
  FROM public.signal_flares
  WHERE id = NEW.flare_id;

  IF v_issue_id IS NOT NULL THEN
    UPDATE public.signal_issues
    SET corroboration_total = (
          SELECT COUNT(*) FROM public.signal_flare_corroborations c
          JOIN public.signal_flares f ON f.id = c.flare_id
          WHERE f.issue_id = v_issue_id
        ),
        vessel_count = (
          SELECT COUNT(DISTINCT v.vid) FROM (
            SELECT vessel_id AS vid FROM public.signal_flares WHERE issue_id = v_issue_id AND vessel_id IS NOT NULL
            UNION
            SELECT vessel_id AS vid FROM public.signal_flare_corroborations c
            JOIN public.signal_flares f ON f.id = c.flare_id
            WHERE f.issue_id = v_issue_id AND c.vessel_id IS NOT NULL
          ) v
        ),
        updated_at = now()
    WHERE id = v_issue_id;

    -- Auto-advance from monitoring to emerging if thresholds met
    UPDATE public.signal_issues
    SET stage = 'emerging'::public.issue_stage
    WHERE id = v_issue_id
      AND stage = 'monitoring'
      AND (corroboration_total >= 3 OR vessel_count >= 3);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_corroboration_count
  AFTER INSERT ON public.signal_flare_corroborations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_corroboration_count();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.signal_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_signal_flares_updated
  BEFORE UPDATE ON public.signal_flares
  FOR EACH ROW EXECUTE FUNCTION public.signal_update_timestamp();

CREATE TRIGGER trg_signal_issues_updated
  BEFORE UPDATE ON public.signal_issues
  FOR EACH ROW EXECUTE FUNCTION public.signal_update_timestamp();

CREATE TRIGGER trg_signal_articles_updated
  BEFORE UPDATE ON public.signal_articles
  FOR EACH ROW EXECUTE FUNCTION public.signal_update_timestamp();
