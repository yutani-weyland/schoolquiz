-- Check what categories exist in your database
-- Run this first to see what's available

-- Check all categories
SELECT 
    id, 
    name, 
    "parentId",
    CASE 
        WHEN "parentId" IS NULL THEN 'Top-level'
        ELSE 'Subcategory'
    END as category_type
FROM categories
ORDER BY "parentId" NULLS FIRST, name
LIMIT 20;

-- Count categories by type
SELECT 
    CASE 
        WHEN "parentId" IS NULL THEN 'Top-level'
        ELSE 'Subcategory'
    END as category_type,
    COUNT(*) as count
FROM categories
GROUP BY category_type;







