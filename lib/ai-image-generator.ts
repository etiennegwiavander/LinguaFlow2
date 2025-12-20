"use client";

/**
 * AI Image Generation utilities for lesson banner images (Client Component)
 */

import { useState, useEffect } from "react";
import { getInstantImage, generateEnhancedFallback } from "./ai-image-utils";

interface ImageGenerationOptions {
  title: string;
  subject?: string;
  level?: string;
  style?: "educational" | "modern" | "colorful" | "professional";
  aspectRatio?: "16:9" | "4:3" | "1:1";
}

interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
}

// Re-export for backward compatibility
export { getInstantImage, generateEnhancedFallback };

/**
 * Transform lesson title into an optimized image generation prompt
 */
export function createImagePrompt(options: ImageGenerationOptions): string {
  const {
    title,
    subject,
    level = "intermediate",
    style = "educational",
  } = options;

  // Extract key concepts from the title
  const cleanTitle = title.replace(/[^\w\s]/g, "").toLowerCase();

  // Style-specific prompt modifiers
  const styleModifiers = {
    educational:
      "clean, educational illustration, bright colors, friendly and approachable",
    modern: "modern flat design, minimalist, contemporary colors, sleek",
    colorful: "vibrant colors, engaging, dynamic, cheerful",
    professional: "professional, clean design, sophisticated color palette",
  };

  // Language learning specific elements
  const languageLearningElements = [
    "language learning",
    "education",
    "communication",
    "cultural exchange",
    "books and speech bubbles",
    "diverse people learning",
  ];

  // Build the prompt
  let prompt = `Create a ${styleModifiers[style]} banner image for a language lesson titled "${title}". `;

  // Add subject-specific context if available
  if (subject) {
    prompt += `The lesson focuses on ${subject} language learning. `;
  }

  // Add level-appropriate complexity
  const levelDescriptions = {
    beginner: "simple, clear, basic concepts",
    intermediate: "moderate complexity, practical scenarios",
    advanced: "sophisticated, complex scenarios, professional contexts",
  };

  prompt += `Design should be ${
    levelDescriptions[level as keyof typeof levelDescriptions] ||
    levelDescriptions.intermediate
  }. `;

  // Add visual elements
  prompt += `Include elements like ${languageLearningElements
    .slice(0, 3)
    .join(", ")}. `;

  // Technical specifications
  prompt +=
    "High quality, 16:9 aspect ratio, suitable for web display, no text overlay, ";
  prompt += "professional educational content, appropriate for all ages, ";
  prompt += "bright lighting, clear composition, digital art style.";

  return prompt;
}

/**
 * Generate image using OpenAI DALL-E API
 */
export async function generateImageWithDALLE(prompt: string): Promise<string> {
  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        size: "1792x1024", // 16:9 aspect ratio
        quality: "standard",
        style: "natural",
      }),
    });

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("DALL-E image generation error:", error);
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

    const response = await fetch("/api/generate-image-gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        aspectRatio: "16:9",
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini image generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Gemini image generation error:", error);
    throw error;
  }
}

/**
 * Generate a fallback image using pre-generated educational images
 */
export function generateFallbackImage(
  title: string,
  width: number = 1792,
  height: number = 1024
): string {
  // Use the same logic as generateEnhancedFallback to get a pre-generated image
  return generateEnhancedFallback(title);
}

/**
 * Fast lesson banner generation with immediate fallback
 */
export async function generateLessonBannerFast(
  options: ImageGenerationOptions
): Promise<GeneratedImage> {
  const prompt = createImagePrompt(options);

  // 1. Try instant image first (immediate response)
  const instantImage = getInstantImage(options.title);
  if (instantImage) {
    // Start background AI generation for future use (don't await)
    generateBackgroundImage(options).catch(console.warn);

    return {
      url: instantImage,
      prompt,
      timestamp: Date.now(),
    };
  }

  // 2. Use beautiful fallback immediately, generate AI in background
  const fallbackUrl = generateEnhancedFallback(options.title);

  // Start background AI generation (don't await)
  generateBackgroundImage(options).catch(console.warn);

  return {
    url: fallbackUrl,
    prompt,
    timestamp: Date.now(),
  };
}

// Track ongoing background generation to prevent duplicates
const backgroundGenerationInProgress = new Set<string>();

/**
 * Background AI image generation (non-blocking)
 */
async function generateBackgroundImage(
  options: ImageGenerationOptions
): Promise<void> {
  try {
    const prompt = createImagePrompt(options);
    const cacheKey = `${options.title}-${options.subject}-${options.level}-${options.style}`;

    // Check if we already have this in cache
    const cached = imageCache.get(cacheKey);
    if (cached) return;

    // Prevent multiple simultaneous background generation for the same key
    if (backgroundGenerationInProgress.has(cacheKey)) {
      return;
    }

    backgroundGenerationInProgress.add(cacheKey);

    try {
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
        timestamp: Date.now(),
      };

      imageCache.set(cacheKey, generatedImage);

      // Also store in localStorage for persistence
      try {
        const storageKey = `lesson-banner-${cacheKey}`;
        localStorage.setItem(storageKey, JSON.stringify(generatedImage));
      } catch (storageError) {
        console.warn("Failed to store image in localStorage:", storageError);
      }
    } finally {
      // Always remove from in-progress set
      backgroundGenerationInProgress.delete(cacheKey);
    }
  } catch (error) {
    console.warn("Background image generation failed:", error);
  }
}

/**
 * Main function to generate lesson banner image (kept for backward compatibility)
 */
export async function generateLessonBanner(
  options: ImageGenerationOptions
): Promise<GeneratedImage> {
  // Use the fast version by default
  return generateLessonBannerFast(options);
}

/**
 * Enhanced cache management with localStorage persistence
 */
class ImageCache {
  private cache = new Map<string, GeneratedImage>();
  private readonly maxAge = 24 * 60 * 60 * 1000; // 24 hours
  private readonly storagePrefix = "lesson-banner-";

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    if (typeof window === "undefined") return;

    try {
      // Load cached images from localStorage on initialization
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.storagePrefix)) {
          const cacheKey = key.replace(this.storagePrefix, "");
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
      console.warn("Failed to load images from localStorage:", error);
    }
  }

  set(key: string, image: GeneratedImage): void {
    this.cache.set(key, image);

    // Also store in localStorage
    if (typeof window !== "undefined") {
      try {
        const storageKey = this.storagePrefix + key;
        localStorage.setItem(storageKey, JSON.stringify(image));
      } catch (error) {
        console.warn("Failed to store image in localStorage:", error);
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
      if (typeof window !== "undefined") {
        localStorage.removeItem(this.storagePrefix + key);
      }
      return null;
    }

    return cached;
  }

  clear(): void {
    this.cache.clear();

    // Also clear from localStorage
    if (typeof window !== "undefined") {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(this.storagePrefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      } catch (error) {
        console.warn("Failed to clear images from localStorage:", error);
      }
    }
  }

  private generateKey(options: ImageGenerationOptions): string {
    return `${options.title}-${options.subject}-${options.level}-${options.style}`;
  }

  async getOrGenerateFast(
    options: ImageGenerationOptions
  ): Promise<GeneratedImage> {
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

  async getOrGenerate(
    options: ImageGenerationOptions
  ): Promise<GeneratedImage> {
    // Use the fast version by default
    return this.getOrGenerateFast(options);
  }
}

export const imageCache = new ImageCache();

/**
 * Clear any cached gradient placeholder images to ensure fresh educational images
 */
export function clearGradientCache(): void {
  if (typeof window === "undefined") return;

  try {
    // Clear localStorage items that might contain gradient placeholders
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("lesson-banner-")) {
        const stored = localStorage.getItem(key);
        if (
          stored &&
          (stored.includes("via.placeholder.com") ||
            stored.includes("21c5f0") ||
            stored.includes("e879f9"))
        ) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      console.log("🧹 Cleared gradient cache:", key);
    });

    // Also clear the in-memory cache
    imageCache.clear();

    console.log(
      "✅ Gradient cache cleared, fresh educational images will be used"
    );
  } catch (error) {
    console.warn("Failed to clear gradient cache:", error);
  }
}

/**
 * Preload common lesson types for instant access
 */
export async function preloadCommonLessonImages(): Promise<void> {
  const commonLessonTypes = [
    {
      title: "French Conversation Basics",
      subject: "french",
      level: "beginner",
    },
    {
      title: "Spanish Grammar Fundamentals",
      subject: "spanish",
      level: "intermediate",
    },
    {
      title: "English Vocabulary Building",
      subject: "english",
      level: "beginner",
    },
    {
      title: "German Pronunciation Practice",
      subject: "german",
      level: "intermediate",
    },
    {
      title: "Italian Cultural Context",
      subject: "italian",
      level: "advanced",
    },
    {
      title: "Japanese Writing Systems",
      subject: "japanese",
      level: "beginner",
    },
    {
      title: "Business English Communication",
      subject: "english",
      level: "advanced",
    },
    {
      title: "Travel Spanish Essentials",
      subject: "spanish",
      level: "beginner",
    },
  ];

  console.log("🚀 Preloading common lesson images...");

  // Generate images in background (don't await to avoid blocking)
  commonLessonTypes.forEach((lessonType) => {
    generateBackgroundImage({
      title: lessonType.title,
      subject: lessonType.subject,
      level: lessonType.level,
      style: "educational",
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

      // First, try to get an instant image from our curated collection
      const instantImage = getInstantImage(options.title);
      if (instantImage && isMounted) {
        // Return the curated image immediately without loading state
        setImage({
          url: instantImage,
          prompt: createImagePrompt(options),
          timestamp: Date.now(),
        });
        setLoading(false);
        setError(null);
        return;
      }

      // If no instant image, use enhanced fallback immediately
      const fallbackUrl = generateEnhancedFallback(options.title);
      if (isMounted) {
        setImage({
          url: fallbackUrl,
          prompt: createImagePrompt(options),
          timestamp: Date.now(),
        });
        setLoading(false);
        setError(null);
      }

      // NO background AI generation - we want to use only curated images
      // This prevents the infinite loop of API calls that was causing the issue
    };

    generateImage();

    return () => {
      isMounted = false;
    };
  }, [options.title, options.subject, options.level, options.style]);

  return { image, loading, error };
}
