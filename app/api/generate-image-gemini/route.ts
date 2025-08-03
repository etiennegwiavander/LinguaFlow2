import { NextRequest, NextResponse } from 'next/server';

// Pre-generated educational images for fallback
const PRE_GENERATED_IMAGES = {
  'conversation': [
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1792&h=1024&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=1792&h=1024&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1792&h=1024&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1792&h=1024&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1792&h=1024&fit=crop&crop=center'
  ],
  'grammar': [
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1792&h=1024&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1792&h=1024&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=1792&h=1024&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1792&h=1024&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1792&h=1024&fit=crop&crop=center'
  ],
  'general': [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1792&h=1024&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1792&h=1024&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1792&h=1024&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1792&h=1024&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1792&h=1024&fit=crop&crop=center'
  ]
};

function getEducationalFallbackImage(prompt: string): string {
  // Use prompt to select appropriate category and image
  const lowerPrompt = prompt.toLowerCase();
  let category = 'general';
  
  if (lowerPrompt.includes('conversation') || lowerPrompt.includes('speak') || lowerPrompt.includes('talk')) {
    category = 'conversation';
  } else if (lowerPrompt.includes('grammar') || lowerPrompt.includes('writing') || lowerPrompt.includes('language')) {
    category = 'grammar';
  }
  
  const imageArray = PRE_GENERATED_IMAGES[category as keyof typeof PRE_GENERATED_IMAGES];
  const hash = prompt.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const imageIndex = hash % imageArray.length;
  
  return imageArray[imageIndex];
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, aspectRatio = '16:9' } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Check if we have Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.warn('Gemini API key not found, using educational fallback image');
      // Return a pre-generated educational image
      const fallbackUrl = getEducationalFallbackImage(prompt || 'Generated Banner');
      return NextResponse.json({ imageUrl: fallbackUrl });
    }

    // For now, Gemini doesn't directly generate images, so we'll use it to enhance the prompt
    // and then use a placeholder service with better styling
    
    try {
      // Call Gemini to enhance the prompt for better image generation
      const enhancedPromptResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Enhance this image generation prompt to be more descriptive and visually appealing for an educational banner: "${prompt}". Return only the enhanced prompt, no explanations.`
            }]
          }]
        }),
      });

      if (enhancedPromptResponse.ok) {
        const enhancedData = await enhancedPromptResponse.json();
        const enhancedPrompt = enhancedData.candidates?.[0]?.content?.parts?.[0]?.text || prompt;
        
        // Return educational fallback image with enhanced prompt context
        const fallbackUrl = getEducationalFallbackImage(enhancedPrompt || prompt);
        return NextResponse.json({ imageUrl: fallbackUrl });
      }
    } catch (geminiError) {
      console.warn('Gemini enhancement failed:', geminiError);
    }

    // Fallback to educational image
    const fallbackUrl = getEducationalFallbackImage(prompt || 'Generated Banner');
    return NextResponse.json({ imageUrl: fallbackUrl });
    
  } catch (error) {
    console.error('Gemini image generation error:', error);
    
    // Return educational fallback image on any error
    const fallbackUrl = getEducationalFallbackImage('Generated Banner');
    return NextResponse.json({ imageUrl: fallbackUrl });
  }
}

