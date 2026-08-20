-- K-뷰티 산업 지형도 persistent data model
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  company TEXT NOT NULL,
  revenue_2025 BIGINT NOT NULL DEFAULT 0,
  revenue_2025_consolidated BIGINT NOT NULL DEFAULT 0,
  revenue_2024 BIGINT NOT NULL DEFAULT 0,
  revenue_2024_consolidated BIGINT NOT NULL DEFAULT 0,
  brands TEXT NOT NULL DEFAULT '',
  odm TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL DEFAULT '',
  ownership TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  hq TEXT NOT NULL DEFAULT '',
  seoul_office TEXT NOT NULL DEFAULT '',
  gyeonggi_office TEXT NOT NULL DEFAULT '',
  factory TEXT NOT NULL DEFAULT '',
  logistics TEXT NOT NULL DEFAULT '',
  memo TEXT NOT NULL DEFAULT '',
  manual_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_research (
  id BIGSERIAL PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  value TEXT NOT NULL,
  source_url TEXT NOT NULL DEFAULT '',
  source_name TEXT NOT NULL DEFAULT '',
  source_date DATE,
  confidence TEXT NOT NULL DEFAULT 'unverified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_financials (
  id BIGSERIAL PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  separate_revenue BIGINT,
  consolidated_revenue BIGINT,
  source TEXT NOT NULL,
  source_url TEXT NOT NULL DEFAULT '',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, fiscal_year, source)
);

CREATE TABLE IF NOT EXISTS company_memos (
  id BIGSERIAL PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  author TEXT NOT NULL DEFAULT 'admin',
  memo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_directories (
  id TEXT PRIMARY KEY,
  media_type TEXT NOT NULL CHECK (media_type IN ('video','youtube','image')),
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES media_directories(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_items (
  id TEXT PRIMARY KEY,
  directory_id TEXT REFERENCES media_directories(id) ON DELETE SET NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('video','youtube','image','pdf')),
  title TEXT NOT NULL,
  file_url TEXT,
  blob_pathname TEXT,
  youtube_url TEXT,
  thumbnail_url TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  metadata_json JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE media_directories ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES media_directories(id) ON DELETE CASCADE;
ALTER TABLE media_directories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS metadata_json JSONB;
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_companies_category ON companies(category);
CREATE INDEX IF NOT EXISTS idx_company_research_company ON company_research(company_id);
CREATE INDEX IF NOT EXISTS idx_company_financials_company_year ON company_financials(company_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_company_memos_company ON company_memos(company_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_directories_type ON media_directories(media_type, parent_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_media_items_type ON media_items(media_type);
CREATE INDEX IF NOT EXISTS idx_media_items_directory ON media_items(directory_id, sort_order);
