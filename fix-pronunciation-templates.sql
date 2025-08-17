-- Fix pronunciation templates by updating lesson_structure to sections
-- This script directly updates the existing pronunciation templates in the database

-- Update Pronunciation A2 template
UPDATE lesson_templates 
SET template_json = jsonb_set(
    template_json - 'lesson_structure', 
    '{sections}', 
    template_json->'lesson_structure'
)
WHERE template_name = 'Pronunciation A2' 
AND template_json ? 'lesson_structure';

-- Update Pronunciation B1 template  
UPDATE lesson_templates 
SET template_json = jsonb_set(
    template_json - 'lesson_structure', 
    '{sections}', 
    template_json->'lesson_structure'
)
WHERE template_name = 'Pronunciation B1' 
AND template_json ? 'lesson_structure';

-- Update Pronunciation B2 template
UPDATE lesson_templates 
SET template_json = jsonb_set(
    template_json - 'lesson_structure', 
    '{sections}', 
    template_json->'lesson_structure'
)
WHERE template_name = 'Pronunciation B2' 
AND template_json ? 'lesson_structure';

-- Verify the updates
SELECT 
    template_name,
    CASE 
        WHEN template_json ? 'sections' THEN '✅ Fixed - has sections'
        WHEN template_json ? 'lesson_structure' THEN '❌ Still broken - has lesson_structure'
        ELSE '❓ Unknown structure'
    END as status
FROM lesson_templates 
WHERE template_name LIKE 'Pronunciation%'
ORDER BY template_name;