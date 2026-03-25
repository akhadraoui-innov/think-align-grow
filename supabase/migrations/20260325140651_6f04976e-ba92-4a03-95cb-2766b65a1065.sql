
-- Update observatory_assets to populate last_modified_by and contributor_ids from source tables' created_by field

-- Paths
UPDATE observatory_assets oa
SET last_modified_by = p.created_by,
    contributor_ids = ARRAY[p.created_by],
    contributor_count = 1
FROM academy_paths p
WHERE oa.asset_type = 'path' AND oa.asset_id = p.id AND oa.last_modified_by IS NULL;

-- Personae
UPDATE observatory_assets oa
SET last_modified_by = p.created_by,
    contributor_ids = ARRAY[p.created_by],
    contributor_count = 1
FROM academy_personae p
WHERE oa.asset_type = 'persona' AND oa.asset_id = p.id AND oa.last_modified_by IS NULL;

-- Campaigns
UPDATE observatory_assets oa
SET last_modified_by = c.created_by,
    contributor_ids = ARRAY[c.created_by],
    contributor_count = 1
FROM academy_campaigns c
WHERE oa.asset_type = 'campaign' AND oa.asset_id = c.id AND oa.last_modified_by IS NULL;

-- For quizzes, exercises, practices: no created_by column, use snapshot->>'created_by' if available
UPDATE observatory_assets oa
SET last_modified_by = (oa.snapshot->>'created_by')::uuid,
    contributor_ids = ARRAY[(oa.snapshot->>'created_by')::uuid],
    contributor_count = 1
WHERE oa.last_modified_by IS NULL 
  AND oa.snapshot->>'created_by' IS NOT NULL
  AND oa.asset_type IN ('quiz', 'exercise', 'practice');
