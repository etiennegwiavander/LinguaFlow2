"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { languages } from "@/lib/sample-data";
import { toast } from "sonner";
import { BookOpen, Loader2, Target, Sparkles, Languages, Info, Lightbulb, MessageSquare, Pencil, Volume2, Zap, Headphones, Mic, CheckCircle, XCircle, HelpCircle, HandPlatter as Translate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import WordTranslationPopup from "@/components/lessons/WordTranslationPopup";

interface LessonMaterialDisplayProps {
  lessonId: string;
  studentNativeLanguage?: string | null;
}

interface LessonTemplate {
  id: string;
  name: string;
  category: string;
  level: string;
  colors: {
    primary_bg: string;
    secondary_bg: string;
    text_color: string;
    accent_color: string;
    border_color: string;
  };
  sections: any[];
}

interface TranslationResult {
  text: string;
  detected_source_language: string;
}

export default function LessonMaterialDisplay({ 
  lessonId,
  studentNativeLanguage
}: LessonMaterialDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<LessonTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translatedWord, setTranslatedWord] = useState<{
    word: string;
    translation: string;
    rect: DOMRect;
  } | null>(null);
  
  // Refs for word selection
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        setLoading(true);
        
        const { data: lesson, error: lessonError } = await supabase
          .from('lessons')
          .select('interactive_lesson_content, lesson_template_id')
          .eq('id', lessonId)
          .single();

        if (lessonError) throw lessonError;

        const hasInteractiveContent = !!lesson.interactive_lesson_content;
        const interactiveContentType = typeof lesson.interactive_lesson_content;
        
        if (!hasInteractiveContent) {
          setError("No interactive lesson content available for this lesson.");
          return;
        }

        // Parse the interactive content
        let interactiveContent;
        if (typeof lesson.interactive_lesson_content === 'string') {
          try {
            interactiveContent = JSON.parse(lesson.interactive_lesson_content);
          } catch (e) {
            setError("Failed to parse lesson content. Please try again.");
            return;
          }
        } else {
          interactiveContent = lesson.interactive_lesson_content;
        }

        // Create the template object
        const templateObj: LessonTemplate = {
          id: lesson.lesson_template_id || 'custom',
          name: interactiveContent.name || 'Custom Lesson',
          category: interactiveContent.category || 'Custom',
          level: interactiveContent.level || 'unknown',
          colors: interactiveContent.colors || {
            primary_bg: 'bg-blue-100',
            secondary_bg: 'bg-green-100',
            text_color: 'text-gray-800',
            accent_color: 'text-blue-600',
            border_color: 'border-gray-300'
          },
          sections: interactiveContent.sections || []
        };

        setTemplate(templateObj);
      } catch (err: any) {
        setError(err.message || "Failed to load lesson material");
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [lessonId]);

  // Function to handle word selection for translation
  const handleTextSelection = async () => {
    if (!studentNativeLanguage) return;
    
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    
    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length > 50) return;
    
    // Get the bounding rectangle of the selection
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Adjust rect position relative to the container
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const adjustedRect = new DOMRect(
        rect.x,
        rect.y,
        rect.width,
        rect.height
      );
      
      setTranslating(true);
      
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
            text: selectedText,
            target_language: studentNativeLanguage
          }),
        });
        
        if (!response.ok) {
          throw new Error('Translation failed');
        }
        
        const result = await response.json();
        
        if (result.success && result.translation) {
          setTranslatedWord({
            word: selectedText,
            translation: result.translation,
            rect: adjustedRect
          });
        } else {
          throw new Error(result.error || 'Translation failed');
        }
      } catch (error: any) {
        toast.error('Translation failed: ' + error.message);
      } finally {
        setTranslating(false);
      }
    }
  };

  // Helper function to get content from a section based on its type
  const getInfoCardContent = (section: any) => {
    // Try to get content from different possible locations
    if (section.content) {
      return section.content;
    }
    
    // Try to get content from ai_placeholder field
    if (section[section.ai_placeholder]) {
      return section[section.ai_placeholder];
    }
    
    // Try to get content from items array (for lists)
    if (section.items && Array.isArray(section.items) && section.items.length > 0) {
      return section.items.map(item => `• ${item}`).join('\n');
    }
    
    return "Content not available";
  };

  // Helper function to render vocabulary items
  const renderVocabularyItems = (items: any[]) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return <p className="text-muted-foreground">No vocabulary items available</p>;
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <div 
            key={index} 
            className="flex items-start space-x-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
          >
            {item.image_url && (
              <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                <img 
                  src={item.image_url} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-medium text-sm">{item.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">{item.prompt}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Helper function to render dialogue lines
  const renderDialogueLines = (lines: any[]) => {
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return <p className="text-muted-foreground">No dialogue content available</p>;
    }
    
    return (
      <div className="space-y-3">
        {lines.map((line, index) => (
          <div 
            key={index} 
            className="flex items-start space-x-3"
          >
            <div className="font-medium text-sm min-w-[80px]">{line.character}:</div>
            <div className="text-sm flex-1">{line.text}</div>
          </div>
        ))}
      </div>
    );
  };

  // Helper function to render matching pairs
  const renderMatchingPairs = (pairs: any[]) => {
    if (!pairs || !Array.isArray(pairs) || pairs.length === 0) {
      return <p className="text-muted-foreground">No matching content available</p>;
    }
    
    return (
      <div className="space-y-4">
        {pairs.map((pair, index) => (
          <div key={index} className="space-y-2">
            <div className="font-medium text-sm">{pair.question}</div>
            <div className="pl-4 space-y-1">
              {Array.isArray(pair.answers) ? (
                pair.answers.map((answer: string, ansIndex: number) => (
                  <div key={ansIndex} className="text-sm">{answer}</div>
                ))
              ) : (
                <div className="text-sm">{pair.answers}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Helper function to render fill-in-the-blanks dialogue
  const renderFillInTheBlanks = (elements: any[]) => {
    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      return <p className="text-muted-foreground">No fill-in-the-blanks content available</p>;
    }
    
    return (
      <div className="space-y-3">
        {elements.map((element, index) => {
          if (element.character && element.text) {
            return (
              <div key={index} className="flex items-start space-x-3">
                <div className="font-medium text-sm min-w-[80px]">{element.character}:</div>
                <div className="text-sm flex-1">{element.text}</div>
              </div>
            );
          } else if (element.type === 'multiple_choice') {
            return (
              <div key={index} className="ml-4 mt-2 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium mb-2">{element.question}</p>
                <div className="grid grid-cols-2 gap-2">
                  {element.options.map((option: string, optIndex: number) => (
                    <div 
                      key={optIndex}
                      className="text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            );
          } else if (element.type === 'user_input') {
            return (
              <div key={index} className="flex items-start space-x-3">
                <div className="font-medium text-sm min-w-[80px]">{element.label}:</div>
                <div className="text-sm flex-1 border-b-2 border-dashed border-gray-300 dark:border-gray-600 pb-1">
                  {element.placeholder}
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyber-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading lesson material...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
        <AlertDescription className="text-red-800 dark:text-red-200">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!template) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          No lesson template found. Please generate a lesson plan first.
        </AlertDescription>
      </Alert>
    );
  }

  // Render each section based on its type
  const renderSection = (section: any) => {
    const { type, id, title } = section;
    
    switch (type) {
      case 'title':
        return (
          <div key={id} className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-2">{title}</h1>
            {section.subtitle && (
              <p className="text-lg text-muted-foreground">{section.subtitle}</p>
            )}
            {section.image_url && (
              <div className="mt-4 rounded-lg overflow-hidden max-h-[300px]">
                <img 
                  src={section.image_url} 
                  alt={title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        );
        
      case 'info_card':
        const cardContent = getInfoCardContent(section);
        const objectives = section.items || [];
        const materials = section.materials || [];
        const assessment = section.assessment || [];
        const vocabularyItems = section.vocabulary_items || [];
        const dialogueLines = section.dialogue_lines || [];
        const matchingPairs = section.matching_pairs || [];
        const discussionPrompts = section.discussion_prompts || [];
        const practiceActivities = section.practice_activities || [];
        const usefulExpressions = section.useful_expressions || [];
        const warmupContent = section.warmup_content || [];
        const characterIntroduction = section.character_introduction || "";
        const imageBasedPracticeItems = section.image_based_practice_items || [];
        const guidedPracticeContent = section.guided_practice_content || [];
        const speakingPracticePrompts = section.speaking_practice_prompts || [];
        const reviewWrapUp = section.review_wrap_up || "";
        const songChant = section.song_chant || "";
        const funActivityGame = section.fun_activity_game || "";
        const listenRepeatSentences = section.listen_repeat_sentences || [];
        const audioPictureChoices = section.audio_picture_choices || [];
        const sayWhatYouSeeItems = section.say_what_you_see_items || [];
        const completeSentenceItems = section.complete_sentence_items || [];
        const answerQuestionsItems = section.answer_questions_items || [];
        const fillInTheBlanksContent = section.fill_in_the_blanks_content || [];
        const orderingContent = section.ordering_content || [];
        const yourTurnToAskContent = section.your_turn_to_ask_content || [];
        const yourTurnToAnswerContent = section.your_turn_to_answer_content || [];
        
        return (
          <Card 
            key={id} 
            className={`mb-6 border-${template.colors.border_color} ${template.colors.primary_bg}`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {section.content_type === 'text' && (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {cardContent.split('\n').map((paragraph: string, i: number) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              )}
              
              {section.content_type === 'list' && (
                <ul className="space-y-2">
                  {objectives.map((item: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        );
        
      case 'exercise':
        return (
          <Card key={id} className="mb-6 border-gray-200 dark:border-gray-700">
            <CardHeader className={`pb-2 ${template.colors.primary_bg}`}>
              <CardTitle className="text-xl flex items-center">
                <Target className="mr-2 h-5 w-5 text-primary" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {section.instruction && (
                <div className={`p-3 rounded-md mb-4 ${template.colors.secondary_bg}`}>
                  <p className="text-sm font-medium">{section.instruction}</p>
                </div>
              )}
              
              {section.content_type === 'list' && (
                <ul className="space-y-2">
                  {(section.items || []).map((item: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              
              {section.content_type === 'vocabulary_matching' && renderVocabularyItems(section.vocabulary_items || [])}
              
              {section.content_type === 'full_dialogue' && renderDialogueLines(section.dialogue_lines || [])}
              
              {section.content_type === 'matching' && renderMatchingPairs(section.matching_pairs || [])}
              
              {section.content_type === 'fill_in_the_blanks_dialogue' && renderFillInTheBlanks(section.dialogue_elements || [])}
              
              {section.content_type === 'text' && (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {(section.content || "").split('\n').map((paragraph: string, i: number) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
        
      default:
        return null;
    }
  };

  return (
    <div 
      className="space-y-6 relative" 
      ref={containerRef}
      onMouseUp={handleTextSelection}
    >
      {/* Translation feature notice */}
      {studentNativeLanguage && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-start">
            <Translate className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                Translation Available
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Select any word or phrase to see its translation in {languages.find(l => l.code === studentNativeLanguage)?.name || studentNativeLanguage}.
              </p>
            </div>
          </div>
        </Alert>
      )}
      
      {/* Lesson header */}
      <div className="flex items-center justify-between">
        <div>
          <Badge className="mb-2">
            {template.category} • {template.level.toUpperCase()}
          </Badge>
          <h2 className="text-2xl font-bold">{template.name}</h2>
        </div>
        <Button variant="outline" className="border-cyber-400/30 hover:bg-cyber-400/10">
          <Pencil className="w-4 h-4 mr-2" />
          Customize
        </Button>
      </div>
      
      <Separator className="my-4" />
      
      {/* Render all sections */}
      {template.sections.map(renderSection)}
      
      {/* Translation popup */}
      {translatedWord && (
        <WordTranslationPopup
          word={translatedWord.word}
          translation={translatedWord.translation}
          wordRect={translatedWord.rect}
          onClose={() => setTranslatedWord(null)}
        />
      )}
    </div>
  );
}