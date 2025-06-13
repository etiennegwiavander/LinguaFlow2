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
  Copy,
  FileText,
  CheckCircle,
  Play,
  Clock,
  Lightbulb,
  X,
  BookOpen,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StudentForm from "@/components/students/StudentForm";
import LessonMaterialDisplay from "@/components/lessons/LessonMaterialDisplay";
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
  lesson_template_id: string | null;
  interactive_lesson_content: any | null;
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
  const [generationProgress, setGenerationProgress] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasGeneratedBefore, setHasGeneratedBefore] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("ai-architect");
  const [isGeneratingInteractive, setIsGeneratingInteractive] = useState(false);
  const [interactiveGenerationProgress, setInteractiveGenerationProgress] = useState("");

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
  const loadUpcomingLesson = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find the next upcoming lesson for this student
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('id, date, status, generated_lessons, lesson_template_id, interactive_lesson_content')
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
            setHasGeneratedBefore(true);
          } catch (parseError) {
            console.error('Error parsing generated lessons:', parseError);
          }
        }
      }

      // Check if user has generated lessons before (for onboarding)
      const { data: allLessons } = await supabase
        .from('lessons')
        .select('generated_lessons')
        .eq('tutor_id', user.id)
        .not('generated_lessons', 'is', null);

      if (!allLessons || allLessons.length === 0) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error in loadUpcomingLesson:', error);
    } finally {
      setLoadingUpcomingLesson(false);
    }
  };

  useEffect(() => {
    loadUpcomingLesson();
  }, [student.id]);

  const handleGenerateLessons = async () => {
    setIsGenerating(true);
    setGenerationProgress("Analyzing learning profile...");
    
    try {
      console.log('🚀 Starting lesson generation for student:', student.id);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      console.log('✅ Session found, making request to edge function...');

      // Update progress message
      setTimeout(() => setGenerationProgress(`Crafting personalized lesson ideas for ${student.name}...`), 1000);
      setTimeout(() => setGenerationProgress("Creating engaging activities and materials..."), 2000);

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
        setHasGeneratedBefore(true);
        setShowOnboarding(false);
        
        // If we updated an existing lesson, refresh the upcoming lesson data
        if (result.updated && upcomingLesson) {
          setUpcomingLesson({
            ...upcomingLesson,
            generated_lessons: result.lessons.map((lesson: LessonPlan) => JSON.stringify(lesson)),
            lesson_template_id: result.lesson_template_id || upcomingLesson.lesson_template_id
          });
        }
        
        // If we created a new lesson, we might want to refresh the upcoming lesson
        if (result.created) {
          // Reload upcoming lesson data
          await loadUpcomingLesson();
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
      setGenerationProgress("");
    }
  };

  const copyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(`${type} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyLessonPlan = async (lesson: LessonPlan) => {
    const content = `
${lesson.title}

OBJECTIVES:
${lesson.objectives.map(obj => `• ${obj}`).join('\n')}

ACTIVITIES:
${lesson.activities.map(act => `• ${act}`).join('\n')}

MATERIALS:
${lesson.materials.map(mat => `• ${mat}`).join('\n')}

ASSESSMENT:
${lesson.assessment.map(ass => `• ${ass}`).join('\n')}
    `.trim();
    
    await copyToClipboard(content, 'Lesson plan');
  };

  const handleUseLessonPlan = async (lessonIndex: number) => {
    if (!upcomingLesson) {
      toast.error('No lesson available to generate interactive material for');
      return;
    }

    setIsGeneratingInteractive(true);
    setInteractiveGenerationProgress("Preparing interactive lesson material...");

    try {
      console.log('🎯 Generating interactive material for lesson plan:', lessonIndex);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Update progress messages
      setTimeout(() => setInteractiveGenerationProgress("Selecting appropriate lesson template..."), 1000);
      setTimeout(() => setInteractiveGenerationProgress("Creating interactive exercises and activities..."), 2000);
      setTimeout(() => setInteractiveGenerationProgress("Personalizing content for " + student.name + "..."), 3000);

      const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-interactive-material`;
      
      const requestBody = {
        lesson_id: upcomingLesson.id,
        selected_lesson_plan_index: lessonIndex
      };

      console.log('📦 Interactive material request:', requestBody);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Interactive material generation error:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        throw new Error(errorData.error || `Failed to generate interactive material: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Interactive material generated:', result);
      
      if (result.success) {
        // Update the upcoming lesson state with the new interactive content
        setUpcomingLesson({
          ...upcomingLesson,
          interactive_lesson_content: result.interactive_content,
          lesson_template_id: result.lesson_template_id
        });

        // Refresh the upcoming lesson data to ensure state consistency
        await loadUpcomingLesson();

        // Set the selected lesson ID and switch to the lesson material tab
        setSelectedLessonId(upcomingLesson.id);
        setActiveTab("lesson-material");
        
        toast.success(`Interactive lesson material created successfully using ${result.template_name}!`);
      } else {
        throw new Error(result.error || 'Failed to generate interactive material');
      }
    } catch (error: any) {
      console.error('❌ Error generating interactive material:', error);
      toast.error(error.message || 'Failed to generate interactive lesson material. Please try again.');
    } finally {
      setIsGeneratingInteractive(false);
      setInteractiveGenerationProgress("");
    }
  };

  const languageInfo = getLanguageInfo(student.target_language);

  const getButtonText = () => {
    if (isGenerating) {
      return upcomingLesson?.generated_lessons ? 'Regenerating...' : 'Generating...';
    }
    
    if (upcomingLesson) {
      const lessonDate = new Date(upcomingLesson.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      return upcomingLesson.generated_lessons ? 
        `Regenerate Ideas for Next Lesson (${lessonDate})` : 
        `Generate Ideas for Next Lesson (${lessonDate})`;
    }
    
    return hasGeneratedBefore ? 'Generate New Lesson Ideas' : 'Generate Lesson Ideas';
  };

  const getButtonIcon = () => {
    if (isGenerating) {
      return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
    }
    return upcomingLesson?.generated_lessons ? 
      <RefreshCw className="mr-2 h-4 w-4" /> : 
      <Target className="mr-2 h-4 w-4" />;
  };

  const getProgressMessage = () => {
    if (generationProgress) return generationProgress;
    if (isGenerating) return "This may take a moment...";
    return "";
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ai-architect" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Lesson Architect</span>
              <span className="sm:hidden">AI Plans</span>
            </TabsTrigger>
            <TabsTrigger value="lesson-material" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Lesson Material</span>
              <span className="sm:hidden">Material</span>
            </TabsTrigger>            
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Lesson History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>            
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Learning Profile</span>
              <span className="sm:hidden">Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* AI Lesson Architect Tab */}
          <TabsContent value="ai-architect" className="space-y-6">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-primary" />
                  AI Lesson Architect
                  {showOnboarding && (
                    <Badge variant="secondary" className="ml-2 animate-pulse">
                      <Lightbulb className="w-3 h-3 mr-1" />
                      New!
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Generate personalized lesson plans based on {student.name}'s profile and learning history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Onboarding Alert for First-Time Users */}
                {showOnboarding && !hasGeneratedBefore && (
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <strong>Welcome to AI Lesson Architect!</strong>
                          <p className="mt-1 text-sm">
                            Instantly create tailored lesson plans for {student.name}! Our AI analyzes their profile to suggest objectives, activities, and materials. Click the button below to get started.
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowOnboarding(false)}
                          className="ml-2 h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-primary/20">
                  <div className="space-y-2 flex-1">
                    <p className="font-medium">
                      {upcomingLesson ? 
                        `Generate lesson ideas for ${student.name}'s upcoming lesson` :
                        `Generate new lesson ideas tailored to ${student.name}'s learning style and goals`
                      }
                    </p>
                    {upcomingLesson && (
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Scheduled for {new Date(upcomingLesson.date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Generate 3 personalized lesson plans based on {student.name}'s profile
                    </p>
                    {isGenerating && (
                      <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span>{getProgressMessage()}</span>
                      </div>
                    )}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleGenerateLessons}
                          disabled={isGenerating}
                          size="lg"
                          className="ml-4 min-w-[200px]"
                        >
                          {getButtonIcon()}
                          {getButtonText()}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {upcomingLesson?.generated_lessons ? 
                            'Create new lesson ideas for this student' :
                            'Generate AI-powered lesson plans tailored to this student'
                          }
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {generatedLessons.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                        {generatedLessons.length} Lesson Plans Ready!
                      </h3>
                      {upcomingLesson?.generated_lessons && (
                        <Badge variant="outline" className="text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Generated
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
                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
                              <Button 
                                size="sm" 
                                className="flex-1 min-w-[120px]"
                                onClick={() => handleUseLessonPlan(index)}
                                disabled={!upcomingLesson || isGeneratingInteractive}
                              >
                                {isGeneratingInteractive ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Use This Plan
                                  </>
                                )}
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 min-w-[120px]">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Plan
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => copyLessonPlan(lesson)}
                                className="flex-1 min-w-[120px]"
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy to Clipboard
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 min-w-[120px]">
                                <FileText className="w-4 h-4 mr-2" />
                                Export
                              </Button>
                            </div>

                            {/* Interactive Generation Progress */}
                            {isGeneratingInteractive && (
                              <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span>{interactiveGenerationProgress}</span>
                              </div>
                            )}

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
                    <h3 className="font-medium text-lg mb-2">Ready to Create Amazing Lessons?</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                      Our AI will analyze {student.name}'s learning profile and create personalized lesson plans with objectives, activities, materials, and assessment ideas.
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        Tailored Objectives
                      </div>
                      <div className="flex items-center">
                        <Sparkles className="w-4 h-4 mr-1" />
                        Engaging Activities
                      </div>
                      <div className="flex items-center">
                        <Book className="w-4 h-4 mr-1" />
                        Resource Lists
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lesson Material Tab */}
          <TabsContent value="lesson-material" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Interactive Lesson Material
                </CardTitle>
                <CardDescription>
                  Personalized lesson content for {student.name} with interactive exercises
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedLessonId ? (
                  <LessonMaterialDisplay lessonId={selectedLessonId} />
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="font-medium text-lg mb-2">No Lesson Selected</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                      Generate lesson plans in the AI Lesson Architect tab and click "Use This Plan" to view the interactive lesson material here.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("ai-architect")}
                    >
                      Go to AI Lesson Architect
                    </Button>
                  </div>
                )}
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
                          {upcomingLesson.interactive_lesson_content && (
                            <Badge variant="outline" className="text-xs">
                              <BookOpen className="w-3 h-3 mr-1" />
                              Interactive Material Ready
                            </Badge>
                          )}
                          {upcomingLesson.lesson_template_id && (
                            <Badge variant="outline" className="text-xs">
                              <BookOpen className="w-3 h-3 mr-1" />
                              Template Applied
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