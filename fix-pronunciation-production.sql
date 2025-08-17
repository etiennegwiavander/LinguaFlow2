-- Fix pronunciation templates in production database
-- Run this script against your production Supabase database

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
    END as status,
    jsonb_array_length(COALESCE(template_json->'sections', template_json->'lesson_structure')) as section_count
FROM lesson_templates 
WHERE template_name LIKE 'Pronunciation%'
ORDER BY template_name;