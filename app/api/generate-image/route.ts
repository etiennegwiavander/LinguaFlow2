import { NextRequest, NextResponse } from 'next/server';

// Comprehensive pre-generated educational images (imported from ai-image-generator.ts)
const PRE_GENERATED_IMAGES = {
  'conversation': [
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1792&h=1024&fit=crop&crop=center', // Speech bubbles
    'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=1792&h=1024&fit=crop&crop=center', // Communication icons
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1792&h=1024&fit=crop&crop=center', // Chat interface
    'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1792&h=1024&fit=crop&crop=center', // Discussion setup
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1792&h=1024&fit=crop&crop=center', // Communication concept
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1792&h=1024&fit=crop&crop=center', // Speaking concept
    'https://images.unsplash.com/photo-1573164713619-24c711fe7878?w=1792&h=1024&fit=crop&crop=center', // Conversation visual
    'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=1792&h=1024&fit=crop&crop=center', // Talk concept
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1792&h=1024&fit=crop&crop=center', // Dialog concept
    'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1792&h=1024&fit=crop&crop=center'  // Communication art
  ],
  'grammar': [
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1792&h=1024&fit=crop&crop=center', // Books and writing
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1792&h=1024&fit=crop&crop=center', // Grammar book
    'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=1792&h=1024&fit=crop&crop=center', // Study materials
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1792&h=1024&fit=crop&crop=center', // Educational setup
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1792&h=1024&fit=crop&crop=center', // Language learning
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1792&h=1024&fit=crop&crop=center', // Text and books
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1792&h=1024&fit=crop&crop=center', // Grammar focus
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1792&h=1024&fit=crop&crop=center', // Learning materials
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1792&h=1024&fit=crop&crop=center', // Educational books
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1792&h=1024&fit=crop&crop=center'  // Language study
  ],
  'vocabulary': [
    'https://images.unsplash.com/photo-1589998059171-988d887df646?w=1792&h=1024&fit=crop&crop=center', // Dictionary/word book
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1792&h=1024&fit=crop&crop=center', // Open books
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1792&h=1024&fit=crop&crop=center', // Language learning
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1792&h=1024&fit=crop&crop=center', // Study books
    'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=1792&h=1024&fit=crop&crop=center', // Educational materials
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1792&h=1024&fit=crop&crop=center', // Learning setup
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1792&h=1024&fit=crop&crop=center', // Word reference
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1792&h=1024&fit=crop&crop=center', // Text study
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1792&h=1024&fit=crop&crop=center', // Vocabulary focus
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1792&h=1024&fit=crop&crop=center'  // Word learning
  ],
  'pronunciation': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1792&h=1024&fit=crop&crop=center', // Audio equipment
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1792&h=1024&fit=crop&crop=center', // Sound waves
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1792&h=1024&fit=crop&crop=center', // Microphone
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1792&h=1024&fit=crop&crop=center', // Audio studio
    'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=1792&h=1024&fit=crop&crop=center', // Sound concept
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1792&h=1024&fit=crop&crop=center', // Listening device
    'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1792&h=1024&fit=crop&crop=center', // Recording equipment
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1792&h=1024&fit=crop&crop=center', // Audio learning
    'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=1792&h=1024&fit=crop&crop=center', // Speech practice
    'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=1792&h=1024&fit=crop&crop=center'  // Speaking concept
  ],
  'reading': [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1792&h=1024&fit=crop&crop=center', // Reading material
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1792&h=1024&fit=crop&crop=center', // Study books
    'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=1792&h=1024&fit=crop&crop=center', // Reading setup
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1792&h=1024&fit=crop&crop=center', // Educational reading
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1792&h=1024&fit=crop&crop=center', // Text focus
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1792&h=1024&fit=crop&crop=center', // Book study
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1792&h=1024&fit=crop&crop=center', // Reading practice
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1792&h=1024&fit=crop&crop=center', // Literature study
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1792&h=1024&fit=crop&crop=center', // Reading comprehension
    'https://images.unsplash.com/photo-1589998059171-988d887df646?w=1792&h=1024&fit=crop&crop=center'  // Open books
  ],
  'writing': [
    'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1792&h=1024&fit=crop&crop=center', // Pen and paper
    'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=1792&h=1024&fit=crop&crop=center', // Writing materials
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1792&h=1024&fit=crop&crop=center', // Educational writing
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1792&h=1024&fit=crop&crop=center', // Study writing
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1792&h=1024&fit=crop&crop=center', // Language writing
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1792&h=1024&fit=crop&crop=center', // Text creation
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1792&h=1024&fit=crop&crop=center', // Writing practice
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1792&h=1024&fit=crop&crop=center', // Composition
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1792&h=1024&fit=crop&crop=center', // Writing skills
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1792&h=1024&fit=crop&crop=center'  // Written expression
  ],
  'listening': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1792&h=1024&fit=crop&crop=center', // Headphones/audio equipment
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1792&h=1024&fit=crop&crop=center', // Sound waves
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1792&h=1024&fit=crop&crop=center', // Audio recording
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1792&h=1024&fit=crop&crop=center', // Audio studio
    'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=1792&h=1024&fit=crop&crop=center', // Audio learning
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1792&h=1024&fit=crop&crop=center', // Sound concept
    'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1792&h=1024&fit=crop&crop=center', // Microphone setup
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1792&h=1024&fit=crop&crop=center', // Audio education
    'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=1792&h=1024&fit=crop&crop=center', // Hearing practice
    'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=1792&h=1024&fit=crop&crop=center'  // Listening practice
  ],
  'culture': [
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1792&h=1024&fit=crop&crop=center', // World map/globe
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1792&h=1024&fit=crop&crop=center', // Cultural diversity
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1792&h=1024&fit=crop&crop=center', // Global connection
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1792&h=1024&fit=crop&crop=center', // World view
    'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=1792&h=1024&fit=crop&crop=center', // Cultural symbols
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1792&h=1024&fit=crop&crop=center', // International
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1792&h=1024&fit=crop&crop=center', // Geography
    'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1792&h=1024&fit=crop&crop=center', // Global learning
    'https://images.unsplash.com/photo-1484807352052-23338990c6c6?w=1792&h=1024&fit=crop&crop=center', // Cross-cultural
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1792&h=1024&fit=crop&crop=center'  // Cultural exchange
  ],
  'business': [
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1792&h=1024&fit=crop&crop=center', // Professional setting
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1792&h=1024&fit=crop&crop=center', // Business meeting
    'https://images.unsplash.com/photo-1486312338219-ce68e2c6b696?w=1792&h=1024&fit=crop&crop=center', // Office environment
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1792&h=1024&fit=crop&crop=center', // Corporate setting
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1792&h=1024&fit=crop&crop=center', // Business communication
    'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1792&h=1024&fit=crop&crop=center', // Professional development
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1792&h=1024&fit=crop&crop=center', // Business education
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1792&h=1024&fit=crop&crop=center', // Workplace learning
    'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=1792&h=1024&fit=crop&crop=center', // Corporate training
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1792&h=1024&fit=crop&crop=center'  // Business skills
  ],
  'travel': [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1792&h=1024&fit=crop&crop=center', // Travel concept
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1792&h=1024&fit=crop&crop=center', // Journey planning
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1792&h=1024&fit=crop&crop=center', // Exploration
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1792&h=1024&fit=crop&crop=center', // World travel
    'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=1792&h=1024&fit=crop&crop=center', // Adventure
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1792&h=1024&fit=crop&crop=center', // Travel learning
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1792&h=1024&fit=crop&crop=center', // Cultural travel
    'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1792&h=1024&fit=crop&crop=center', // Global exploration
    'https://images.unsplash.com/photo-1484807352052-23338990c6c6?w=1792&h=1024&fit=crop&crop=center', // International travel
    'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1792&h=1024&fit=crop&crop=center'  // Travel education
  ]
};

function getEducationalFallbackImage(prompt: string): string {
  // Use prompt to intelligently select appropriate category and image
  const lowerPrompt = prompt.toLowerCase();
  
  // Check for specific keywords in the prompt to determine the best category
  let category = 'grammar'; // Default fallback
  
  // Conversation/Speaking
  if (lowerPrompt.includes('conversation') || lowerPrompt.includes('speak') || lowerPrompt.includes('talk') || 
      lowerPrompt.includes('dialogue') || lowerPrompt.includes('chat') || lowerPrompt.includes('discussion')) {
    category = 'conversation';
  }
  // Vocabulary
  else if (lowerPrompt.includes('vocabulary') || lowerPrompt.includes('word') || lowerPrompt.includes('dictionary') ||
           lowerPrompt.includes('expression') || lowerPrompt.includes('phrase')) {
    category = 'vocabulary';
  }
  // Grammar
  else if (lowerPrompt.includes('grammar') || lowerPrompt.includes('tense') || lowerPrompt.includes('verb') ||
           lowerPrompt.includes('sentence') || lowerPrompt.includes('structure')) {
    category = 'grammar';
  }
  // Pronunciation/Listening
  else if (lowerPrompt.includes('pronunciation') || lowerPrompt.includes('sound') || lowerPrompt.includes('audio') ||
           lowerPrompt.includes('listen') || lowerPrompt.includes('hear')) {
    category = 'pronunciation';
  }
  // Reading
  else if (lowerPrompt.includes('reading') || lowerPrompt.includes('text') || lowerPrompt.includes('comprehension') ||
           lowerPrompt.includes('article') || lowerPrompt.includes('story')) {
    category = 'reading';
  }
  // Writing
  else if (lowerPrompt.includes('writing') || lowerPrompt.includes('essay') || lowerPrompt.includes('composition') ||
           lowerPrompt.includes('letter') || lowerPrompt.includes('email')) {
    category = 'writing';
  }
  // Culture
  else if (lowerPrompt.includes('culture') || lowerPrompt.includes('tradition') || lowerPrompt.includes('country') ||
           lowerPrompt.includes('custom') || lowerPrompt.includes('history')) {
    category = 'culture';
  }
  // Business
  else if (lowerPrompt.includes('business') || lowerPrompt.includes('professional') || lowerPrompt.includes('office') ||
           lowerPrompt.includes('meeting') || lowerPrompt.includes('work')) {
    category = 'business';
  }
  // Travel
  else if (lowerPrompt.includes('travel') || lowerPrompt.includes('trip') || lowerPrompt.includes('vacation') ||
           lowerPrompt.includes('airport') || lowerPrompt.includes('hotel')) {
    category = 'travel';
  }
  // General language learning patterns
  else if (lowerPrompt.includes('language') || lowerPrompt.includes('learn') || lowerPrompt.includes('study') ||
           lowerPrompt.includes('education') || lowerPrompt.includes('lesson')) {
    // Use a mix of categories for general language learning
    const generalCategories = ['conversation', 'grammar', 'vocabulary', 'reading'];
    const hash = prompt.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    category = generalCategories[hash % generalCategories.length];
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
      const fallbackUrl = getEducationalFallbackImage(prompt || 'AI Generated Banner');
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
      const fallbackUrl = getEducationalFallbackImage(prompt || 'AI Generated Banner');
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
    const fallbackUrl = getEducationalFallbackImage('AI Generated Banner');
    return NextResponse.json({ imageUrl: fallbackUrl });
  }
}