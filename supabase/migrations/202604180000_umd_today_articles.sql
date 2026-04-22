-- ============================================================
-- UMD Today Articles
-- Stores scraped news articles from today.umd.edu
-- ============================================================

CREATE TABLE IF NOT EXISTS public.umd_articles (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title         text        NOT NULL,
  summary       text,
  body_html     text,
  hero_image_url text,
  inline_images jsonb       DEFAULT '[]'::jsonb,
  category      text        DEFAULT 'Campus',
  author        text,
  published_at  timestamptz,
  source_url    text        NOT NULL UNIQUE,
  reading_time_min integer  DEFAULT 3,
  scraped_at    timestamptz DEFAULT now(),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Updated-at trigger
CREATE TRIGGER update_umd_articles_updated_at
  BEFORE UPDATE ON public.umd_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX idx_umd_articles_published_at ON public.umd_articles (published_at DESC);
CREATE INDEX idx_umd_articles_category     ON public.umd_articles (category);
CREATE INDEX idx_umd_articles_scraped_at   ON public.umd_articles (scraped_at DESC);

-- RLS: anyone can read articles (public content)
ALTER TABLE public.umd_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read UMD articles"
  ON public.umd_articles FOR SELECT
  USING (true);

-- Only service role can insert/update (the scraper edge function)
CREATE POLICY "Service role can manage UMD articles"
  ON public.umd_articles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
