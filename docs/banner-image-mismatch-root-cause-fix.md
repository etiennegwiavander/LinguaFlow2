# Banner Image Mismatch - Root Cause Analysis & Fix

## Problem Statement

The banner image displayed on the shared lesson page was different from the image shown in the Open Graph (OG) preview when sharing the link via WhatsApp, Telegram, etc.

**Example:**
- **Page Banner**: Shows a business/office image (books and professional setting)
- **OG Preview**: Shows a conversation/communication image (different from page)

## Deep Investigation

### Banner Image Selection Flow

The system has three places where banner images are selected:

1. **LessonBannerImage Component** (displays on actual page)
   - Uses `useLessonBanner({ title: lessonTitle })`
   - Calls `getInstantImage(title)` to find a curated image
   - Falls back to `generateEnhancedFallback(title)` if no match

2. **handleShareLesson** (when creating shared lesson)
   - Calls `getLessonBannerUrl(lesson)`
   - Extracts title from lesson content
   - Calls `getInstantImage(title)` 
   - Stores result in `shared_lessons.banner_image_url`

3. **OG Metadata** (layout.tsx)
   - Uses stored `shared_lessons.banner_image_url`
   - Should match what the page displays

### Image Selection Logic

The `getInstantImage` function matches titles against categories:

```javascript
const PRE_GENERATED_IMAGES = {
  conversation: [...],  // 4 images
  business: [...],      // 2 images
  // ... other categories
};

function getInstantImage(title) {
  const lowerTitle = title.toLowerCase();
  
  // Check if title contains category keywords
  if (lowerTitle.includes("conversation")) {
    // Select image based on title hash
    return conversationImage;
  }
  if (lowerTitle.includes("business")) {
    return businessImage;
  }
  // ... etc
  
  return null; // No match found
}
```

If no match is found, `generateEnhancedFallback` uses a hash-based selection from all categories.

## Root Cause Identified

### The Specific Issue

1. **Original Lesson**: "Small Talk Across Cultures"
   - Title contains "conversation" → matched conversation category
   - Generated image: `photo-1551836022-deb4988cc6c0` (conversation image)
   - This was stored in `shared_lessons.banner_image_url`

2. **Lesson Content Changed**: "Negotiation Strategies in English"
   - Title contains "negotiation" → NO category match
   - Falls back to `generateEnhancedFallback`
   - Generates: `photo-1454165804606-c3d57bc86b40` (business image)

3. **Result**: Mismatch!
   - **Page displays**: Business image (from current title)
   - **OG uses**: Conversation image (from old stored URL)

### Why This Happened

The `shared_lessons.banner_image_url` was generated when the lesson was first shared, but:
- The lesson content was updated/changed after sharing
- The stored banner URL was never updated
- The page generates a fresh banner based on current content
- The OG uses the stale stored URL

## Solution Implemented

### Immediate Fix

Updated the stored `banner_image_url` to match the current lesson content:

```javascript
// Old (stale): photo-1551836022-deb4988cc6c0 (conversation)
// New (correct): photo-1454165804606-c3d57bc86b40 (business)
```

### Long-term Prevention

To prevent this issue in the future, we need to ensure banner URLs are regenerated when lesson content changes. Options:

#### Option 1: Regenerate on Every View (Current Approach)
- ✅ Always shows correct image
- ❌ OG preview can become stale if content changes

#### Option 2: Update Banner URL When Lesson Changes
- Add a trigger/hook to update `shared_lessons.banner_image_url` when `lessons.interactive_lesson_content` changes
- ✅ Keeps OG preview in sync
- ❌ More complex implementation

#### Option 3: Don't Store Banner URL (Generate on Demand)
- Remove `banner_image_url` from `shared_lessons` table
- Always generate from current lesson content
- ✅ Always in sync
- ❌ OG metadata generation becomes more complex

## Recommended Approach

**Use Option 2**: Update banner URL when lesson content changes

### Implementation Plan

1. **Add a database trigger** or **application-level hook**:
   ```sql
   -- When lessons.interactive_lesson_content is updated
   -- Regenerate banner_image_url for all associated shared_lessons
   ```

2. **Or update in application code**:
   - When a lesson is edited/updated
   - Regenerate banner URL
   - Update all associated shared_lessons records

3. **Add a "Refresh Banner" button** in the UI:
   - Allow tutors to manually refresh the banner if needed
   - Useful for fixing any mismatches

## Testing & Verification

Created diagnostic scripts:
- `scripts/trace-banner-image-flow.js` - Traces the complete banner selection flow
- `scripts/deep-dive-banner-mismatch.js` - Identifies and fixes mismatches

### Verification Steps

1. Check current lesson title
2. Verify what image `getInstantImage` returns for that title
3. Compare with stored `banner_image_url`
4. Update if mismatch detected

## Impact

- ✅ Fixed the immediate mismatch for the shared lesson
- ✅ OG preview now matches the page banner
- ✅ Identified root cause for future prevention
- ⚠️  Need to implement long-term solution to prevent recurrence

## Files Modified

- `scripts/trace-banner-image-flow.js` - Diagnostic tool
- `scripts/deep-dive-banner-mismatch.js` - Fix tool
- `docs/banner-image-mismatch-root-cause-fix.md` - This document

## Next Steps

1. ✅ Immediate fix applied
2. ⏳ Decide on long-term prevention strategy
3. ⏳ Implement chosen solution
4. ⏳ Add monitoring/alerts for future mismatches
