import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface CharacterInfo {
  name: string;
  role: string;
  isTeacher: boolean;
  avatarUrl?: string;
}

interface UseDialogueAvatarsReturn {
  getCharacterInfo: (character: string) => CharacterInfo;
  preloadAvatars: (characters: string[]) => Promise<void>;
  clearCache: () => void;
}

// Enhanced role detection patterns
const ROLE_DETECTION = {
  teacher: {
    patterns: [
      /^(teacher|tutor|instructor|professor|educator|mr\.|mrs\.|ms\.|dr\.)/i,
      /teacher|tutor|instructor|professor|educator/i
    ],
    priority: 10
  },
  student: {
    patterns: [
      /^(student|learner|pupil)/i,
      /student|learner|pupil/i
    ],
    priority: 8
  },
  doctor: {
    patterns: [
      /^(doctor|dr\.|physician|nurse)/i,
      /doctor|dr\.|physician|nurse|medical|health/i
    ],
    priority: 9
  },
  customer: {
    patterns: [
      /^(customer|client|buyer|shopper)/i,
      /customer|client|buyer|shopper|patron/i
    ],
    priority: 7
  },
  friend: {
    patterns: [
      /^(friend|buddy|pal|mate)/i,
      /friend|buddy|pal|mate/i
    ],
    priority: 6
  },
  family: {
    patterns: [
      /^(mother|father|mom|dad|parent|sister|brother|grandmother|grandfather|aunt|uncle|cousin)/i,
      /mother|father|mom|dad|parent|sister|brother|sibling|grandmother|grandfather|grandma|grandpa|aunt|uncle|cousin|family/i
    ],
    priority: 8
  },
  professional: {
    patterns: [
      /^(manager|boss|colleague|coworker|employee|worker|executive|director)/i,
      /manager|boss|colleague|coworker|employee|worker|executive|director|professional/i
    ],
    priority: 7
  },
  service: {
    patterns: [
      /^(waiter|waitress|server|cashier|receptionist|clerk|barista)/i,
      /waiter|waitress|server|cashier|receptionist|clerk|barista|staff/i
    ],
    priority: 6
  }
};

// Character consistency cache - maintains same role for same character name
const characterRoleCache = new Map<string, string>();

export function useDialogueAvatars(): UseDialogueAvatarsReturn {
  const { user } = useAuth();
  const [tutorProfileUrl, setTutorProfileUrl] = useState<string | null>(null);

  // Fetch tutor profile on mount
  useEffect(() => {
    if (!user) return;

    const fetchTutorProfile = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, profile_image_url')
          .eq('id', user.id)
          .single();

        if (profile) {
          const imageUrl = profile.avatar_url || profile.profile_image_url;
          setTutorProfileUrl(imageUrl);
        }
      } catch (error) {
        console.warn('Could not fetch tutor profile:', error);
      }
    };

    fetchTutorProfile();
  }, [user]);

  // Detect character role with consistency
  const detectCharacterRole = useCallback((character: string): string => {
    const normalizedName = character.toLowerCase().trim();
    
    // Check cache first for consistency
    if (characterRoleCache.has(normalizedName)) {
      return characterRoleCache.get(normalizedName)!;
    }

    let detectedRole = 'default';
    let highestPriority = 0;

    // Check each role pattern
    for (const [role, config] of Object.entries(ROLE_DETECTION)) {
      for (const pattern of config.patterns) {
        if (pattern.test(character) && config.priority > highestPriority) {
          detectedRole = role;
          highestPriority = config.priority;
        }
      }
    }

    // Cache the detected role for consistency
    characterRoleCache.set(normalizedName, detectedRole);
    return detectedRole;
  }, []);

  // Get character information
  const getCharacterInfo = useCallback((character: string): CharacterInfo => {
    const role = detectCharacterRole(character);
    const isTeacher = role === 'teacher';
    
    return {
      name: character,
      role,
      isTeacher,
      avatarUrl: isTeacher ? tutorProfileUrl || undefined : undefined
    };
  }, [detectCharacterRole, tutorProfileUrl]);

  // Preload avatars for better performance
  const preloadAvatars = useCallback(async (characters: string[]): Promise<void> => {
    const uniqueCharacters = Array.from(new Set(characters));
    
    // Pre-detect roles for all characters to ensure consistency
    uniqueCharacters.forEach(character => {
      detectCharacterRole(character);
    });

    // Preload generated avatars (this would be expanded with actual avatar generation)
    const preloadPromises = uniqueCharacters
      .filter(char => !getCharacterInfo(char).isTeacher)
      .map(async (character) => {
        const info = getCharacterInfo(character);
        const seed = encodeURIComponent(character.toLowerCase().replace(/\s+/g, ''));
        const style = getAvatarStyleForRole(info.role);
        const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=transparent`;
        
        // Preload the image
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Don't fail on error, just continue
          img.src = avatarUrl;
        });
      });

    await Promise.allSettled(preloadPromises);
  }, [getCharacterInfo, detectCharacterRole]);

  // Clear cache
  const clearCache = useCallback(() => {
    characterRoleCache.clear();
  }, []);

  return {
    getCharacterInfo,
    preloadAvatars,
    clearCache
  };
}

// Helper function to get avatar style based on role
function getAvatarStyleForRole(role: string): string {
  switch (role) {
    case 'teacher':
    case 'professional':
      return 'personas';
    case 'student':
      return 'adventurer';
    case 'doctor':
      return 'personas';
    case 'customer':
    case 'service':
      return 'micah';
    case 'friend':
    case 'family':
      return 'fun-emoji';
    default:
      return 'initials';
  }
}