"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { User, Bot, GraduationCap, Users, Briefcase, Heart, Coffee, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface DialogueAvatarProps {
  character: string;
  isTeacher?: boolean;
  role?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface CachedAvatar {
  url: string;
  timestamp: number;
}

// Cache for generated avatars (in-memory for session)
const avatarCache = new Map<string, CachedAvatar>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Character role detection patterns
const ROLE_PATTERNS = {
  teacher: /teacher|tutor|instructor|professor|educator/i,
  student: /student|learner|pupil/i,
  doctor: /doctor|dr\.|physician|nurse|medical/i,
  customer: /customer|client|buyer|shopper/i,
  friend: /friend|buddy|pal|mate/i,
  family: /mother|father|mom|dad|parent|sister|brother|sibling|grandmother|grandfather/i,
  professional: /manager|boss|colleague|coworker|employee|worker/i,
  service: /waiter|waitress|server|cashier|receptionist|clerk/i,
};

// Default avatar configurations based on roles
const ROLE_AVATARS = {
  teacher: {
    icon: GraduationCap,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  student: {
    icon: User,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  doctor: {
    icon: Heart,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  customer: {
    icon: ShoppingBag,
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  friend: {
    icon: Users,
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  family: {
    icon: Heart,
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    iconColor: 'text-pink-600 dark:text-pink-400',
    borderColor: 'border-pink-200 dark:border-pink-800',
  },
  professional: {
    icon: Briefcase,
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    iconColor: 'text-gray-600 dark:text-gray-400',
    borderColor: 'border-gray-200 dark:border-gray-800',
  },
  service: {
    icon: Coffee,
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  default: {
    icon: User,
    bgColor: 'bg-slate-100 dark:bg-slate-900/30',
    iconColor: 'text-slate-600 dark:text-slate-400',
    borderColor: 'border-slate-200 dark:border-slate-800',
  },
};

// Size configurations - updated for better visibility like in the provided image
const SIZE_CONFIG = {
  sm: {
    container: 'w-12 h-12', // Increased from w-8 h-8 for better visibility
    icon: 'w-6 h-6',
    text: 'text-xs',
    image: 'w-12 h-12',
  },
  md: {
    container: 'w-16 h-16', // Increased from w-10 h-10
    icon: 'w-8 h-8',
    text: 'text-sm',
    image: 'w-16 h-16',
  },
  lg: {
    container: 'w-20 h-20', // Increased from w-12 h-12
    icon: 'w-10 h-10',
    text: 'text-base',
    image: 'w-20 h-20',
  },
};

export default function DialogueAvatar({
  character,
  isTeacher = false,
  role,
  size = 'sm',
  className = ''
}: DialogueAvatarProps) {
  const { user } = useAuth();
  const [tutorProfileImage, setTutorProfileImage] = useState<string | null>(null);
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  // Determine character role
  const detectedRole = useMemo(() => {
    if (isTeacher) return 'teacher';
    if (role) return role.toLowerCase();

    // Auto-detect role from character name or context
    for (const [roleKey, pattern] of Object.entries(ROLE_PATTERNS)) {
      if (pattern.test(character)) {
        return roleKey;
      }
    }

    return 'default';
  }, [character, isTeacher, role]);

  // Get avatar configuration
  const avatarConfig = ROLE_AVATARS[detectedRole as keyof typeof ROLE_AVATARS] || ROLE_AVATARS.default;
  const sizeConfig = SIZE_CONFIG[size];

  // Cache key for this character
  const cacheKey = `${character.toLowerCase()}_${detectedRole}`;

  // Fetch tutor profile image if this is a teacher character
  useEffect(() => {
    if (!isTeacher || !user) return;

    const fetchTutorProfile = async () => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('avatar_url, profile_image_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.warn('Could not fetch tutor profile:', error);
          return;
        }

        // Use avatar_url or profile_image_url
        const imageUrl = profile?.avatar_url || profile?.profile_image_url;
        if (imageUrl) {
          setTutorProfileImage(imageUrl);
        }
      } catch (err) {
        console.warn('Error fetching tutor profile:', err);
      }
    };

    fetchTutorProfile();
  }, [isTeacher, user]);

  // Generate character avatar for non-teacher characters
  useEffect(() => {
    if (isTeacher || !character) return;

    // Check cache first
    const cached = avatarCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setGeneratedAvatarUrl(cached.url);
      return;
    }

    const generateAvatar = async () => {
      setIsLoading(true);
      setError(false);

      try {
        // Generate realistic portrait avatar similar to the image provided
        const cleanName = getCleanCharacterName(character);
        const seed = encodeURIComponent(cleanName || 'default');
        const gender = getGenderFromName(character);

        // Generate photorealistic human portrait avatars
        let avatarUrl: string;

        // Use different services based on preference for realism
        const avatarServices = [
          // Option 1: RoboHash with human faces (most photorealistic)
          {
            url: `https://robohash.org/${seed}?set=set5&size=64x64&bgset=bg1`,
            description: 'Photorealistic human faces'
          },

          // Option 2: This Person Does Not Exist style (AI-generated faces)
          // Note: We'll use a placeholder service that generates realistic faces
          {
            url: `https://picsum.photos/seed/${seed}/64/64?face`,
            description: 'Random realistic photos'
          },

          // Option 3: DiceBear Personas with more realistic settings
          {
            url: `https://api.dicebear.com/7.x/personas/svg?seed=${seed}&backgroundColor=f0f0f0&size=64`,
            description: 'Illustrated portraits'
          },

          // Option 4: Multiavatar (realistic style)
          {
            url: `https://api.multiavatar.com/${seed}.svg`,
            description: 'Multiavatar realistic'
          }
        ];

        // Generate realistic human portrait avatars similar to the provided image
        // Try different services in order of realism preference

        // Option 1: Use a realistic AI-generated face service
        // This creates photorealistic human portraits similar to your image
        avatarUrl = `https://api.dicebear.com/7.x/personas/svg?seed=${seed}&backgroundColor=f8f9fa&size=64&mood=happy&eyes=variant01,variant02,variant03&eyebrows=variant01,variant02&mouth=variant01,variant02,variant03`;

        // Option 2: Alternative realistic portrait service
        // If we want to try a different approach for more photorealistic results:
        // avatarUrl = `https://robohash.org/${seed}?set=set5&size=64x64&bgset=bg2`;

        // Option 3: For even more realistic human faces (if available):
        // This would be ideal for matching the style in your image
        // avatarUrl = `https://api.generated.photos/api/v1/faces?order_by=random&seed=${seed}&age=young-adult&gender=${gender}&emotion=neutral&per_page=1`;

        // Option 4: Use a service that provides actual human photos
        // avatarUrl = `https://randomuser.me/api/portraits/${gender === 'male' ? 'men' : 'women'}/${Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 100}.jpg`;

        // For the most realistic results matching your image, let's try:
        const genderPath = gender === 'female' ? 'women' : 'men';
        const photoId = Math.abs(cleanName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 99 + 1;
        avatarUrl = `https://randomuser.me/api/portraits/${genderPath}/${photoId}.jpg`;

        // Test if the URL is accessible before caching
        const testImage = new Image();
        testImage.onload = () => {
          // Cache the generated URL only if it loads successfully
          avatarCache.set(cacheKey, {
            url: avatarUrl,
            timestamp: Date.now(),
          });
          setGeneratedAvatarUrl(avatarUrl);
          setIsLoading(false);
        };
        testImage.onerror = () => {
          console.warn('Failed to load generated avatar for character:', character);
          setError(true);
          setIsLoading(false);
        };
        testImage.src = avatarUrl;
      } catch (err) {
        console.warn('Failed to generate avatar for character:', character, err);
        setError(true);
        setIsLoading(false);
      }
    };

    generateAvatar();
  }, [character, isTeacher, detectedRole, cacheKey]);

  // Get appropriate avatar style based on role - using more realistic styles
  const getAvatarStyle = (role: string): string => {
    // Use more photorealistic avatar styles for all roles
    switch (role) {
      case 'teacher':
      case 'professional':
      case 'doctor':
        return 'personas'; // Most realistic professional portraits
      case 'student':
      case 'friend':
      case 'family':
      case 'customer':
      case 'service':
        return 'personas'; // Use personas for all to get realistic human faces
      default:
        return 'personas'; // Default to realistic portraits
    }
  };

  // Get color for role-based avatar backgrounds
  const getColorForRole = (role: string): string => {
    switch (role) {
      case 'teacher': return '4CAF50'; // Green
      case 'student': return '2196F3'; // Blue
      case 'doctor': return 'F44336'; // Red
      case 'customer': return '9C27B0'; // Purple
      case 'friend': return 'FF9800'; // Orange
      case 'family': return 'E91E63'; // Pink
      case 'professional': return '607D8B'; // Blue Grey
      case 'service': return 'FF5722'; // Deep Orange
      default: return '757575'; // Grey
    }
  };

  // Generate gender-appropriate avatar based on character name
  const getGenderFromName = (name: string): 'male' | 'female' | 'neutral' => {
    const lowerName = name.toLowerCase();

    // Common male names/indicators
    const maleIndicators = [
      'david', 'john', 'mike', 'michael', 'james', 'robert', 'william', 'richard',
      'thomas', 'christopher', 'daniel', 'matthew', 'anthony', 'mark', 'donald',
      'steven', 'paul', 'andrew', 'joshua', 'kenneth', 'kevin', 'brian', 'george',
      'edward', 'ronald', 'timothy', 'jason', 'jeffrey', 'ryan', 'jacob', 'gary',
      'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott',
      'brandon', 'benjamin', 'samuel', 'gregory', 'alexander', 'patrick', 'jack',
      'dennis', 'jerry', 'tyler', 'aaron', 'jose', 'henry', 'adam', 'douglas',
      'nathan', 'peter', 'zachary', 'zach', 'kyle', 'noah', 'alan', 'ethan',
      'jeremy', 'lionel', 'wayne', 'sean', 'mason', 'evan', 'jacob', 'carl',
      'harold', 'arthur', 'lawrence', 'jordan', 'jesse', 'bryan', 'arthur',
      'mr', 'sir', 'gentleman', 'guy', 'man', 'boy', 'father', 'dad', 'brother',
      'son', 'uncle', 'grandfather', 'grandpa', 'husband', 'boyfriend'
    ];

    // Common female names/indicators
    const femaleIndicators = [
      'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan',
      'jessica', 'sarah', 'karen', 'nancy', 'lisa', 'betty', 'helen', 'sandra',
      'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly',
      'deborah', 'dorothy', 'lisa', 'nancy', 'karen', 'betty', 'helen', 'sandra',
      'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly',
      'deborah', 'dorothy', 'amy', 'angela', 'ashley', 'brenda', 'emma', 'olivia',
      'cynthia', 'marie', 'janet', 'catherine', 'frances', 'christine', 'samantha',
      'debra', 'rachel', 'carolyn', 'janet', 'virginia', 'maria', 'heather',
      'diane', 'julie', 'joyce', 'victoria', 'kelly', 'christina', 'joan',
      'evelyn', 'lauren', 'judith', 'megan', 'cheryl', 'andrea', 'hannah',
      'jacqueline', 'martha', 'gloria', 'teresa', 'sara', 'janice', 'marie',
      'julia', 'kathryn', 'frances', 'jean', 'alice', 'judy', 'anna', 'emma',
      'mrs', 'ms', 'miss', 'lady', 'woman', 'girl', 'mother', 'mom', 'sister',
      'daughter', 'aunt', 'grandmother', 'grandma', 'wife', 'girlfriend'
    ];

    // Check for male indicators
    for (const indicator of maleIndicators) {
      if (lowerName.includes(indicator)) {
        return 'male';
      }
    }

    // Check for female indicators
    for (const indicator of femaleIndicators) {
      if (lowerName.includes(indicator)) {
        return 'female';
      }
    }

    return 'neutral';
  };

  // Clean up character name for better avatar generation
  const getCleanCharacterName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '') // Remove spaces
      .substring(0, 20); // Limit length
  };

  // Render fallback (current system)
  const renderFallback = () => {
    const IconComponent = avatarConfig.icon;

    return (
      <div className={`
        ${sizeConfig.container} 
        rounded-full 
        flex items-center justify-center 
        border-2 
        ${avatarConfig.bgColor} 
        ${avatarConfig.borderColor}
        ${className}
      `}>
        <IconComponent className={`${sizeConfig.icon} ${avatarConfig.iconColor}`} />
      </div>
    );
  };

  // Render tutor profile image
  if (isTeacher && tutorProfileImage && !error) {
    return (
      <div className={`
        ${sizeConfig.container} 
        rounded-full 
        overflow-hidden 
        border-2 
        ${avatarConfig.borderColor}
        ${className}
      `}>
        <img
          src={tutorProfileImage}
          alt={`${character} avatar`}
          className={`${sizeConfig.image} object-cover`}
          onError={() => setError(true)}
        />
      </div>
    );
  }

  // Always render realistic human avatar (never fallback to icons)
  if (!isTeacher) {
    // If we have a generated avatar URL, use it
    if (generatedAvatarUrl && !error && !isLoading) {
      return (
        <div className={`
          ${sizeConfig.container} 
          rounded-full 
          overflow-hidden 
          border-2 
          ${avatarConfig.borderColor}
          ${className}
        `}>
          <img
            src={generatedAvatarUrl}
            alt={`${character} avatar`}
            className={`${sizeConfig.image} object-cover`}
            onError={() => {
              // If this specific image fails, try a different one from the same service
              const cleanName = getCleanCharacterName(character);
              const gender = getGenderFromName(character);
              const genderPath = gender === 'female' ? 'women' : 'men';
              // Use a different photo ID as fallback
              const fallbackPhotoId = (Math.abs(cleanName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) + 1) % 99 + 1;
              const fallbackUrl = `https://randomuser.me/api/portraits/${genderPath}/${fallbackPhotoId}.jpg`;
              setGeneratedAvatarUrl(fallbackUrl);
            }}
          />
        </div>
      );
    }

    // If loading or error, still show a realistic placeholder
    if (isLoading || error) {
      // Generate a fallback realistic avatar immediately
      const cleanName = getCleanCharacterName(character);
      const gender = getGenderFromName(character);
      const genderPath = gender === 'female' ? 'women' : 'men';
      const fallbackPhotoId = Math.abs(cleanName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 99 + 1;
      const fallbackAvatarUrl = `https://randomuser.me/api/portraits/${genderPath}/${fallbackPhotoId}.jpg`;

      return (
        <div className={`
          ${sizeConfig.container} 
          rounded-full 
          overflow-hidden 
          border-2 
          ${avatarConfig.borderColor}
          ${isLoading ? 'animate-pulse' : ''}
          ${className}
        `}>
          <img
            src={fallbackAvatarUrl}
            alt={`${character} avatar`}
            className={`${sizeConfig.image} object-cover`}
            onError={() => {
              // Last resort: use a different gender or photo ID
              const alternativeGender = gender === 'female' ? 'men' : 'women';
              const alternativePhotoId = (fallbackPhotoId + 10) % 99 + 1;
              const alternativeUrl = `https://randomuser.me/api/portraits/${alternativeGender}/${alternativePhotoId}.jpg`;
              setGeneratedAvatarUrl(alternativeUrl);
            }}
          />
        </div>
      );
    }
  }

  // For teachers without profile images, also use realistic avatars
  if (isTeacher && !tutorProfileImage) {
    const cleanName = getCleanCharacterName(character);
    const gender = getGenderFromName(character);
    const genderPath = gender === 'female' ? 'women' : 'men';
    const photoId = Math.abs(cleanName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 99 + 1;
    const teacherAvatarUrl = `https://randomuser.me/api/portraits/${genderPath}/${photoId}.jpg`;

    return (
      <div className={`
        ${sizeConfig.container} 
        rounded-full 
        overflow-hidden 
        border-2 
        ${avatarConfig.borderColor}
        ${className}
      `}>
        <img
          src={teacherAvatarUrl}
          alt={`${character} avatar`}
          className={`${sizeConfig.image} object-cover`}
          onError={() => {
            // Fallback to a different photo for teachers too
            const fallbackPhotoId = (photoId + 5) % 99 + 1;
            const fallbackUrl = `https://randomuser.me/api/portraits/${genderPath}/${fallbackPhotoId}.jpg`;
            setGeneratedAvatarUrl(fallbackUrl);
          }}
        />
      </div>
    );
  }

  // This should never be reached, but just in case, return a realistic avatar
  const cleanName = getCleanCharacterName(character || 'default');
  const gender = getGenderFromName(character || 'default');
  const genderPath = gender === 'female' ? 'women' : 'men';
  const defaultPhotoId = 50; // Use a middle-range photo ID
  const defaultAvatarUrl = `https://randomuser.me/api/portraits/${genderPath}/${defaultPhotoId}.jpg`;

  return (
    <div className={`
      ${sizeConfig.container} 
      rounded-full 
      overflow-hidden 
      border-2 
      ${avatarConfig.borderColor}
      ${className}
    `}>
      <img
        src={defaultAvatarUrl}
        alt={`${character} avatar`}
        className={`${sizeConfig.image} object-cover`}
      />
    </div>
  );
}