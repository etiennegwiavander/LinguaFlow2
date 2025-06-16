"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface TranslationState {
  isVisible: boolean;
  position: { x: number; y: number };
  originalText: string;
  translatedText: string | null;
  isLoading: boolean;
}

export function useTranslationPopup(targetLanguageCode?: string | null) {
  const [translationState, setTranslationState] = useState<TranslationState>({
    isVisible: false,
    position: { x: 0, y: 0 },
    originalText: "",
    translatedText: null,
    isLoading: false,
  });

  const showTranslation = useCallback(async (
    text: string, 
    clientX: number, 
    clientY: number
  ) => {
    if (!targetLanguageCode) {
      toast.info("No native language set for translation. Please add it in the student profile.");
      return;
    }

    // Set initial state with loading
    setTranslationState({
      isVisible: true,
      position: { x: clientX, y: clientY },
      originalText: text,
      translatedText: null,
      isLoading: true,
    });

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
          target_language_code: targetLanguageCode
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Translation failed');
      }

      const result = await response.json();
      
      if (result.success && result.translated_text) {
        setTranslationState(prev => ({
          ...prev,
          translatedText: result.translated_text,
          isLoading: false,
        }));
      } else {
        throw new Error(result.error || 'Translation failed');
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      setTranslationState(prev => ({
        ...prev,
        translatedText: null,
        isLoading: false,
      }));
      toast.error(error.message || 'Failed to translate text');
    }
  }, [targetLanguageCode]);

  const hideTranslation = useCallback(() => {
    setTranslationState({
      isVisible: false,
      position: { x: 0, y: 0 },
      originalText: "",
      translatedText: null,
      isLoading: false,
    });
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!targetLanguageCode) return;
    
    // Get the selected text
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      
      // Get the position relative to the viewport
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      
      showTranslation(selectedText, x, y);
      
      // Clear the selection
      selection?.removeAllRanges();
    }
  }, [targetLanguageCode, showTranslation]);

  return {
    translationState,
    handleDoubleClick,
    hideTranslation,
  };
}