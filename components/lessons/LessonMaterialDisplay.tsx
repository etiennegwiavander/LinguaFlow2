"use client";

import { useState, useCallback, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { debounce } from "@/lib/utils";
import WordTranslationPopup from "./WordTranslationPopup";

interface LessonMaterialDisplayProps {
  content: any;
  studentNativeLanguage?: string;
}

export default function LessonMaterialDisplay({ 
  content, 
  studentNativeLanguage 
}: LessonMaterialDisplayProps) {
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());
  const [translationPopup, setTranslationPopup] = useState<{
    word: string;
    translation: string;
    wordRect: DOMRect;
  } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleAnswer = (questionId: string) => {
    setRevealedAnswers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const translateWord = async (word: string, wordRect: DOMRect) => {
    if (!studentNativeLanguage || isTranslating) return;
    
    console.log('🔍 Starting translation for word:', word);
    console.log('📍 Word rect from getBoundingClientRect:', {
      top: wordRect.top,
      left: wordRect.left,
      right: wordRect.right,
      bottom: wordRect.bottom,
      width: wordRect.width,
      height: wordRect.height
    });
    
    setIsTranslating(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/translate-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: word,
          target_language: studentNativeLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      console.log('✅ Translation received:', data.translation);
      
      setTranslationPopup({
        word,
        translation: data.translation,
        wordRect
      });
    } catch (error) {
      console.error('❌ Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const debouncedTranslateWord = useCallback(
    debounce(translateWord, 300),
    [studentNativeLanguage, isTranslating]
  );

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!studentNativeLanguage) return;
    
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      console.log('📝 Selected text for translation:', selectedText);
      
      // Get the range and create a temporary element to get precise positioning
      const range = selection?.getRangeAt(0);
      if (range) {
        const rect = range.getBoundingClientRect();
        console.log('📍 Selection rect from range:', {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height
        });
        
        debouncedTranslateWord(selectedText, rect);
      }
    } else {
      // Fallback to word detection at click position
      const target = e.target as HTMLElement;
      const text = target.textContent || '';
      const clickX = e.clientX;
      
      // Simple word extraction around click position
      const words = text.split(/\s+/);
      const word = words.find(w => w.length > 2); // Get first meaningful word
      
      if (word) {
        console.log('🎯 Fallback word detection:', word);
        const rect = target.getBoundingClientRect();
        console.log('📍 Target element rect:', {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height
        });
        
        debouncedTranslateWord(word.replace(/[.,!?;:]$/, ''), rect);
      }
    }
  };

  const closeTranslationPopup = () => {
    console.log('❌ Closing translation popup');
    setTranslationPopup(null);
  };

  const renderColorVar = (colorVar: string) => {
    const colorMap: { [key: string]: string } = {
      'primary_bg': content.colors?.primary_bg || 'bg-blue-100',
      'secondary_bg': content.colors?.secondary_bg || 'bg-green-100',
      'text_color': content.colors?.text_color || 'text-gray-800',
      'accent_color': content.colors?.accent_color || 'text-blue-600',
      'border_color': content.colors?.border_color || 'border-gray-300'
    };
    return colorMap[colorVar] || colorVar;
  };

  const renderSection = (section: any, index: number) => {
    const sectionKey = `${section.id}-${index}`;

    switch (section.type) {
      case 'title':
        return (
          <div key={sectionKey} className="text-center mb-8">
            {section.image_url && (
              <div className="mb-6">
                <img 
                  src={section.image_url} 
                  alt={section.title}
                  className="w-full max-w-md mx-auto rounded-lg shadow-md"
                />
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              {section.title}
            </h1>
            <p className="text-lg text-gray-600">{section.subtitle}</p>
          </div>
        );

      case 'info_card':
        return (
          <Card key={sectionKey} className={`mb-6 ${renderColorVar(section.background_color_var || 'primary_bg')}`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {section.content_type === 'list' && section.items ? (
                <ul className="space-y-2">
                  {section.items.map((item: string, itemIndex: number) => (
                    <li key={itemIndex} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700 leading-relaxed">{section.content || section.text}</p>
              )}
            </CardContent>
          </Card>
        );

      case 'exercise':
        return (
          <Card key={sectionKey} className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">
                {section.title}
              </CardTitle>
              {section.instruction && (
                <div className={`p-3 rounded-md ${renderColorVar(section.instruction_bg_color_var || 'secondary_bg')}`}>
                  <p className="text-sm font-medium text-gray-700">
                    {section.instruction}
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {renderExerciseContent(section, sectionKey)}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const renderExerciseContent = (section: any, sectionKey: string) => {
    switch (section.content_type) {
      case 'vocabulary_matching':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {section.vocabulary_items?.map((item: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                {item.image_url && (
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-full h-32 object-cover rounded-md mb-3"
                  />
                )}
                <h4 className="font-semibold text-lg mb-2">{item.name}</h4>
                <p className="text-gray-600 text-sm">{item.prompt}</p>
              </div>
            ))}
          </div>
        );

      case 'full_dialogue':
        return (
          <div className="space-y-3">
            {section.dialogue_lines?.map((line: any, index: number) => (
              <div key={index} className="flex items-start space-x-3">
                <Badge variant="outline" className="min-w-fit">
                  {line.character}
                </Badge>
                <p className="flex-1 text-gray-700">{line.text}</p>
              </div>
            ))}
          </div>
        );

      case 'matching':
        return (
          <div className="space-y-4">
            {section.matching_pairs?.map((pair: any, index: number) => {
              const questionId = `${sectionKey}-question-${index}`;
              const isRevealed = revealedAnswers.has(questionId);
              
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-medium text-gray-800">{pair.question}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAnswer(questionId)}
                      className="ml-4 flex items-center"
                    >
                      {isRevealed ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Reveal
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {isRevealed && (
                    <div className="space-y-2 mt-3 pt-3 border-t">
                      {Array.isArray(pair.answers) ? (
                        pair.answers.map((answer: string, answerIndex: number) => (
                          <div key={answerIndex} className="p-2 bg-green-50 rounded border-l-4 border-green-400">
                            <span className="text-green-800">{answer}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 bg-green-50 rounded border-l-4 border-green-400">
                          <span className="text-green-800">{pair.answers}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'list':
        return (
          <ul className="space-y-2">
            {section.items?.map((item: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );

      case 'fill_in_the_blanks_dialogue':
        return (
          <div className="space-y-4">
            {section.dialogue_elements?.map((element: any, index: number) => {
              if (element.type === 'multiple_choice') {
                const questionId = `${sectionKey}-mc-${index}`;
                const isRevealed = revealedAnswers.has(questionId);
                
                return (
                  <div key={index} className="border rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-medium text-gray-800">{element.question}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAnswer(questionId)}
                        className="ml-4 flex items-center"
                      >
                        {isRevealed ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Reveal
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                      {element.options?.map((option: string, optionIndex: number) => (
                        <div key={optionIndex} className="p-2 border rounded text-center">
                          {option}
                        </div>
                      ))}
                    </div>
                    
                    {isRevealed && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="p-2 bg-green-50 rounded border-l-4 border-green-400">
                          <span className="text-green-800 font-medium">
                            Correct answer: {element.options?.[0]}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <Badge variant="outline" className="min-w-fit">
                      {element.character}
                    </Badge>
                    <p className="flex-1 text-gray-700">{element.text}</p>
                  </div>
                );
              }
            })}
          </div>
        );

      default:
        return (
          <div className="text-gray-600">
            <p>Content type "{section.content_type}" not yet implemented.</p>
          </div>
        );
    }
  };

  if (!content || !content.sections) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No lesson content available.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 relative">
      {/* Translation instruction */}
      {studentNativeLanguage && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Translation Help:</strong> Double-click any word to see its translation in your native language.
          </p>
        </div>
      )}

      {/* Main content */}
      <div 
        ref={contentRef}
        onDoubleClick={handleDoubleClick}
        className="space-y-6 cursor-text"
      >
        {content.sections.map((section: any, index: number) => 
          renderSection(section, index)
        )}
      </div>

      {/* Translation popup */}
      {translationPopup && (
        <WordTranslationPopup
          word={translationPopup.word}
          translation={translationPopup.translation}
          wordRect={translationPopup.wordRect}
          onClose={closeTranslationPopup}
        />
      )}

      {/* Click outside to close popup */}
      {translationPopup && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={closeTranslationPopup}
        />
      )}
    </div>
  );
}