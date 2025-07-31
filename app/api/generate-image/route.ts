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

function getEducationalFallbackImage(prompt: string = 'AI Generated Banner'): string {
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
    const { prompt, size = '1792x1024', quality = 'standard', style = 'natural' } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Check if we have OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.warn('OpenAI API key not found, using educational fallback image');
      // Return a pre-generated educational image
      const fallbackUrl = getEducationalFallbackImage(prompt);
      return NextResponse.json({ imageUrl: fallbackUrl });
    }

    // Call OpenAI DALL-E API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        size: size,
        quality: quality,
        style: style,
        n: 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      
      // Return educational fallback image on API error
      const fallbackUrl = getEducationalFallbackImage(prompt);
      return NextResponse.json({ imageUrl: fallbackUrl });
    }

    const data = await response.json();
    const imageUrl = data.data[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Image generation error:', error);
    
    // Return educational fallback image on any error
    const fallbackUrl = getEducationalFallbackImage(prompt);
    return NextResponse.json({ imageUrl: fallbackUrl });
  }
}