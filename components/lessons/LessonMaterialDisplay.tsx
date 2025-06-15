/*
  # Fixed LessonMaterialDisplay.tsx - Complete Issue Resolution
  
  1. Changes
    - Fixed vocabulary rendering to use correct property names (word/definition)
    - Added support for grammar_explanation content type
    - Added support for example_sentences content type
    - Fixed dialogue parsing to handle string format from AI
    - Updated matching questions to work with single answer format
    - Removed debug console.log statements
    
  2. Fixes
    - Vocabulary items now display correctly using word/definition properties
    - Grammar explanations render with proper formatting
    - Example sentences display as a formatted list
    - Dialogue lines parse character names and text from string format
    - Matching questions show question and answer pairs properly
*/

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
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
  MessageCircle
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

// Helper function to safely get a string property from an object
const safeGetString = (obj: any, key: string, fallback: string = ''): string => {
  if (!obj || typeof obj !== 'object') {
    return fallback;
  }
  
  const value = obj[key];
  const result = safeStringify(value) || fallback;
  
  return result;
};

// Helper function to safely get an array from an object
const safeGetArray = (obj: any, key: string): any[] => {
  if (!obj || typeof obj !== 'object') {
    return [];
  }
  const value = obj[key];
  return Array.isArray(value) ? value : [];
};

// Helper function to parse dialogue strings like "A: Hello! I am Maria."
const parseDialogueLine = (line: string): { character: string; text: string } => {
  if (typeof line !== 'string') {
    return { character: 'Speaker', text: 'No text available' };
  }
  
  const match = line.match(/^([^:]+):\s*(.*)$/);
  if (match) {
    return {
      character: match[1].trim(),
      text: match[2].trim()
    };
  }
  
  // Fallback if no colon found
  return { character: 'Speaker', text: line };
};

export default function LessonMaterialDisplay({ lessonId }: LessonMaterialDisplayProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [template, setTemplate] = useState<LessonTemplate | null>(null);
  const [generatedLessons, setGeneratedLessons] = useState<LessonPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user || !lessonId) return;

    const fetchLessonData = async () => {
      try {
        // Fetch lesson with student details and interactive content
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select(`
            *,
            student:students(
              name,
              target_language,
              level
            )
          `)
          .eq('id', lessonId)
          .eq('tutor_id', user.id)
          .single();

        if (lessonError) {
          throw new Error('Failed to fetch lesson data');
        }

        if (!lessonData) {
          throw new Error('Lesson not found');
        }

        setLesson(lessonData as Lesson);

        // Check if we have interactive lesson content
        if (lessonData.interactive_lesson_content) {
          // If we have a lesson template ID, fetch the template structure
          if (lessonData.lesson_template_id) {
            const { data: templateData, error: templateError } = await supabase
              .from('lesson_templates')
              .select('*')
              .eq('id', lessonData.lesson_template_id)
              .single();

            if (templateError) {
              console.error('⚠️ Could not fetch lesson template:', templateError);
            } else {
              // Use the interactive content as the template JSON
              const finalTemplate = {
                ...templateData,
                template_json: lessonData.interactive_lesson_content
              } as LessonTemplate;
              
              setTemplate(finalTemplate);
            }
          } else {
            // Create a mock template with the interactive content
            const mockTemplate = {
              id: 'interactive',
              name: 'Interactive Lesson',
              category: 'Interactive',
              level: lessonData.student.level,
              template_json: lessonData.interactive_lesson_content
            } as LessonTemplate;
            
            setTemplate(mockTemplate);
          }
        } else {
          // Fall back to generated lessons if no interactive content
          if (lessonData.generated_lessons && lessonData.generated_lessons.length > 0) {
            try {
              const parsedLessons = lessonData.generated_lessons.map((lessonStr: string) => 
                JSON.parse(lessonStr)
              );
              setGeneratedLessons(parsedLessons);
            } catch (parseError) {
              console.error('❌ Error parsing generated lessons:', parseError);
              setError('Failed to parse lesson content');
              return;
            }
          }

          // Fetch lesson template if available for fallback
          if (lessonData.lesson_template_id) {
            const { data: templateData, error: templateError } = await supabase
              .from('lesson_templates')
              .select('*')
              .eq('id', lessonData.lesson_template_id)
              .single();

            if (templateError) {
              console.error('⚠️ Could not fetch lesson template:', templateError);
            } else {
              setTemplate(templateData as LessonTemplate);
            }
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

  const handleAudioPlay = (audioId: string) => {
    setIsPlaying(prev => ({
      ...prev,
      [audioId]: !prev[audioId]
    }));
    
    // Simulate audio playback
    setTimeout(() => {
      setIsPlaying(prev => ({
        ...prev,
        [audioId]: false
      }));
    }, 3000);
  };

  const renderTemplateSection = (section: TemplateSection, lessonIndex: number = 0) => {
    if (!template) return null;

    // Defensive check for section object
    if (!section || typeof section !== 'object') {
      console.warn('Invalid section object:', section);
      return (
        <div key="invalid-section" className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-600">Invalid section data</p>
        </div>
      );
    }

    const colors = template.template_json.colors || {};
    const currentLesson = generatedLessons[lessonIndex];

    // Get background color class
    const getBgColor = (colorVar?: string) => {
      if (!colorVar || !colors) return '';
      return colors[colorVar as keyof typeof colors] || '';
    };

    const sectionId = safeGetString(section, 'id', 'unknown-section');
    const sectionType = safeGetString(section, 'type', 'unknown');

    switch (sectionType) {
      case 'title':
        return (
          <div key={sectionId} className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {safeGetString(section, 'title', 'Lesson Title')}
            </h1>
            {section.subtitle && (
              <p className="text-xl text-gray-600">{safeGetString(section, 'subtitle', '')}</p>
            )}
          </div>
        );

      case 'info_card':
        const objectives = safeGetArray(section, 'items');

        return (
          <Card key={sectionId} className={`mb-6 ${getBgColor(section.background_color_var)}`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                {safeGetString(section, 'title', 'Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {typeof section.content === 'string' ? (
                <p className="text-sm">{safeStringify(section.content)}</p>
              ) : (
                <ul className="space-y-2">
                  {objectives.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>{safeStringify(item)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        );

      case 'exercise':
        return (
          <Card key={sectionId} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                {safeGetString(section, 'title', 'Exercise')}
              </CardTitle>
              {section.instruction && (
                <div className={`p-3 rounded-lg ${getBgColor(section.instruction_bg_color_var)}`}>
                  <p className="text-sm font-medium">{safeGetString(section, 'instruction', '')}</p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {renderExerciseContent(section, lessonIndex)}
            </CardContent>
          </Card>
        );

      default:
        console.warn(`Unknown section type: ${sectionType}`);
        return (
          <div key={sectionId} className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
            <p className="text-yellow-600">Unknown section type: {sectionType}</p>
          </div>
        );
    }
  };

  const renderExerciseContent = (section: TemplateSection, lessonIndex: number) => {
    const currentLesson = generatedLessons[lessonIndex];
    const contentType = safeGetString(section, 'content_type', 'unknown');

    switch (contentType) {
      case 'list':
        const items = safeGetArray(section, 'items');

        if (items.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No items available for this exercise.</p>
            </div>
          );
        }

        return (
          <div className="space-y-3">
            {items.map((item: string, index: number) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{safeStringify(item)}</span>
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <div className="prose max-w-none">
            <p>{safeGetString(section, 'content', 'Content will be displayed here.')}</p>
          </div>
        );

      case 'grammar_explanation':
        const explanationContent = safeGetString(section, 'explanation_content', 'No explanation available.');
        
        return (
          <div className="prose max-w-none">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {explanationContent}
              </div>
            </div>
          </div>
        );

      case 'example_sentences':
        const sentences = safeGetArray(section, 'sentences');
        
        if (sentences.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No example sentences available.</p>
            </div>
          );
        }

        return (
          <div className="space-y-2">
            <ul className="space-y-3">
              {sentences.map((sentence: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-sm">{safeStringify(sentence)}</span>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'vocabulary_matching':
        const vocabularyItems = safeGetArray(section, 'vocabulary_items');

        if (vocabularyItems.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No vocabulary items available for this exercise.</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vocabularyItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                {item.image_url && (
                  <img 
                    src={safeStringify(item.image_url)} 
                    alt={safeStringify(item.word || item.name)}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold">{safeStringify(item.word || item.name)}</h4>
                  <p className="text-sm text-gray-600">{safeStringify(item.definition || item.prompt)}</p>
                </div>
                <Button size="sm" variant="outline">
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        );

      case 'full_dialogue':
        const dialogueLines = safeGetArray(section, 'dialogue_lines');

        if (dialogueLines.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No dialogue content available for this exercise.</p>
            </div>
          );
        }

        return (
          <div className="space-y-3">
            {dialogueLines.map((line, index) => {
              let character: string;
              let text: string;
              
              // Handle both object format and string format
              if (typeof line === 'object' && line !== null) {
                // Object format: { speaker: "Person A", line: "Hello!" }
                character = safeGetString(line, 'speaker', 'Speaker');
                text = safeGetString(line, 'line', 'No text available');
              } else {
                // String format: "A: Hello! I am Maria."
                const parsed = parseDialogueLine(line);
                character = parsed.character;
                text = parsed.text;
              }
              
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    character.toLowerCase().includes('teacher') || character.toLowerCase().includes('tutor') ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <span className={`text-xs font-bold ${
                      character.toLowerCase().includes('teacher') || character.toLowerCase().includes('tutor') ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {character ? character[0] : '?'}
                    </span>
                  </div>
                  <div className={`flex-1 p-3 rounded-lg ${
                    character.toLowerCase().includes('teacher') || character.toLowerCase().includes('tutor') ? 'bg-green-50' : 'bg-blue-50'
                  }`}>
                    <p className={`font-medium ${
                      character.toLowerCase().includes('teacher') || character.toLowerCase().includes('tutor') ? 'text-green-800' : 'text-blue-800'
                    }`}>
                      {character}:
                    </p>
                    <p>{text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'fill_in_the_blanks_dialogue':
        const dialogueElements = safeGetArray(section, 'dialogue_elements');

        if (dialogueElements.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No dialogue elements available for this exercise.</p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {dialogueElements.map((element, index) => {
              // Defensive check for element object
              if (!element || typeof element !== 'object') {
                return (
                  <div key={index} className="p-3 border border-red-200 rounded-lg bg-red-50">
                    <p className="text-red-600 text-sm">Invalid dialogue element</p>
                  </div>
                );
              }

              const elementType = safeGetString(element, 'type', 'unknown');

              // Handle different element types properly
              if (elementType === 'dialogue') {
                const character = safeGetString(element, 'character', 'Speaker');
                const text = safeGetString(element, 'text', 'No text available');
                
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      character === 'Tutor' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <span className={`text-xs font-bold ${
                        character === 'Tutor' ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {character[0] || '?'}
                      </span>
                    </div>
                    <div className={`flex-1 p-3 rounded-lg ${
                      character === 'Tutor' ? 'bg-green-50' : 'bg-blue-50'
                    }`}>
                      <p className={`font-medium ${
                        character === 'Tutor' ? 'text-green-800' : 'text-blue-800'
                      }`}>
                        {character}:
                      </p>
                      <p>{text}</p>
                    </div>
                  </div>
                );
              } else if (elementType === 'multiple_choice') {
                const question = safeGetString(element, 'question', '') || safeGetString(element, 'text', 'Question not available');
                const options = safeGetArray(element, 'options');
                const correctAnswer = safeGetString(element, 'correct_answer', '');
                
                return (
                  <div key={index} className="border rounded-lg p-4 bg-yellow-50">
                    <p className="font-medium mb-3">{question}</p>
                    <RadioGroup 
                      onValueChange={(value) => handleAnswerChange(`${section.id}_mc_${index}`, value)}
                    >
                      {options.length > 0 ? options.map((option: any, optIndex: number) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={safeStringify(option)} id={`${section.id}_${index}_${optIndex}`} />
                          <Label htmlFor={`${section.id}_${index}_${optIndex}`}>{safeStringify(option)}</Label>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500">No answer options available</p>
                      )}
                    </RadioGroup>
                    {correctAnswer && (
                      <p className="text-xs text-gray-500 mt-2">
                        Correct answer: {correctAnswer}
                      </p>
                    )}
                  </div>
                );
              } else {
                // Return a warning for unrecognized element types
                return (
                  <div key={index} className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                    <p className="text-yellow-600 text-sm">Unknown element type: {elementType}</p>
                  </div>
                );
              }
            })}
          </div>
        );

      case 'matching':
        const matchingPairs = safeGetArray(section, 'matching_pairs');

        if (matchingPairs.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No matching questions available for this exercise.</p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {matchingPairs.map((pair, index) => {
              const question = safeGetString(pair, 'question', 'Question not available');
              const answer = safeGetString(pair, 'answer', 'No answer available');
              
              return (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-gray-800">{question}</p>
                    </div>
                    <div className="pl-4 border-l-2 border-blue-200">
                      <p className="text-sm text-blue-700 font-medium">Answer: {answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Content type "{contentType}" will be displayed here.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading lesson material...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Failed to Load Lesson</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Lesson Not Found</h3>
          <p className="text-muted-foreground">The requested lesson could not be found.</p>
        </div>
      </div>
    );
  }

  // If we have interactive content and a template, render the interactive lesson
  if (lesson.interactive_lesson_content && template) {
    // Defensive check for template structure
    if (!template.template_json || !template.template_json.sections) {
      return (
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Invalid Template Structure</h3>
            <p className="text-muted-foreground">The lesson template has an invalid structure.</p>
          </div>
        </div>
      );
    }

    const sections = safeGetArray(template.template_json, 'sections');

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Interactive Lesson Material Ready
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                This lesson has been personalized for {lesson.student.name} using the {template.name} template.
              </p>
            </div>
          </div>
        </div>

        {sections.map((section, index) => 
          renderTemplateSection(section, 0)
        )}
        
        <div className="flex justify-center pt-8">
          <Button size="lg" className="px-8">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Complete Lesson
          </Button>
        </div>
      </div>
    );
  }

  // Fall back to basic lesson plan view if no interactive content
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Lesson for {lesson.student.name}
        </h1>
        <Badge variant="outline" className="capitalize">
          {lesson.student.level} Level {lesson.student.target_language}
        </Badge>
      </div>

      {generatedLessons.length > 0 ? (
        <div className="space-y-6">
          {generatedLessons.map((lessonPlan, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-primary" />
                  {safeStringify(lessonPlan.title)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-blue-600" />
                    Objectives
                  </h4>
                  <ul className="space-y-2">
                    {Array.isArray(lessonPlan.objectives) && lessonPlan.objectives.map((objective, objIndex) => (
                      <li key={objIndex} className="flex items-start">
                        <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        <span>{safeStringify(objective)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-purple-600" />
                    Activities
                  </h4>
                  <ul className="space-y-2">
                    {Array.isArray(lessonPlan.activities) && lessonPlan.activities.map((activity, actIndex) => (
                      <li key={actIndex} className="flex items-start">
                        <ArrowRight className="w-4 h-4 mr-2 mt-0.5 text-purple-500 flex-shrink-0" />
                        <span>{safeStringify(activity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <BookOpen className="w-4 h-4 mr-2 text-green-600" />
                      Materials
                    </h4>
                    <ul className="space-y-2">
                      {Array.isArray(lessonPlan.materials) && lessonPlan.materials.map((material, matIndex) => (
                        <li key={matIndex} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          <span>{safeStringify(material)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-orange-600" />
                      Assessment
                    </h4>
                    <ul className="space-y-2">
                      {Array.isArray(lessonPlan.assessment) && lessonPlan.assessment.map((item, assIndex) => (
                        <li key={assIndex} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          <span>{safeStringify(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Lesson Content</h3>
          <p className="text-muted-foreground">
            This lesson doesn't have any generated content yet. Generate lesson plans first, then use "Use This Plan" to create interactive material.
          </p>
        </div>
      )}
    </div>
  );
}