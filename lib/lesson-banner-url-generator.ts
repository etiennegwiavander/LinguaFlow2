/**
 * Generate banner image URL for lesson sharing
 * This extracts or generates the appropriate banner image URL based on lesson content
 */

import { getInstantImage } from './ai-image-generator';

export function getLessonBannerUrl(lesson: any): string | null {
  try {
    // Try to get from interactive lesson content
    const lessonContent = lesson.interactive_lesson_content;
    
    if (!lessonContent) {
      return null;
    }

    // Get lesson title from various possible locations
    const lessonTitle = lessonContent.selected_sub_topic?.title || 
                       lessonContent.name || 
                       lessonContent.title ||
                       'Language Lesson';

    // Use the same logic as useLessonBanner to get the curated image
    const curatedImageUrl = getInstantImage(lessonTitle);
    
    if (curatedImageUrl) {
      return curatedImageUrl;
    }

    // Fallback to a default educational image
    return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=630&fit=crop&crop=center';
  } catch (error) {
    console.error('Error generating lesson banner URL:', error);
    return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=630&fit=crop&crop=center';
  }
}

/**
 * Get banner URL with proper dimensions for Open Graph
 */
export function getOGBannerUrl(bannerUrl: string | null): string {
  if (!bannerUrl) {
    return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=630&fit=crop&crop=center';
  }

  // If it's an Unsplash URL, ensure it has the right dimensions
  if (bannerUrl.includes('unsplash.com')) {
    // Add or update Unsplash parameters for Open Graph dimensions
    const url = new URL(bannerUrl);
    url.searchParams.set('w', '1200');
    url.searchParams.set('h', '630');
    url.searchParams.set('fit', 'crop');
    url.searchParams.set('crop', 'center');
    return url.toString();
  }

  // For other URLs, return as-is
  return bannerUrl;
}
