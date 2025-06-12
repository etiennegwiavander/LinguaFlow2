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
  User,
  Brain,
  History,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
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

        {/* Tabbed Content */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Learning Profile</span>
              <span className="sm:hidden">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Lesson History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
            <TabsTrigger value="ai-architect" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Lesson Architect</span>
              <span className="sm:hidden">AI Plans</span>
            </TabsTrigger>
          </TabsList>

          {/* Learning Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Learning Profile
                </CardTitle>
                <CardDescription>
                  Comprehensive overview of {student.name}'s learning journey and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-medium mb-3 text-lg">Learning Goals</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">End Goals</h4>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                          {student.end_goals || "No end goals specified"}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Learning Styles</h4>
                        <div className="flex flex-wrap gap-2">
                          {student.learning_styles?.map((style) => (
                            <Badge key={style} variant="secondary">
                              {style}
                            </Badge>
                          )) || <span className="text-sm text-muted-foreground">No learning styles specified</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3 text-lg">Language Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-md">
                        <span className="text-2xl">{languageInfo.flag}</span>
                        <div>
                          <p className="font-medium">{languageInfo.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {student.level} Level
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Areas for Improvement</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-red-600 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          Grammar Weaknesses
                        </h4>
                        <p className="text-sm">
                          {student.grammar_weaknesses || "None specified"}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-orange-600 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                          Vocabulary Gaps
                        </h4>
                        <p className="text-sm">
                          {student.vocabulary_gaps || "None specified"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-blue-600 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          Pronunciation Challenges
                        </h4>
                        <p className="text-sm">
                          {student.pronunciation_challenges || "None specified"}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-purple-600 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
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
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      {student.notes || "No additional notes"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lesson History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Book className="mr-2 h-5 w-5" />
                  Lesson History
                </CardTitle>
                <CardDescription>Recent lessons and upcoming sessions with {student.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg">Next Lesson</h3>
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    {loadingUpcomingLesson ? (
                      <div className="flex items-center space-x-2 p-4 border rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading...</span>
                      </div>
                    ) : upcomingLesson ? (
                      <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <div className="space-y-2">
                          <p className="font-medium">
                            {new Date(upcomingLesson.date).toLocaleDateString(undefined, {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(upcomingLesson.date).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {upcomingLesson.generated_lessons && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI Plans Ready
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          No upcoming lessons scheduled
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg">Last Lesson</h3>
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        No previous lessons recorded
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-4 text-lg">Lesson Statistics</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">0</div>
                      <div className="text-sm text-muted-foreground">Total Lessons</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">0</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {upcomingLesson ? '1' : '0'}
                      </div>
                      <div className="text-sm text-muted-foreground">Upcoming</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Lesson Architect Tab */}
          <TabsContent value="ai-architect" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5" />
                  AI Lesson Architect
                </CardTitle>
                <CardDescription>
                  Generate personalized lesson plans based on {student.name}'s profile and learning history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {upcomingLesson ? 
                        `Generate lesson ideas for ${student.name}'s upcoming lesson` :
                        `Generate new lesson ideas tailored to ${student.name}'s learning style and goals`
                      }
                    </p>
                    {upcomingLesson && (
                      <p className="text-sm text-muted-foreground">
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
                    size="lg"
                  >
                    {getButtonIcon()}
                    {getButtonText()}
                  </Button>
                </div>

                {generatedLessons.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg">Generated Lesson Plans</h3>
                      {upcomingLesson?.generated_lessons && (
                        <Badge variant="outline" className="text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {upcomingLesson.generated_lessons.length} plans available
                        </Badge>
                      )}
                    </div>
                    
                    <Accordion type="single" collapsible className="w-full">
                      {generatedLessons.map((lesson, index) => (
                        <AccordionItem key={index} value={`lesson-${index}`}>
                          <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">{index + 1}</span>
                              </div>
                              <span className="font-medium">{lesson.title}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-6 pt-4">
                            <div className="grid gap-6 md:grid-cols-2">
                              <div>
                                <h4 className="font-medium mb-3 flex items-center">
                                  <Target className="w-4 h-4 mr-2 text-blue-600" />
                                  Lesson Objectives
                                </h4>
                                <ul className="space-y-2">
                                  {lesson.objectives.map((objective: string, objIndex: number) => (
                                    <li key={objIndex} className="text-sm flex items-start">
                                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                      {objective}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-medium mb-3 flex items-center">
                                  <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                                  Activities
                                </h4>
                                <ul className="space-y-2">
                                  {lesson.activities.map((activity: string, actIndex: number) => (
                                    <li key={actIndex} className="text-sm flex items-start">
                                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                      {activity}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-medium mb-3 flex items-center">
                                  <Book className="w-4 h-4 mr-2 text-green-600" />
                                  Materials Needed
                                </h4>
                                <ul className="space-y-2">
                                  {lesson.materials.map((material: string, matIndex: number) => (
                                    <li key={matIndex} className="text-sm flex items-start">
                                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                      {material}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-medium mb-3 flex items-center">
                                  <GraduationCap className="w-4 h-4 mr-2 text-orange-600" />
                                  Assessment Ideas
                                </h4>
                                <ul className="space-y-2">
                                  {lesson.assessment.map((item: string, assIndex: number) => (
                                    <li key={assIndex} className="text-sm flex items-start">
                                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}

                {generatedLessons.length === 0 && !isGenerating && (
                  <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-2">No Lesson Plans Generated Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Click the generate button above to create personalized lesson plans for {student.name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <StudentForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          student={student}
        />
      </div>
    </MainLayout>
  );
}