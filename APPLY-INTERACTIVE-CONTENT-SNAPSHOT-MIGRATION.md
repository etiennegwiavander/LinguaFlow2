# Apply Interactive Content Snapshot Migration

## Problem
Shared lesson links are showing the wrong content because they all point to the same parent lesson, which gets overwritten when you generate new interactive content.

## Solution
Add an `interactive_content_snapshot` column to the `shared_lessons` table to store a copy of the content at the time of sharing.

## Steps to Apply

### 1. Run this SQL in Supabase Dashboard SQL Editor:

```sql
-- Add interactive_content_snapshot column to shared_lessons table
ALTER TABLE shared_lessons 
ADD COLUMN IF NOT EXISTS interactive_content_snapshot JSONB;

-- Add comment explaining the purpose
COMMENT ON COLUMN shared_lessons.interactive_content_snapshot IS 
'Snapshot of the interactive lesson content at the time of sharing. This ensures shared links always show the correct content even if the parent lesson is regenerated with different content.';
```

### 2. Verify the column was added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shared_lessons' 
AND column_name = 'interactive_content_snapshot';
```

### 3. Test by sharing a new lesson

After applying the migration:
1. Go to a student's profile
2. View a lesson from history
3. Click "Share with Student"
4. The new shared lesson record will include the `interactive_content_snapshot`
5. The shared link will now show the correct content

## What Changed

### Code Changes:
1. **components/lessons/LessonMaterialDisplay.tsx** - Now stores `interactive_content_snapshot` when creating shared lessons
2. **app/shared-lesson/[id]/page.tsx** - Now uses `interactive_content_snapshot` instead of fetching from parent lesson

### Database Changes:
1. Added `interactive_content_snapshot` JSONB column to `shared_lessons` table

## Impact
- **Existing shared links**: Will continue to work but will show the current lesson content (old behavior)
- **New shared links**: Will show the correct content that was shared (fixed behavior)
- **No breaking changes**: The system falls back to the old behavior if snapshot is not available

## Why This Works
Instead of relying on the parent `lesson.interactive_lesson_content` (which gets overwritten), each shared link now has its own immutable snapshot of the content that was shared.
