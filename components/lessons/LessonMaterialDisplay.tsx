"use client";

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useState, useEffect, HTMLProps } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { debounce, safeGetString, safeGetArray } from "@/lib/utils";
import { 
  Loader2, 
  BookOpen, 
  Target, 
  Users, 
  MessageSquare, 
  CheckCircle2,
  ArrowRight,
  Volume2,
  Edit3,
  RotateCcw,
  Mic,
  Play,
  Pause,
  Image as ImageIcon,
  PenTool,
  Eye,
  MessageCircle,
  Globe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import WordTranslationPopup from "./WordTranslationPopup";

interface LessonTemplate {
  id: string;
  name: string;
  category: string;
  level: string;
  template_json: {
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
    sections: TemplateSection[];
  };
}

interface TemplateSection {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  instruction?: string;
  instruction_bg_color_var?: string;
  background_color_var?: string;
  content_type?: string;
  items?: string[];
  dialogue_elements?: any[];
  dialogue_lines?: any[];
  vocabulary_items?: any[];
  matching_pairs?: any[];
  ordering_items?: string[];
  ai_placeholder?: string;
  content?: string;
  explanation_content?: string;
  sentences?: string[];
}

interface Lesson {
  id: string;
  student_id: string;
  tutor_id: string;
  date: string;
  status: string;
  materials: string[];
  notes: string | null;
  generated_lessons: string[] | null;
  sub_topics: any[] | null;
  lesson_template_id: string | null;
  interactive_lesson_content: any | null;
  student: {
    name: string;
    target_language: string;
    native_language: string | null;
    level: string;
  };
}

interface LessonPlan {
  title: string;
  objectives: string[];
  activities: string[];
  materials: string[];
  assessment: string[];
}

interface LessonMaterialDisplayProps {
  lessonId: string;
  studentNativeLanguage?: string | null;
}

interface TranslationPopupState {
  isVisible: boolean;
  word: string;
  translation: string;
  wordRect: DOMRect | null;
}

// Helper function to safely convert any value to a string for rendering
const safeStringify = (value: any): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return '[Object]';
    }
  }
  return String(value);
};

export default function LessonMaterialDisplay({ lessonId, studentNativeLanguage }: LessonMaterialDisplayProps) {
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonTemplate, setLessonTemplate] = useState<LessonTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [translationPopup, setTranslationPopup] = useState<TranslationPopupState>({
    isVisible: false,
    word: '',
    translation: '',
    wordRect: null
  });

  useEffect(() => {
    if (!user || !lessonId) return;

    const fetchLessonData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch lesson with student data
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select(`
            *,
            student:students(*)
          `)
          .eq('id', lessonId)
          .eq('tutor_id', user.id)
          .single();

        if (lessonError) throw lessonError;
        if (!lessonData) throw new Error('Lesson not found');

        setLesson(lessonData as Lesson);

        // Fetch lesson template if available
        if (lessonData.lesson_template_id) {
          const { data: templateData, error: templateError } = await supabase
            .from('lesson_templates')
            .select('*')
            .eq('id', lessonData.lesson_template_id)
            .single();

          if (templateError) {
            console.warn('Failed to fetch lesson template:', templateError);
          } else {
            setLessonTemplate(templateData as LessonTemplate);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [user, lessonId]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const toggleAnswerReveal = (questionId: string) => {
    setRevealedAnswers(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleTextDoubleClick = async (event: React.MouseEvent<HTMLElement>) => {
    if (!studentNativeLanguage) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    
    if (!selectedText) return;

    // Get the bounding rectangle of the selected text
    const rect = range.getBoundingClientRect();
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/translate-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          text: selectedText,
          target_language: studentNativeLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const result = await response.json();
      
      setTranslationPopup({
        isVisible: true,
        word: selectedText,
        translation: result.translation,
        wordRect: rect
      });

      // Clear the selection
      selection.removeAllRanges();
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate text');
    }
  };

  const closeTranslationPopup = () => {
    setTranslationPopup({
      isVisible: false,
      word: '',
      translation: '',
      wordRect: null
    });
  };

  const renderSectionContent = (section: TemplateSection, colors: any) => {
    const contentType = safeGetString(section, 'content_type', '');
    
    switch (contentType) {
      case 'text':
        const textContent = safeGetString(section, 'content', '');
        return (
          <div 
            className="prose prose-sm max-w-none"
            onDoubleClick={handleTextDoubleClick}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {textContent}
            </ReactMarkdown>
          </div>
        );

      case 'list':
        const items = safeGetArray(section, 'items');
        return (
          <ul className="space-y-2">
            {items.map((item: any, index: number) => (
              <li 
                key={index} 
                className="flex items-start"
                onDoubleClick={handleTextDoubleClick}
              >
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>{safeStringify(item)}</span>
              </li>
            ))}
          </ul>
        );

      case 'vocabulary_matching':
        const vocabularyItems = safeGetArray(section, 'vocabulary_items');
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {vocabularyItems.map((item: any, index: number) => {
              const name = safeGetString(item, 'name', `Item ${index + 1}`);
              const prompt = safeGetString(item, 'prompt', 'No description available');
              const imageUrl = safeGetString(item, 'image_url', '');
              
              return (
                <div key={index} className="border border-cyber-400/20 rounded-lg p-4 hover:border-cyber-400/50 transition-colors">
                  {imageUrl && (
                    <img 
                      src={imageUrl} 
                      alt={name}
                      className="w-full h-32 object-cover rounded-md mb-3"
                    />
                  )}
                  <h4 
                    className="font-semibold text-cyber-600 dark:text-cyber-400 mb-2"
                    onDoubleClick={handleTextDoubleClick}
                  >
                    {name}
                  </h4>
                  <p 
                    className="text-sm text-muted-foreground"
                    onDoubleClick={handleTextDoubleClick}
                  >
                    {prompt}
                  </p>
                </div>
              );
            })}
          </div>
        );

      case 'full_dialogue':
        const dialogueLines = safeGetArray(section, 'dialogue_lines');
        return (
          <div className="space-y-4">
            {dialogueLines.map((line: any, index: number) => {
              const character = safeGetString(line, 'character', 'Speaker');
              const text = safeGetString(line, 'text', 'No text available');
              const isTeacher = character === 'Tutor' || character.toLowerCase().includes('teacher');
              
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isTeacher ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <span className={`text-xs font-bold ${
                      isTeacher ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {character[0] || '?'}
                    </span>
                  </div>
                  <div className={`flex-1 p-3 rounded-lg ${
                    isTeacher ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 
                    'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  }`}>
                    <p className={`font-medium ${
                      isTeacher ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-400'
                    }`}>
                      {character}:
                    </p>
                    <p onDoubleClick={handleTextDoubleClick}>{text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'matching':
        const matchingPairs = safeGetArray(section, 'matching_pairs');
        return (
          <div className="space-y-4">
            {matchingPairs.map((pair: any, index: number) => {
              const question = safeGetString(pair, 'question', `Question ${index + 1}`);
              const answers = safeGetArray(pair, 'answers');
              
              return (
                <div key={index} className="border border-cyber-400/20 rounded-lg p-4">
                  <p 
                    className="font-medium mb-3"
                    onDoubleClick={handleTextDoubleClick}
                  >
                    {question}
                  </p>
                  <RadioGroup 
                    onValueChange={(value) => handleAnswerChange(`${section.id}_${index}`, value)}
                  >
                    {answers.map((answer: any, answerIndex: number) => (
                      <div key={answerIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={safeStringify(answer)} id={`${section.id}_${index}_${answerIndex}`} />
                        <Label 
                          htmlFor={`${section.id}_${index}_${answerIndex}`}
                          onDoubleClick={handleTextDoubleClick}
                        >
                          {safeStringify(answer)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              );
            })}
          </div>
        );

      case 'dialogue_practice':
        const dialogueElements = safeGetArray(section, 'dialogue_elements');
        return (
          <div className="space-y-4">
            {dialogueElements.map((element: any, index: number) => {
              const elementType = safeGetString(element, 'type', '');
              
              if (elementType === 'character_speech') {
                const character = safeGetString(element, 'character', 'Speaker');
                const text = safeGetString(element, 'text', 'No text available');
                
                return (
                  <div key={index} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="font-medium text-blue-800 dark:text-blue-200">{character}:</p>
                    <p onDoubleClick={handleTextDoubleClick}>{text}</p>
                  </div>
                );
              } else if (elementType === 'user_input') {
                const label = safeGetString(element, 'label', 'Input');
                const placeholder = safeGetString(element, 'placeholder', '...');
                
                return (
                  <div key={index} className="space-y-2">
                    <Label>{label}:</Label>
                    <Input 
                      placeholder={placeholder}
                      onChange={(e) => handleAnswerChange(`${section.id}_input_${index}`, e.target.value)}
                    />
                  </div>
                );
              } else if (elementType === 'multiple_choice') {
                const question = safeGetString(element, 'question', 'Question');
                const options = safeGetArray(element, 'options');
                
                return (
                  <div key={index} className="border border-cyber-400/20 rounded-lg p-4 bg-gradient-to-r from-yellow-50/50 to-amber-50/50 dark:from-yellow-900/20 dark:to-amber-900/20">
                    <p 
                      className="font-medium mb-3"
                      onDoubleClick={handleTextDoubleClick}
                    >
                      {question}
                    </p>
                    <RadioGroup 
                      onValueChange={(value) => handleAnswerChange(`${section.id}_mc_${index}`, value)}
                    >
                      {options.map((option: any, optIndex: number) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={safeStringify(option)} id={`${section.id}_${index}_${optIndex}`} />
                          <Label 
                            htmlFor={`${section.id}_${index}_${optIndex}`}
                            onDoubleClick={handleTextDoubleClick}
                          >
                            {safeStringify(option)}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                );
              }
              
              return null;
            })}
          </div>
        );

      case 'ordering':
        const orderingItems = safeGetArray(section, 'ordering_items');
        return (
          <div className="space-y-3">
            {orderingItems.map((item: any, index: number) => (
              <div 
                key={index} 
                className="p-3 border border-cyber-400/20 rounded-lg bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20"
                onDoubleClick={handleTextDoubleClick}
              >
                <span className="font-medium text-purple-600 dark:text-purple-400 mr-2">
                  {index + 1}.
                </span>
                {safeStringify(item)}
              </div>
            ))}
          </div>
        );

      case 'grammar_explanation':
        const explanationContent = safeGetString(section, 'explanation_content', '') || safeGetString(section, 'content', '');
        
        // Define explicit components for ReactMarkdown
        const components = {
          p: ({ children, ...props }: HTMLProps<HTMLParagraphElement>) => (
            <p className="mb-4 leading-relaxed" onDoubleClick={handleTextDoubleClick} {...props}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }: HTMLProps<HTMLUListElement>) => (
            <ul className="list-disc list-inside mb-4 space-y-2" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }: HTMLProps<HTMLOListElement>) => (
            <ol className="list-decimal list-inside mb-4 space-y-2" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }: HTMLProps<HTMLLIElement>) => (
            <li className="mb-1" onDoubleClick={handleTextDoubleClick} {...props}>
              {children}
            </li>
          ),
          strong: ({ children, ...props }: HTMLProps<HTMLElement>) => (
            <strong className="font-bold text-gray-900 dark:text-gray-100" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }: HTMLProps<HTMLElement>) => (
            <em className="italic" {...props}>
              {children}
            </em>
          ),
          h1: ({ children, ...props }: HTMLProps<HTMLHeadingElement>) => (
            <h1 className="text-2xl font-bold mb-4" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }: HTMLProps<HTMLHeadingElement>) => (
            <h2 className="text-xl font-bold mb-3" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }: HTMLProps<HTMLHeadingElement>) => (
            <h3 className="text-lg font-bold mb-2" {...props}>
              {children}
            </h3>
          ),
        };

        return (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown 
              key={explanationContent}
              remarkPlugins={[remarkGfm]}
              components={components}
            >
              {explanationContent}
            </ReactMarkdown>
          </div>
        );

      case 'example_sentences':
        const sentences = safeGetArray(section, 'sentences');
        return (
          <div className="space-y-3">
            {sentences.map((sentence: any, index: number) => (
              <div 
                key={index} 
                className="p-3 border border-cyber-400/20 rounded-lg bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20"
                onDoubleClick={handleTextDoubleClick}
              >
                <span className="font-medium text-green-600 dark:text-green-400 mr-2">
                  {index + 1}.
                </span>
                {safeStringify(sentence)}
              </div>
            ))}
          </div>
        );

        case 'fill_in_the_blanks_dialogue':
          const fillDialogueElements = safeGetArray(section, 'dialogue_elements');

          if (fillDialogueElements.length === 0) {
            return (
              <div className="text-center py-4 text-gray-500">
                <p>No dialogue elements available for this exercise.</p>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              {fillDialogueElements.map((element, index) => {
                // Defensive check for element object
                if (!element || typeof element !== 'object') {
                  return (
                    <div key={index} className="p-3 border border-red-200 rounded-lg bg-red-50">
                      <p className="text-red-600 text-sm">Invalid dialogue element</p>
                    </div>
                  );
                }

                // Determine the element type dynamically
                let determinedElementType = safeGetString(element, 'type', 'unknown');
                if (element.character && element.text && determinedElementType === 'unknown') {
                  // If it has character and text, and no explicit type, it's a dialogue line
                  determinedElementType = 'dialogue';
                }

                // Handle different element types properly
                if (determinedElementType === 'dialogue') {
                  const character = safeGetString(element, 'character', 'Speaker');
                  const text = safeGetString(element, 'text', 'No text available');
                  const isTeacher = character === 'Tutor' || character.toLowerCase().includes('teacher');
                  
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isTeacher ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        <span className={`text-xs font-bold ${
                          isTeacher ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          {character[0] || '?'}
                        </span>
                      </div>
                      <div className={`flex-1 p-3 rounded-lg ${
                        isTeacher ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 
                        'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      }`}>
                        <p className={`font-medium ${
                          isTeacher ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-400'
                        }`}>
                          {character}:
                        </p>
                        <p onDoubleClick={handleTextDoubleClick}>{text}</p>
                      </div>
                    </div>
                  );
                } else if (determinedElementType === 'multiple_choice') {
                  const question = safeGetString(element, 'question', '') || safeGetString(element, 'text', 'Question not available');
                  const options = safeGetArray(element, 'options');
                  const correctAnswer = safeGetString(element, 'correct_answer', '');
                  
                  return (
                    <div key={index} className="border border-cyber-400/20 rounded-lg p-4 bg-gradient-to-r from-yellow-50/50 to-amber-50/50 dark:from-yellow-900/20 dark:to-amber-900/20">
                      <p 
                        className="font-medium mb-3"
                        onDoubleClick={handleTextDoubleClick}
                      >
                        {question}
                      </p>
                      <RadioGroup 
                        onValueChange={(value) => handleAnswerChange(`${section.id}_mc_${index}`, value)}
                      >
                        {options.length > 0 ? options.map((option: any, optIndex: number) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <RadioGroupItem value={safeStringify(option)} id={`${section.id}_${index}_${optIndex}`} />
                            <Label 
                              htmlFor={`${section.id}_${index}_${optIndex}`}
                              onDoubleClick={handleTextDoubleClick}
                            >
                              {safeStringify(option)}
                            </Label>
                          </div>
                        )) : (
                          <p className="text-sm text-gray-500">No answer options available</p>
                        )}
                      </RadioGroup>
                      {correctAnswer && (
                        <div className="mt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => toggleAnswerReveal(`${section.id}_mc_${index}`)}
                            className="text-xs"
                          >
                            {revealedAnswers[`${section.id}_mc_${index}`] ? 'Hide Answer' : 'Show Answer'}
                          </Button>
                          
                          {revealedAnswers[`${section.id}_mc_${index}`] && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm">
                              <span className="font-medium text-green-700 dark:text-green-300">Correct answer:</span> {correctAnswer}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // Return a warning for unrecognized element types
                  return (
                    <div key={index} className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                      <p className="text-yellow-600 text-sm">Unknown element type: {determinedElementType}</p>
                    </div>
                  );
                }
              })}
            </div>
          );

      default:
        return (
          <div className="text-center py-4 text-gray-500">
            <p>Content type "{contentType}" is not yet supported.</p>
          </div>
        );
    }
  };

  const renderSection = (section: TemplateSection, colors: any) => {
    const sectionType = safeGetString(section, 'type', '');
    const title = safeGetString(section, 'title', '');
    const subtitle = safeGetString(section, 'subtitle', '');
    const instruction = safeGetString(section, 'instruction', '');
    const instructionBgColorVar = safeGetString(section, 'instruction_bg_color_var', 'secondary_bg');
    const backgroundColorVar = safeGetString(section, 'background_color_var', 'primary_bg');

    if (sectionType === 'title') {
      return (
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 gradient-text">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      );
    }

    if (sectionType === 'info_card') {
      const bgColorClass = colors[backgroundColorVar] || 'bg-blue-50';
      
      return (
        <Card className={`${bgColorClass} border-cyber-400/20 mb-6`}>
          <CardHeader>
            <CardTitle className="flex items-center text-cyber-600 dark:text-cyber-400">
              <BookOpen className="w-5 h-5 mr-2" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderSectionContent(section, colors)}
          </CardContent>
        </Card>
      );
    }

    if (sectionType === 'exercise') {
      const instructionBgClass = colors[instructionBgColorVar] || 'bg-green-50';
      
      return (
        <Card className="border-cyber-400/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-cyber-600 dark:text-cyber-400">
              <Target className="w-5 h-5 mr-2" />
              {title}
            </CardTitle>
            {instruction && (
              <div className={`${instructionBgClass} p-3 rounded-lg border border-cyber-400/20`}>
                <p className="text-sm font-medium">{instruction}</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {renderSectionContent(section, colors)}
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyber-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading lesson materials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Error Loading Lesson</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Lesson Found</h3>
        <p className="text-muted-foreground">The requested lesson could not be found.</p>
      </div>
    );
  }

  // If we have interactive lesson content, render it
  if (lesson.interactive_lesson_content && lessonTemplate) {
    const interactiveContent = lesson.interactive_lesson_content;
    const colors = interactiveContent.colors || lessonTemplate.template_json.colors;
    const sections = interactiveContent.sections || [];

    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {sections.map((section: TemplateSection, index: number) => (
          <div key={section.id || index}>
            {renderSection(section, colors)}
          </div>
        ))}
        
        {/* Translation popup */}
        {translationPopup.isVisible && translationPopup.wordRect && (
          <WordTranslationPopup
            word={translationPopup.word}
            translation={translationPopup.translation}
            wordRect={translationPopup.wordRect}
            onClose={closeTranslationPopup}
          />
        )}
      </div>
    );
  }

  // Fallback: render basic lesson information
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-cyber-400/20">
        <CardHeader>
          <CardTitle className="flex items-center text-cyber-600 dark:text-cyber-400">
            <BookOpen className="w-5 h-5 mr-2" />
            Lesson for {lesson.student.name}
          </CardTitle>
          <CardDescription>
            {lesson.student.target_language} • Level: {lesson.student.level}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lesson.notes && (
              <div>
                <h3 className="font-semibold mb-2">Lesson Notes</h3>
                <p className="text-muted-foreground">{lesson.notes}</p>
              </div>
            )}
            
            {lesson.materials && lesson.materials.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Materials</h3>
                <ul className="list-disc list-inside space-y-1">
                  {lesson.materials.map((material, index) => (
                    <li key={index} className="text-muted-foreground">{material}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Interactive Content Not Available</h3>
        <p className="text-muted-foreground">
          This lesson doesn't have interactive content yet. Generate interactive materials to see them here.
        </p>
      </div>
    </div>
  );
}