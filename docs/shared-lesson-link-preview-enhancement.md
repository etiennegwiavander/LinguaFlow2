# Shared Lesson Link Preview Enhancement

## Overview

Enhanced the shared lesson links to display rich previews with lesson title and banner image when shared on messaging platforms (WhatsApp, Slack, etc.) or social media.

## What Was Implemented

### 1. Open Graph Image Generation (`app/shared-lesson/[id]/opengraph-image.tsx`)

Created a dynamic Open Graph image that generates a beautiful preview card for each shared lesson:

**Features:**
- Displays lesson title prominently
- Shows student name
- LinguaFlow branding
- Beautiful gradient background (purple to violet)
- 1200x630px (optimal for social media)

**How it works:**
- Uses Next.js `ImageResponse` API
- Fetches lesson data from Supabase
- Generates image on-the-fly for each share link
- Falls back to generic image if data fetch fails

### 2. Metadata Generation (`app/shared-lesson/[id]/layout.tsx`)

Created server-side metadata generation for rich link previews:

**Metadata includes:**
- **Title**: `{Lesson Title} - LinguaFlow`
- **Description**: `Interactive language lesson for {Student Name}. Shared on {Date}`
- **Open Graph tags**: For Facebook, LinkedIn, etc.
- **Twitter Card tags**: For Twitter/X
- **Dynamic image**: Links to the generated OG image

### 3. Enhanced Share Success Message

Updated the success toast to show the lesson title:

```typescript
toast.success('Lesson link created and copied to clipboard!', {
  description: `"${lessonTitle}" - Link expires in 7 days.`,
  duration: 5000,
});
```

## How It Works

### When a Tutor Shares a Lesson:

1. **Click "Share with Student"** button
2. System creates a `shared_lessons` record with:
   - `lesson_id`
   - `lesson_title` (for preview)
   - `student_name` (for preview)
   - `expires_at` (7 days)
3. **Generates shareable URL**: `https://linguaflow.com/shared-lesson/{share-id}`
4. **Shows success message** with lesson title
5. **Displays preview card** with lesson info

### When the Link is Shared:

1. **Messaging apps/Social media** request the URL
2. **Next.js server** generates metadata:
   - Fetches lesson data from `shared_lessons` table
   - Creates Open Graph tags
   - Generates preview image
3. **Platform displays rich preview**:
   - Lesson title as heading
   - Student name and share date as description
   - Beautiful branded image
4. **User clicks link** → Opens shared lesson page

## Example Preview

When shared on WhatsApp/Slack/etc., the link will show:

```
┌─────────────────────────────────────┐
│  [Beautiful gradient image with]    │
│  [lesson title and LinguaFlow logo] │
├─────────────────────────────────────┤
│ B2 Conversation Lesson - LinguaFlow │
│ Interactive language lesson for     │
│ John Smith. Shared on Dec 20, 2025  │
└─────────────────────────────────────┘
```

## Benefits

### For Tutors:
- ✅ **Easy identification**: Can see which lesson they're sharing
- ✅ **Professional appearance**: Branded, polished previews
- ✅ **Better organization**: Lesson title visible in chat history
- ✅ **Increased trust**: Students see it's a legitimate lesson

### For Students:
- ✅ **Clear context**: Know what lesson they're receiving
- ✅ **Visual appeal**: Attractive preview encourages clicking
- ✅ **Confidence**: Professional appearance builds trust

## Technical Details

### Files Created:
1. `app/shared-lesson/[id]/opengraph-image.tsx` - Dynamic OG image generator
2. `app/shared-lesson/[id]/layout.tsx` - Metadata provider

### Files Modified:
1. `components/lessons/LessonMaterialDisplay.tsx` - Enhanced success message

### Technologies Used:
- **Next.js Image Response API**: For dynamic image generation
- **Open Graph Protocol**: For rich link previews
- **Twitter Cards**: For Twitter/X previews
- **Supabase**: For fetching lesson data

### Performance:
- Images generated on Edge runtime (fast)
- Cached by platforms after first fetch
- Minimal impact on page load

## Testing

### Test the Preview:

1. **Share a lesson** and copy the link
2. **Paste in WhatsApp/Slack**:
   - Should show lesson title
   - Should show student name
   - Should show branded image
3. **Test on different platforms**:
   - WhatsApp ✅
   - Slack ✅
   - Facebook ✅
   - Twitter/X ✅
   - LinkedIn ✅

### Debug Preview:

Use these tools to test Open Graph tags:
- **Facebook**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **LinkedIn**: https://www.linkedin.com/post-inspector/

## Future Enhancements

Potential improvements:
- Add lesson category/level to preview
- Include lesson duration estimate
- Show tutor name/photo
- Add completion status for returning students
- Customize image colors based on lesson category

## Conclusion

The shared lesson links now provide rich, informative previews that make it easy for tutors to identify lessons and create a professional impression for students. The implementation uses modern web standards (Open Graph, Twitter Cards) and Next.js capabilities for optimal performance and compatibility across platforms.
