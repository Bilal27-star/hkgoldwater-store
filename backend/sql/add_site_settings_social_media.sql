-- Run once in Supabase SQL editor if `social_media` column is missing.
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS social_media jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN site_settings.social_media IS 'Facebook, Instagram, TikTok URLs and WhatsApp phone; managed via admin Social Media UI';
