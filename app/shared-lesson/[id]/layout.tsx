import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getOGBannerUrl } from '@/lib/lesson-banner-url-generator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch shared lesson data with full lesson details
    const { data: sharedLesson, error } = await supabase
      .from('shared_lessons')
      .select(`
        lesson_title,
        student_name,
        shared_at,
        banner_image_url,
        lesson_category,
        lesson_level,
        lesson:lessons (
          interactive_lesson_content,
          student:students (
            level,
            target_language
          )
        )
      `)
      .eq('id', params.id)
      .eq('is_active', true)
      .single();

    if (error || !sharedLesson) {
      return {
        title: 'Shared Lesson - LinguaFlow',
        description: 'View this interactive language lesson',
      };
    }

    // Extract lesson details
    const lessonContent = sharedLesson.lesson?.interactive_lesson_content;
    const studentLevel = sharedLesson.lesson_level || sharedLesson.lesson?.student?.level || 'intermediate';
    const targetLanguage = sharedLesson.lesson?.student?.target_language || 'English';
    
    // Get sub-topic details if available
    const subTopicTitle = lessonContent?.selected_sub_topic?.title || 
                         lessonContent?.name || 
                         sharedLesson.lesson_title;
    const subTopicCategory = sharedLesson.lesson_category ||
                            lessonContent?.selected_sub_topic?.category || 
                            lessonContent?.category || 
                            'Language Learning';
    const subTopicDescription = lessonContent?.selected_sub_topic?.description || 
                               lessonContent?.description || 
                               '';

    // Get banner image URL (use stored URL with proper OG dimensions or fallback)
    const bannerImageUrl = getOGBannerUrl(sharedLesson.banner_image_url);

    // Create rich title and description
    const title = `${subTopicTitle} - ${studentLevel.toUpperCase()} Level | LinguaFlow`;
    const description = `${subTopicCategory} lesson for ${sharedLesson.student_name}. ${subTopicDescription ? subTopicDescription.substring(0, 150) + '...' : `Interactive ${targetLanguage} lesson with vocabulary, dialogues, and exercises.`}`;
    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://linguaflow.com'}/shared-lesson/${params.id}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName: 'LinguaFlow',
        type: 'article',
        // Use the actual lesson banner image
        images: [
          {
            url: bannerImageUrl,
            width: 1200,
            height: 630,
            alt: `${subTopicTitle} - ${subTopicCategory}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [bannerImageUrl],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Shared Lesson - LinguaFlow',
      description: 'View this interactive language lesson',
    };
  }
}

export default function SharedLessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
