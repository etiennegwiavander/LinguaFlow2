# Open Graph Banner Consistency Fix

## Problem
The Open Graph (OG) preview image for shared lessons was sometimes different from the banner image displayed on the actual lesson page. This happened because:

1. The lesson page would display a banner image based on the lesson content
2. The OG metadata was generating a different image based on the lesson title
3. This caused inconsistency when sharing lessons via WhatsApp, Telegram, etc.

## Root Cause
The `generateMetadata` function in `app/shared-lesson/[id]/layout.tsx` was always generating a new banner URL from the lesson content, instead of using the `banner_image_url` that was already stored in the `shared_lessons` table when the lesson was shared.

## Solution
Modified the banner URL generation logic to:

1. **Prioritize stored URL**: First check if `shared_lessons.banner_image_url` exists
2. **Use stored URL**: If it exists, use it for the OG preview
3. **Fallback to generation**: Only generate a new URL if no stored URL exists

### Code Changes

#### `app/shared-lesson/[id]/layout.tsx`
```typescript
// OLD: Always generate from lesson content
const bannerImageUrl = getOGBannerUrl(sharedLesson.banner_image_url);

// NEW: Use stored URL first, then fallback to generation
const bannerImageUrl = sharedLesson.banner_image_url 
  ? getOGBannerUrl(sharedLesson.banner_image_url)
  : getOGBannerUrl(getLessonBannerUrl(lesson));
```

#### `lib/lesson-banner-url-generator.ts`
- Added null check for lesson parameter
- Improved error handling
- Ensured consistent fallback behavior

## Benefits

1. **Consistency**: OG preview now matches the actual lesson banner
2. **Performance**: Uses cached banner URL instead of regenerating
3. **Reliability**: Fallback logic ensures a banner is always available
4. **User Experience**: Students see the same image in link previews as on the actual page

## Testing

Created test scripts to verify:
- `scripts/check-shared-lesson-banner.js` - Checks banner URLs in database
- `scripts/test-og-banner-fix.js` - Verifies the fix logic

## Database Schema

The `shared_lessons` table includes:
- `banner_image_url` - Stores the lesson banner URL when shared
- `lesson_title` - Used as fallback for generating banners
- `lesson_category` - Used in OG description
- `lesson_level` - Used in OG title

## Migration Notes

Existing shared lessons without `banner_image_url` will automatically generate one using the fallback logic. New shared lessons will store the banner URL when created.
