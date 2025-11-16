"use client";

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { debounce } from '@/lib/utils';

interface TranslationPopupState {
  isVisible: boolean;
  word: string;
  translation: string;
  wordRect: DOMRect | null;
}

export function useTextTranslation(studentNativeLanguage?: string | null) {
  const [translationPopup, setTranslationPopup] = useState<TranslationPopupState>({
    isVisible: false,
    word: '',
    translation: '',
    wordRect: null
  });
  const [isTranslating, setIsTranslating] = useState(false);

  // Close popup on scroll
  useEffect(() => {
    if (!translationPopup.isVisible) return;

    const handleScroll = () => {
      setTranslationPopup(prev => ({ ...prev, isVisible: false }));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [translationPopup.isVisible]);

  // Close popup on global click
  useEffect(() => {
    if (!translationPopup.isVisible) return;

    const handleGlobalClick = () => {
      setTranslationPopup(prev => ({ ...prev, isVisible: false }));
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [translationPopup.isVisible]);

  const translateWord = useCallback(async (word: string, wordRect: DOMRect) => {
    if (!studentNativeLanguage || isTranslating) return;

    setIsTranslating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/translate-text`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text_to_translate: word,
          target_language_code: studentNativeLanguage
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Translation failed');
      }

      const result = await response.json();

      if (result.success && result.translated_text) {
        setTranslationPopup({
          isVisible: true,
          word: word,
          translation: result.translated_text,
          wordRect: wordRect
        });
      } else {
        throw new Error(result.error || 'Translation failed');
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      toast.error(error.message || 'Failed to translate text');
    } finally {
      setIsTranslating(false);
    }
  }, [studentNativeLanguage, isTranslating]);

  // Debounced translation function
  const debouncedTranslateWord = useCallback(
    debounce((word: string, wordRect: DOMRect) => translateWord(word, wordRect), 300),
    [translateWord]
  );

  const handleTextDoubleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!studentNativeLanguage) return;

    e.preventDefault();
    e.stopPropagation();

    // Get the selected text
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0) {
      // Get the range and its bounding rect
      const range = selection?.getRangeAt(0);
      if (range) {
        const rect = range.getBoundingClientRect();

        // Close any existing popup first
        setTranslationPopup(prev => ({ ...prev, isVisible: false }));

        // Trigger translation with debouncing
        debouncedTranslateWord(selectedText, rect);
      }
    }
  }, [studentNativeLanguage, debouncedTranslateWord]);

  const closeTranslationPopup = useCallback(() => {
    setTranslationPopup(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Handle full text translation (for floating button)
  const handleTranslateText = useCallback(async (text: string) => {
    if (!studentNativeLanguage) {
      toast.info("No native language set for this student. Please add it in the student profile.");
      return;
    }

    if (isTranslating) return;

    setIsTranslating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/translate-text`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text_to_translate: text,
          target_language_code: studentNativeLanguage
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Translation failed');
      }

      const result = await response.json();

      if (result.success && result.translated_text) {
        toast.success("Translation successful", {
          description: result.translated_text,
          duration: 5000,
          action: {
            label: "Close",
            onClick: () => { }
          }
        });
      } else {
        throw new Error(result.error || 'Translation failed');
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      toast.error(error.message || 'Failed to translate text');
    } finally {
      setIsTranslating(false);
    }
  }, [studentNativeLanguage, isTranslating]);

  // Handle translation request from floating button
  const handleTranslationRequest = useCallback(async () => {
    // Get selected text
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (!selectedText || selectedText.length === 0) {
      toast.info("Please select some text to translate");
      return;
    }

    await handleTranslateText(selectedText);
  }, [handleTranslateText]);

  return {
    translationPopup,
    isTranslating,
    handleTextDoubleClick,
    closeTranslationPopup,
    handleTranslateText,
    handleTranslationRequest
  };
}
