
ALTER TABLE academy_exercises ADD COLUMN organization_id uuid REFERENCES organizations(id);
ALTER TABLE academy_practices ADD COLUMN organization_id uuid REFERENCES organizations(id);
ALTER TABLE academy_quizzes ADD COLUMN organization_id uuid REFERENCES organizations(id);

-- Backfill from existing paths
UPDATE academy_exercises e SET organization_id = p.organization_id
FROM academy_modules m 
JOIN academy_path_modules pm ON pm.module_id = m.id
JOIN academy_paths p ON p.id = pm.path_id 
WHERE m.id = e.module_id;

UPDATE academy_practices pr SET organization_id = p.organization_id
FROM academy_modules m 
JOIN academy_path_modules pm ON pm.module_id = m.id
JOIN academy_paths p ON p.id = pm.path_id 
WHERE m.id = pr.module_id;

UPDATE academy_quizzes q SET organization_id = p.organization_id
FROM academy_modules m 
JOIN academy_path_modules pm ON pm.module_id = m.id
JOIN academy_paths p ON p.id = pm.path_id 
WHERE m.id = q.module_id;
