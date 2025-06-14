/*
  # Updated LessonMaterialDisplay.tsx
  
  1. Changes
    - Added defensive checks for array properties to prevent undefined errors
    - Enhanced error handling for malformed data structures
    - Added fallback content when data is missing or invalid
    
  2. Flow
    - Validates array properties before mapping
    - Provides meaningful fallback messages
    - Logs warnings for debugging purposes
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
        console.log('🔍 Fetching lesson data for ID:', lessonId);

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
          console.error('❌ Lesson fetch error:', lessonError);
          throw new Error('Failed to fetch lesson data');
        }

        if (!lessonData) {
          throw new Error('Lesson not found');
        }

        console.log('✅ Lesson data fetched:', lessonData);
        setLesson(lessonData as Lesson);

        // Check if we have interactive lesson content
        if (lessonData.interactive_lesson_content) {
          console.log('✅ Interactive lesson content found');
          
          // If we have a lesson template ID, fetch the template structure
          if (lessonData.lesson_template_id) {
            console.log('🎯 Fetching lesson template:', lessonData.lesson_template_id);
            
            const { data: templateData, error: templateError } = await supabase
              .from('lesson_templates')
              .select('*')
              .eq('id', lessonData.lesson_template_id)
              .single();

            if (templateError) {
              console.error('⚠️ Could not fetch lesson template:', templateError);
            } else {
              console.log('✅ Template data fetched:', templateData);
              // Use the interactive content as the template JSON
              setTemplate({
                ...templateData,
                template_json: lessonData.interactive_lesson_content
              } as LessonTemplate);
            }
          } else {
            // Create a mock template with the interactive content
            setTemplate({
              id: 'interactive',
              name: 'Interactive Lesson',
              category: 'Interactive',
              level: lessonData.student.level,
              template_json: lessonData.interactive_lesson_content
            } as LessonTemplate);
          }
        } else {
          // Fall back to generated lessons if no interactive content
          console.log('📝 No interactive content, using generated lessons');
          
          if (lessonData.generated_lessons && lessonData.generated_lessons.length > 0) {
            try {
              const parsedLessons = lessonData.generated_lessons.map((lessonStr: string) => 
                JSON.parse(lessonStr)
              );
              setGeneratedLessons(parsedLessons);
              console.log('✅ Generated lessons parsed:', parsedLessons.length);
            } catch (parseError) {
              console.error('❌ Error parsing generated lessons:', parseError);
              setError('Failed to parse lesson content');
              return;
            }
          }

          // Fetch lesson template if available for fallback
          if (lessonData.lesson_template_id) {
            console.log('🎯 Fetching lesson template for fallback:', lessonData.lesson_template_id);
            
            const { data: templateData, error: templateError } = await supabase
              .from('lesson_templates')
              .select('*')
              .eq('id', lessonData.lesson_template_id)
              .single();

            if (templateError) {
              console.error('⚠️ Could not fetch lesson template:', templateError);
            } else {
              console.log('✅ Template data fetched for fallback:', templateData);
              setTemplate(templateData as LessonTemplate);
            }
          }
        }

      } catch (err: any) {
        console.error('❌ Error in fetchLessonData:', err);
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

    const colors = template.template_json.colors;
    const currentLesson = generatedLessons[lessonIndex];

    // Get background color class
    const getBgColor = (colorVar?: string) => {
      if (!colorVar) return '';
      return colors[colorVar as keyof typeof colors] || '';
    };

    switch (section.type) {
      case 'title':
        return (
          <div key={section.id} className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {section.title}
            </h1>
            {section.subtitle && (
              <p className="text-xl text-gray-600">{section.subtitle}</p>
            )}
          </div>
        );

      case 'info_card':
        const objectives = Array.isArray(section.items) ? section.items : [];

        return (
          <Card key={section.id} className={`mb-6 ${getBgColor(section.background_color_var)}`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {typeof section.content === 'string' ? (
                <p className="text-sm">{section.content}</p>
              ) : (
                <ul className="space-y-2">
                  {objectives.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
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
          <Card key={section.id} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                {section.title}
              </CardTitle>
              {section.instruction && (
                <div className={`p-3 rounded-lg ${getBgColor(section.instruction_bg_color_var)}`}>
                  <p className="text-sm font-medium">{section.instruction}</p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {renderExerciseContent(section, lessonIndex)}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const renderExerciseContent = (section: TemplateSection, lessonIndex: number) => {
    const currentLesson = generatedLessons[lessonIndex];

    switch (section.content_type) {
      case 'list':
        const items = Array.isArray(section.items) ? section.items : [];

        if (items.length === 0) {
          console.warn(`No items found for list section: ${section.id}`);
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No items available for this exercise.</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.map((item: string, index: number) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg text-center">
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <div className="prose max-w-none">
            <p>{section.content || 'Content will be displayed here.'}</p>
          </div>
        );

      case 'vocabulary_matching':
        const vocabularyItems = Array.isArray(section.vocabulary_items) ? section.vocabulary_items : [];

        if (vocabularyItems.length === 0) {
          console.warn(`No vocabulary items found for section: ${section.id}`);
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
                    src={item.image_url} 
                    alt={item.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <h4 className="font-semibold">{item.name}</h4>
                  <p className="text-sm text-gray-600">{item.prompt}</p>
                </div>
                <Button size="sm" variant="outline">
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        );

      case 'full_dialogue':
        const dialogueLines = Array.isArray(section.dialogue_lines) ? section.dialogue_lines : [];

        if (dialogueLines.length === 0) {
          console.warn(`No dialogue lines found for section: ${section.id}`);
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No dialogue content available for this exercise.</p>
            </div>
          );
        }

        return (
          <div className="space-y-3">
            {dialogueLines.map((line, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  line.character === 'Tutor' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <span className={`text-xs font-bold ${
                    line.character === 'Tutor' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {line.character ? line.character[0] : '?'}
                  </span>
                </div>
                <div className={`flex-1 p-3 rounded-lg ${
                  line.character === 'Tutor' ? 'bg-green-50' : 'bg-blue-50'
                }`}>
                  <p className={`font-medium ${
                    line.character === 'Tutor' ? 'text-green-800' : 'text-blue-800'
                  }`}>
                    {line.character || 'Speaker'}:
                  </p>
                  <p>{line.text || 'No text available'}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'matching':
        // Add defensive check for matching_pairs
        if (!Array.isArray(section.matching_pairs) || section.matching_pairs.length === 0) {
          console.warn(`No matching pairs found for section: ${section.id}`);
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No matching questions available for this exercise.</p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {section.matching_pairs.map((pair, index) => (
              <div key={index} className="border rounded-lg p-4">
                <p className="font-medium mb-3">{pair.question || 'Question not available'}</p>
                <RadioGroup 
                  onValueChange={(value) => handleAnswerChange(`${section.id}_match_${index}`, value)}
                >
                  {Array.isArray(pair.answers) && pair.answers.map((answer: string, ansIndex: number) => (
                    <div key={ansIndex} className="flex items-center space-x-2">
                      <RadioGroupItem value={answer} id={`${section.id}_${index}_${ansIndex}`} />
                      <Label htmlFor={`${section.id}_${index}_${ansIndex}`}>{answer}</Label>
                    </div>
                  ))}
                  {(!Array.isArray(pair.answers) || pair.answers.length === 0) && (
                    <p className="text-sm text-gray-500">No answer options available</p>
                  )}
                </RadioGroup>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Content type "{section.content_type}" will be displayed here.</p>
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

        {Array.isArray(template.template_json.sections) && template.template_json.sections.map((section) => 
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
                  {lessonPlan.title}
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
                        <span>{objective}</span>
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
                        <span>{activity}</span>
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
                          <span>{material}</span>
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
                          <span>{item}</span>
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