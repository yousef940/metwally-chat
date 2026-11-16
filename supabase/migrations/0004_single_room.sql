-- ==============================================================================
-- 0004_single_room.sql: Primary Single Room Configuration
-- Description: Configures a single unified room ('main') for friends chat
--              and sets legacy multi-rooms to inactive.
-- ==============================================================================

INSERT INTO public.rooms (slug, name, description, country, topic, is_active)
VALUES (
  'main',
  'الدردشة الجماعية',
  'غرفة الدردشة والتواصل الرئيسية لجميع الأصدقاء',
  'جميع الدول',
  'شات الأصدقاء',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  country = EXCLUDED.country,
  topic = EXCLUDED.topic,
  is_active = true;

-- Keep only the main room active
UPDATE public.rooms
SET is_active = false
WHERE slug <> 'main';
