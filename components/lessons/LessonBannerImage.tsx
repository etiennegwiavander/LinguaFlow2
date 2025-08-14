"use client";

import React, { useState, useEffect } from 'react';
import { useLessonBanner } from '@/lib/ai-image-generator';
import { Loader2, Image as ImageIcon, Sparkles, Zap } from 'lucide-react';

interface LessonBannerImageProps {
  title: string;
  subtitle?: string;
  subject?: string;
  level?: string;
  className?: string;
}

export default function LessonBannerImage({
  title,
  subtitle,
  subject,
  level = 'intermediate',
  className = ''
}: LessonBannerImageProps) {
  const { image, loading, error } = useLessonBanner({
    title,
    subject,
    level,
    style: 'educational',
    aspectRatio: '16:9'
  });

  const [imageLoaded, setImageLoaded] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Check if this is a fallback image that could be upgraded
  useEffect(() => {
    if (image && !loading) {
      // Only treat SVG data URLs and placeholder.com as fallback images
      // Unsplash images from ai-image-generator.ts are high-quality curated images, not fallbacks
      const isFallback = image.url.startsWith('data:image/svg') ||
        image.url.includes('via.placeholder.com');

      if (isFallback) {
        // Show upgrade notification after 2 seconds
        const timer = setTimeout(() => {
          setShowUpgrade(true);
          // Hide after 3 seconds
          setTimeout(() => setShowUpgrade(false), 3000);
        }, 2000);

        return () => clearTimeout(timer);
      }
    }
  }, [image, loading]);

  return (
    <div className={`relative w-full h-64 md:h-80 lg:h-96 rounded-xl overflow-hidden shadow-lg ${className}`}>
      {/* Loading State - Minimal since images load instantly */}
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-blue-700">Loading...</p>
          </div>
        </div>
      )}

      {/* Error State - Show educational image instead of error */}
      {error && !loading && (
        <>
          <img
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1792&h=1024&fit=crop&crop=center"
            alt={`Banner for ${title}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
            <div className="p-6 md:p-8 text-white w-full">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 drop-shadow-lg">
                {title}
              </h1>
              {subtitle && (
                <p className="text-lg md:text-xl opacity-90 drop-shadow-md">
                  {subtitle}
                </p>
              )}

              {/* Educational Image Badge */}
              <div className="mt-3 inline-flex items-center px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs">
                <ImageIcon className="w-3 h-3 mr-1" />
                Educational Image
              </div>
            </div>
          </div>
        </>
      )}

      {/* Generated Image */}
      {image && !loading && (
        <>
          <img
            src={image.url}
            alt={`Banner for ${title}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to educational image if current image fails to load
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1792&h=1024&fit=crop&crop=center';
            }}
          />

          {/* Overlay with title and subtitle */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
            <div className="p-6 md:p-8 text-white w-full">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 drop-shadow-lg">
                {title}
              </h1>
              {subtitle && (
                <p className="text-lg md:text-xl opacity-90 drop-shadow-md">
                  {subtitle}
                </p>
              )}

              {/* AI Generated Badge */}
              <div className="mt-3 inline-flex items-center px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                {image.url.startsWith('data:image/svg') ? 'Instant Load' :
                  image.url.includes('unsplash.com') ? 'Curated Image' : 'AI Generated'}
              </div>
            </div>
          </div>

          {/* Speed Indicator */}
          <div className="absolute top-4 right-4">
            <div className="inline-flex items-center px-2 py-1 bg-green-500/80 backdrop-blur-sm rounded-full text-xs text-white">
              <Zap className="w-3 h-3 mr-1" />
              Fast Load
            </div>
          </div>

          {/* Upgrade Notification */}
          {showUpgrade && (
            <div className="absolute top-4 left-4 animate-fade-in">
              <div className="inline-flex items-center px-3 py-2 bg-blue-500/90 backdrop-blur-sm rounded-lg text-xs text-white shadow-lg">
                <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
                AI upgrade in progress...
              </div>
            </div>
          )}
        </>
      )}

      {/* Educational Image Fallback (when no image is available) */}
      {!image && !loading && !error && (
        <>
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1792&h=1024&fit=crop&crop=center"
            alt={`Banner for ${title}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
            <div className="p-6 md:p-8 text-white w-full">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 drop-shadow-lg">
                {title}
              </h1>
              {subtitle && (
                <p className="text-lg md:text-xl opacity-90 drop-shadow-md">
                  {subtitle}
                </p>
              )}

              {/* Educational Image Badge */}
              <div className="mt-3 inline-flex items-center px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Educational Image
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}