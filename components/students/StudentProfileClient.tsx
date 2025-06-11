"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/main-layout";
import { Student } from "@/types";
import { languages } from "@/lib/sample-data";
import {
  Book,
  Calendar,
  Edit,
  GraduationCap,
  Languages as LanguagesIcon,
  Loader2,
  MessageSquare,
  Sparkles,
  Target,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import StudentForm from "@/components/students/StudentForm";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface LessonPlan {
  title: string;
  objectives: string[];
  activities: string[];
  materials: string[];
  assessment: string[];
}

interface UpcomingLesson {
  id: string;
  date: string;
  status: string;
  generated_lessons: string[] | null;
}

interface StudentProfileClientProps {
  student: Student;
}

export default function StudentProfileClient({ student }: StudentProfileClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLessons, setGeneratedLessons] = useState<LessonPlan[]>([]);
  const [upcomingLesson, setUpcomingLesson] = useState<UpcomingLesson | null>(null);
  const [loadingUpcomingLesson, setLoadingUpcomingLesson] = useState(true);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const getLanguageInfo = (code: string) => {
    return languages.find(lang => lang.code === code) || { code, name: code, flag: '🌐' };
  };

  // Load upcoming lesson and any existing generated lessons
  useEffect(() => {
    const loadUpcomingLesson = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Find the next upcoming lesson for this student
        const { data: lessons, error } = await supabase
          .from('lessons')
          .select('id, date, status, generated_lessons')
          .eq('student_id', student.id)
          .eq('tutor_id', user.id)
          .eq('status', 'upcoming')
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(1);

        if (error) {
          console.error('Error loading upcoming lesson:', error);
          return;
        }

        if (lessons && lessons.length > 0) {
          const lesson = lessons[0];
          setUpcomingLesson(lesson);

          // If the lesson has generated content, parse and display it
          if (lesson.generated_lessons && lesson.generated_lessons.length > 0) {
            try {
              const parsedLessons = lesson.generated_lessons.map((lessonStr: string) => 
                JSON.parse(lessonStr)
              );
              setGeneratedLessons(parsedLessons);
            } catch (parseError) {
              console.error('Error parsing generated lessons:', parseError);
            }
          }
        }
      } catch (error) {
        console.error('Error in loadUpcomingLesson:', error);
      } finally {
        setLoadingUpcomingLesson(false);
      }
    };

    loadUpcomingLesson();
  }, [student.id]);

  const handleGenerateLessons = async () => {
    setIsGenerating(true);
    
    try {
      console.log('🚀 Starting lesson generation for student:', student.id);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      console.log('✅ Session found, making request to edge function...');

      const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-lesson-plan`;
      console.log('📡 Function URL:', functionUrl);

      let requestBody;
      
      if (upcomingLesson) {
        // Update existing lesson
        requestBody = {
          lesson_id: upcomingLesson.id
        };
        console.log('🔄 Updating existing lesson:', upcomingLesson.id);
      } else {
        // Create new lesson (legacy mode)
        requestBody = {
          student_id: student.id
        };
        console.log('➕ Creating new lesson for student:', student.id);
      }

      console.log('📦 Request body:', requestBody);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📨 Response status:', response.status);
      console.log('📨 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error text:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Response data:', result);
      
      if (result.success && result.lessons) {
        setGeneratedLessons(result.lessons);
        
        // If we updated an existing lesson, refresh the upcoming lesson data
        if (result.updated && upcomingLesson) {
          setUpcomingLesson({
            ...upcomingLesson,
            generated_lessons: result.lessons.map((lesson: LessonPlan) => JSON.stringify(lesson))
          });
        }
        
        // If we created a new lesson, we might want to refresh the upcoming lesson
        if (result.created) {
          // Reload upcoming lesson data
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: lessons } = await supabase
              .from('lessons')
              .select('id, date, status, generated_lessons')
              .eq('student_id', student.id)
              .eq('tutor_id', user.id)
              .eq('status', 'upcoming')
              .gte('date', new Date().toISOString())
              .order('date', { ascending: true })
              .limit(1);

            if (lessons && lessons.length > 0) {
              setUpcomingLesson(lessons[0]);
            }
          }
        }
        
        const actionText = result.updated ? 'regenerated' : 'generated';
        toast.success(`AI lesson plans ${actionText} successfully!`);
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (error: any) {
      console.error('❌ Error generating lessons:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Failed to fetch')) {
        toast.error('Network error: Unable to connect to the lesson generation service. Please check your internet connection and try again.');
      } else if (error.message.includes('Not authenticated')) {
        toast.error('Authentication error: Please log out and log back in.');
      } else {
        toast.error(error.message || 'Failed to generate lesson plans. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const languageInfo = getLanguageInfo(student.target_language);

  const getButtonText = () => {
    if (isGenerating) {
      return upcomingLesson?.generated_lessons ? 'Regenerating...' : 'Generating...';
    }
    return upcomingLesson?.generated_lessons ? 'Regenerate Lesson Ideas' : 'Generate Lesson Ideas';
  };

  const getButtonIcon = () => {
    if (isGenerating) {
      return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
    }
    return upcomingLesson?.generated_lessons ? 
      <RefreshCw className="mr-2 h-4 w-4" /> : 
      <Target className="mr-2 h-4 w-4" />;
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={student.avatar_url || undefined} alt={student.name} />
              <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <LanguagesIcon className="h-4 w-4" />
                <span>{languageInfo.name}</span>
                <span>•</span>
                <Badge variant="outline" className="capitalize">
                  {student.level}
                </Badge>
              </div>
            </div>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Student Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="mr-2 h-5 w-5" />
                Learning Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">End Goals</h3>
                <p className="text-sm text-muted-foreground">
                  {student.end_goals || "No end goals specified"}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Learning Styles</h3>
                <div className="flex flex-wrap gap-2">
                  {student.learning_styles?.map((style) => (
                    <Badge key={style} variant="secondary">
                      {style}
                    </Badge>
                  )) || <span className="text-sm text-muted-foreground">No learning styles specified</span>}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Areas for Improvement</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Grammar Weaknesses
                      </h4>
                      <p className="text-sm">
                        {student.grammar_weaknesses || "None specified"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Vocabulary Gaps
                      </h4>
                      <p className="text-sm">
                        {student.vocabulary_gaps || "None specified"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Pronunciation Challenges
                      </h4>
                      <p className="text-sm">
                        {student.pronunciation_challenges || "None specified"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Conversational Fluency Barriers
                      </h4>
                      <p className="text-sm">
                        {student.conversational_fluency_barriers || "None specified"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Additional Notes</h3>
                <p className="text-sm text-muted-foreground">
                  {student.notes || "No additional notes"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lesson History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Book className="mr-2 h-5 w-5" />
                Lesson History
              </CardTitle>
              <CardDescription>Recent lessons and upcoming sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Next Lesson</h3>
                    {loadingUpcomingLesson ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading...</span>
                      </div>
                    ) : upcomingLesson ? (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {new Date(upcomingLesson.date).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {upcomingLesson.generated_lessons && (
                          <Badge variant="secondary" className="text-xs">
                            AI Plans Ready
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No upcoming lessons scheduled
                      </p>
                    )}
                  </div>
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Last Lesson</h3>
                    <p className="text-sm text-muted-foreground">
                      No previous lessons
                    </p>
                  </div>
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Lesson Architect */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5" />
              AI Lesson Architect
            </CardTitle>
            <CardDescription>
              Generate personalized lesson plans based on student profile and learning history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {upcomingLesson ? 
                    `Generate lesson ideas for ${student.name}'s upcoming lesson` :
                    `Generate new lesson ideas tailored to ${student.name}'s learning style and goals`
                  }
                </p>
                {upcomingLesson && (
                  <p className="text-xs text-muted-foreground">
                    Scheduled for {new Date(upcomingLesson.date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
              <Button
                onClick={handleGenerateLessons}
                disabled={isGenerating}
              >
                {getButtonIcon()}
                {getButtonText()}
              </Button>
            </div>

            {generatedLessons.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Generated Lesson Plans</h3>
                  {upcomingLesson?.generated_lessons && (
                    <Badge variant="outline" className="text-xs">
                      {upcomingLesson.generated_lessons.length} plans available
                    </Badge>
                  )}
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {generatedLessons.map((lesson, index) => (
                    <AccordionItem key={index} value={`lesson-${index}`}>
                      <AccordionTrigger className="text-left">
                        {lesson.title}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Lesson Objectives</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {lesson.objectives.map((objective: string, objIndex: number) => (
                              <li key={objIndex}>{objective}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Activities</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {lesson.activities.map((activity: string, actIndex: number) => (
                              <li key={actIndex}>{activity}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Materials Needed</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {lesson.materials.map((material: string, matIndex: number) => (
                              <li key={matIndex}>{material}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Assessment Ideas</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {lesson.assessment.map((item: string, assIndex: number) => (
                              <li key={assIndex}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </CardContent>
        </Card>

        <StudentForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          student={student}
        />
      </div>
    </MainLayout>
  );
}