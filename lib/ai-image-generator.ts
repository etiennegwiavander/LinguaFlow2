/**
 * AI Image Generation utilities for lesson banner images
 */

import { useState, useEffect } from 'react';

interface ImageGenerationOptions {
  title: string;
  subject?: string;
  level?: string;
  style?: 'educational' | 'modern' | 'colorful' | 'professional';
  aspectRatio?: '16:9' | '4:3' | '1:1';
}

interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
}

/**
 * Transform lesson title into an optimized image generation prompt
 */
export function createImagePrompt(options: ImageGenerationOptions): string {
  const { title, subject, level = 'intermediate', style = 'educational' } = options;
  
  // Extract key concepts from the title
  const cleanTitle = title.replace(/[^\w\s]/g, '').toLowerCase();
  
  // Style-specific prompt modifiers
  const styleModifiers = {
    educational: 'clean, educational illustration, bright colors, friendly and approachable',
    modern: 'modern flat design, minimalist, contemporary colors, sleek',
    colorful: 'vibrant colors, engaging, dynamic, cheerful',
    professional: 'professional, clean design, sophisticated color palette'
  };
  
  // Language learning specific elements
  const languageLearningElements = [
    'language learning',
    'education',
    'communication',
    'cultural exchange',
    'books and speech bubbles',
    'diverse people learning'
  ];
  
  // Build the prompt
  let prompt = `Create a ${styleModifiers[style]} banner image for a language lesson titled "${title}". `;
  
  // Add subject-specific context if available
  if (subject) {
    prompt += `The lesson focuses on ${subject} language learning. `;
  }
  
  // Add level-appropriate complexity
  const levelDescriptions = {
    beginner: 'simple, clear, basic concepts',
    intermediate: 'moderate complexity, practical scenarios',
    advanced: 'sophisticated, complex scenarios, professional contexts'
  };
  
  prompt += `Design should be ${levelDescriptions[level as keyof typeof levelDescriptions] || levelDescriptions.intermediate}. `;
  
  // Add visual elements
  prompt += `Include elements like ${languageLearningElements.slice(0, 3).join(', ')}. `;
  
  // Technical specifications
  prompt += 'High quality, 16:9 aspect ratio, suitable for web display, no text overlay, ';
  prompt += 'professional educational content, appropriate for all ages, ';
  prompt += 'bright lighting, clear composition, digital art style.';
  
  return prompt;
}

/**
 * Generate image using OpenAI DALL-E API
 */
export async function generateImageWithDALLE(prompt: string): Promise<string> {
  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        size: '1792x1024', // 16:9 aspect ratio
        quality: 'standard',
        style: 'natural'
      }),
    });

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('DALL-E image generation error:', error);
    throw error;
  }
}

/**
 * Generate image using Gemini API (alternative)
 */
export async function generateImageWithGemini(prompt: string): Promise<string> {
  try {
    // Note: Gemini doesn't directly generate images, but we can use it to enhance prompts
    // and then use another service. For now, we'll use a placeholder approach.
    
    const response = await fetch('/api/generate-image-gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        aspectRatio: '16:9'
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini image generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('Gemini image generation error:', error);
    throw error;
  }
}

/**
 * Generate a fallback image using pre-generated educational images
 */
export function generateFallbackImage(title: string, width: number = 1792, height: number = 1024): string {
  // Use the same logic as generateEnhancedFallback to get a pre-generated image
  return generateEnhancedFallback(title);
}

/**
 * Pre-generated educational images for common lesson types
 */
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

/**
 * Get instant image based on lesson content analysis
 */
function getInstantImage(title: string): string | null {
  const lowerTitle = title.toLowerCase();
  
  // Check for keywords in title
  for (const [category, imageArray] of Object.entries(PRE_GENERATED_IMAGES)) {
    if (lowerTitle.includes(category)) {
      // Use title hash to select a consistent but varied image from the array
      const hash = title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const imageIndex = hash % imageArray.length;
      return imageArray[imageIndex];
    }
  }
  
  // Check for common language learning patterns
  if (lowerTitle.includes('speak') || lowerTitle.includes('talk') || lowerTitle.includes('conversation')) {
    const hash = title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const imageIndex = hash % PRE_GENERATED_IMAGES.conversation.length;
    return PRE_GENERATED_IMAGES.conversation[imageIndex];
  }
  if (lowerTitle.includes('word') || lowerTitle.includes('vocabulary')) {
    const hash = title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const imageIndex = hash % PRE_GENERATED_IMAGES.vocabulary.length;
    return PRE_GENERATED_IMAGES.vocabulary[imageIndex];
  }
  if (lowerTitle.includes('read') || lowerTitle.includes('text')) {
    const hash = title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const imageIndex = hash % PRE_GENERATED_IMAGES.reading.length;
    return PRE_GENERATED_IMAGES.reading[imageIndex];
  }
  
  return null;
}

/**
 * Fast lesson banner generation with immediate fallback
 */
export async function generateLessonBannerFast(options: ImageGenerationOptions): Promise<GeneratedImage> {
  const prompt = createImagePrompt(options);
  
  // 1. Try instant image first (immediate response)
  const instantImage = getInstantImage(options.title);
  if (instantImage) {
    // Start background AI generation for future use (don't await)
    generateBackgroundImage(options).catch(console.warn);
    
    return {
      url: instantImage,
      prompt,
      timestamp: Date.now()
    };
  }
  
  // 2. Use beautiful fallback immediately, generate AI in background
  const fallbackUrl = generateEnhancedFallback(options.title);
  
  // Start background AI generation (don't await)
  generateBackgroundImage(options).catch(console.warn);
  
  return {
    url: fallbackUrl,
    prompt,
    timestamp: Date.now()
  };
}

/**
 * Background AI image generation (non-blocking)
 */
async function generateBackgroundImage(options: ImageGenerationOptions): Promise<void> {
  try {
    const prompt = createImagePrompt(options);
    const cacheKey = `${options.title}-${options.subject}-${options.level}-${options.style}`;
    
    // Check if we already have this in cache
    const cached = imageCache.get(cacheKey);
    if (cached) return;
    
    let imageUrl: string;
    
    try {
      // Try DALL-E first
      imageUrl = await generateImageWithDALLE(prompt);
    } catch (dalleError) {
      try {
        // Try Gemini as fallback
        imageUrl = await generateImageWithGemini(prompt);
      } catch (geminiError) {
        // Skip background generation if both fail
        return;
      }
    }
    
    // Cache the generated image for future use
    const generatedImage: GeneratedImage = {
      url: imageUrl,
      prompt,
      timestamp: Date.now()
    };
    
    imageCache.set(cacheKey, generatedImage);
    
    // Also store in localStorage for persistence
    try {
      const storageKey = `lesson-banner-${cacheKey}`;
      localStorage.setItem(storageKey, JSON.stringify(generatedImage));
    } catch (storageError) {
      console.warn('Failed to store image in localStorage:', storageError);
    }
  } catch (error) {
    console.warn('Background image generation failed:', error);
  }
}

/**
 * Enhanced fallback using pre-generated educational images
 */
function generateEnhancedFallback(title: string): string {
  // First try to get a contextually relevant pre-generated image
  const contextualImage = getInstantImage(title);
  if (contextualImage) {
    return contextualImage;
  }
  
  // If no contextual match, use a general educational image based on title hash
  const allCategories = Object.keys(PRE_GENERATED_IMAGES);
  const hash = title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const categoryIndex = hash % allCategories.length;
  const selectedCategory = allCategories[categoryIndex];
  const imageArray = PRE_GENERATED_IMAGES[selectedCategory as keyof typeof PRE_GENERATED_IMAGES];
  const imageIndex = (hash * 7) % imageArray.length; // Use different multiplier for image selection
  
  return imageArray[imageIndex];
}

/**
 * Main function to generate lesson banner image (kept for backward compatibility)
 */
export async function generateLessonBanner(options: ImageGenerationOptions): Promise<GeneratedImage> {
  // Use the fast version by default
  return generateLessonBannerFast(options);
}

/**
 * Enhanced cache management with localStorage persistence
 */
class ImageCache {
  private cache = new Map<string, GeneratedImage>();
  private readonly maxAge = 24 * 60 * 60 * 1000; // 24 hours
  private readonly storagePrefix = 'lesson-banner-';

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Load cached images from localStorage on initialization
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.storagePrefix)) {
          const cacheKey = key.replace(this.storagePrefix, '');
          const stored = localStorage.getItem(key);
          if (stored) {
            const image: GeneratedImage = JSON.parse(stored);
            // Only load if not expired
            if (Date.now() - image.timestamp < this.maxAge) {
              this.cache.set(cacheKey, image);
            } else {
              localStorage.removeItem(key);
            }
          }
        }
      }
      // Debug logging removed to prevent infinite loop
    } catch (error) {
      console.warn('Failed to load images from localStorage:', error);
    }
  }

  set(key: string, image: GeneratedImage): void {
    this.cache.set(key, image);
    
    // Also store in localStorage
    if (typeof window !== 'undefined') {
      try {
        const storageKey = this.storagePrefix + key;
        localStorage.setItem(storageKey, JSON.stringify(image));
      } catch (error) {
        console.warn('Failed to store image in localStorage:', error);
      }
    }
  }

  get(key: string): GeneratedImage | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      // Also remove from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.storagePrefix + key);
      }
      return null;
    }

    return cached;
  }

  clear(): void {
    this.cache.clear();
    
    // Also clear from localStorage
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(this.storagePrefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.warn('Failed to clear images from localStorage:', error);
      }
    }
  }

  private generateKey(options: ImageGenerationOptions): string {
    return `${options.title}-${options.subject}-${options.level}-${options.style}`;
  }

  async getOrGenerateFast(options: ImageGenerationOptions): Promise<GeneratedImage> {
    const key = this.generateKey(options);
    
    // 1. Check cache first (instant)
    const cached = this.get(key);
    if (cached) {
      return cached;
    }

    // 2. Use fast generation (instant fallback + background AI)
    const generated = await generateLessonBannerFast(options);
    this.set(key, generated);
    
    return generated;
  }

  async getOrGenerate(options: ImageGenerationOptions): Promise<GeneratedImage> {
    // Use the fast version by default
    return this.getOrGenerateFast(options);
  }
}

export const imageCache = new ImageCache();

/**
 * Clear any cached gradient placeholder images to ensure fresh educational images
 */
export function clearGradientCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear localStorage items that might contain gradient placeholders
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('lesson-banner-')) {
        const stored = localStorage.getItem(key);
        if (stored && (stored.includes('via.placeholder.com') || stored.includes('21c5f0') || stored.includes('e879f9'))) {
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('🧹 Cleared gradient cache:', key);
    });
    
    // Also clear the in-memory cache
    imageCache.clear();
    
    console.log('✅ Gradient cache cleared, fresh educational images will be used');
  } catch (error) {
    console.warn('Failed to clear gradient cache:', error);
  }
}

/**
 * Preload common lesson types for instant access
 */
export async function preloadCommonLessonImages(): Promise<void> {
  const commonLessonTypes = [
    { title: 'French Conversation Basics', subject: 'french', level: 'beginner' },
    { title: 'Spanish Grammar Fundamentals', subject: 'spanish', level: 'intermediate' },
    { title: 'English Vocabulary Building', subject: 'english', level: 'beginner' },
    { title: 'German Pronunciation Practice', subject: 'german', level: 'intermediate' },
    { title: 'Italian Cultural Context', subject: 'italian', level: 'advanced' },
    { title: 'Japanese Writing Systems', subject: 'japanese', level: 'beginner' },
    { title: 'Business English Communication', subject: 'english', level: 'advanced' },
    { title: 'Travel Spanish Essentials', subject: 'spanish', level: 'beginner' }
  ];

  console.log('🚀 Preloading common lesson images...');
  
  // Generate images in background (don't await to avoid blocking)
  commonLessonTypes.forEach(lessonType => {
    generateBackgroundImage({
      title: lessonType.title,
      subject: lessonType.subject,
      level: lessonType.level,
      style: 'educational'
    }).catch(console.warn);
  });
}

/**
 * Initialize the image system (call this on app startup)
 */
export function initializeImageSystem(): void {
  // Preload common images after a short delay to not block initial load
  setTimeout(() => {
    preloadCommonLessonImages();
  }, 2000);
}

/**
 * React hook for generating lesson banner images
 */
export function useLessonBanner(options: ImageGenerationOptions) {
  const [image, setImage] = useState<GeneratedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const generateImage = async () => {
      if (!options.title) return;

      setLoading(true);
      setError(null);

      try {
        const generatedImage = await imageCache.getOrGenerate(options);
        
        if (isMounted) {
          setImage(generatedImage);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to generate image');
          // Set fallback image on error using pre-generated educational images
          setImage({
            url: generateEnhancedFallback(options.title),
            prompt: createImagePrompt(options),
            timestamp: Date.now()
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    generateImage();

    return () => {
      isMounted = false;
    };
  }, [options.title, options.subject, options.level, options.style, options]);

  return { image, loading, error };
}