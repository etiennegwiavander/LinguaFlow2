"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/main-layout";
import { Student, SubTopic } from "@/types";
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
  Globe,
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
import SubTopicSelectionDialog from "@/components/students/SubTopicSelectionDialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface LessonPlan {
  title: string;
  objectives: string[];
  activities: string[];
  materials: string[];
  assessment: string[];
  sub_topics?: SubTopic[];
}

interface UpcomingLesson {
  id: string;
  date: string;
  status: string;
  generated_lessons: string[] | null;
  sub_topics: SubTopic[] | null;
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
  const [isSubTopicDialogOpen, setIsSubTopicDialogOpen] = useState(false);

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
      if (!user) {
        return;
      }

      // Find the most recent upcoming lesson for this student
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('id, date, status, generated_lessons, sub_topics, lesson_template_id, interactive_lesson_content')
        .eq('student_id', student.id)
        .eq('tutor_id', user.id)
        .eq('status', 'upcoming')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
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
            // Handle parse error silently
          }
        }
      } else {
        setUpcomingLesson(null);
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
      // Handle error silently
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Update progress message
      setTimeout(() => setGenerationProgress(`Crafting personalized lesson ideas for ${student.name}...`), 1000);
      setTimeout(() => setGenerationProgress("Creating engaging activities and materials..."), 2000);
      setTimeout(() => setGenerationProgress("Generating focused sub-topics..."), 3000);

      const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-lesson-plan`;

      let requestBody;
      
      if (upcomingLesson) {
        // Update existing lesson
        requestBody = {
          lesson_id: upcomingLesson.id
        };
      } else {
        // Create new lesson (legacy mode)
        requestBody = {
          student_id: student.id
        };
      }

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
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success && result.lessons) {
        setGeneratedLessons(result.lessons);
        setHasGeneratedBefore(true);
        setShowOnboarding(false);
        
        // If we updated an existing lesson, refresh the upcoming lesson data
        if (result.updated && upcomingLesson) {
          setUpcomingLesson({
            ...upcomingLesson,
            generated_lessons: result.lessons.map((lesson: LessonPlan) => JSON.stringify(lesson)),
            sub_topics: result.sub_topics || null,
            lesson_template_id: result.lesson_template_id || upcomingLesson.lesson_template_id
          });
        }
        
        // If we created a new lesson, we might want to refresh the upcoming lesson
        if (result.created) {
          await loadUpcomingLesson();
        }
        
        const actionText = result.updated ? 'regenerated' : 'generated';
        toast.success(`AI lesson plans ${actionText} successfully with ${result.sub_topics?.length || 0} sub-topics!`);
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (error: any) {
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

    // Get sub-topics directly from upcomingLesson
    const subTopics = upcomingLesson.sub_topics || [];

    if (!subTopics || subTopics.length === 0) {
      toast.error('No sub-topics available. Please regenerate lesson plans.');
      return;
    }

    // Open the sub-topic selection dialog
    setIsSubTopicDialogOpen(true);
  };

  const handleSelectSubTopic = async (subTopic: SubTopic) => {
    if (!upcomingLesson) {
      toast.error('No lesson available to generate interactive material for');
      return;
    }

    setIsGeneratingInteractive(true);
    setInteractiveGenerationProgress("Preparing interactive lesson material...");
    setIsSubTopicDialogOpen(false);

    try {
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
        selected_sub_topic: subTopic
      };

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
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        throw new Error(errorData.error || `Failed to generate interactive material: ${errorText}`);
      }

      const result = await response.json();
      
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
        
        toast.success(`Interactive lesson material created successfully for "${subTopic.title}" using ${result.template_name}!`);
      } else {
        throw new Error(result.error || 'Failed to generate interactive material');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate interactive lesson material. Please try again.');
    } finally {
      setIsGeneratingInteractive(false);
      setInteractiveGenerationProgress("");
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getDisplayName = () => {
    return student.name.split(' ')[0]; // First name only
  };

  const languageInfo = getLanguageInfo(student.target_language);
  const nativeLanguageInfo = student.native_language ? getLanguageInfo(student.native_language) : null;

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

  // Get sub-topics directly from upcomingLesson
  const availableSubTopics = upcomingLesson?.sub_topics || [];

  return (
    <MainLayout>
      <div className="space-y-8 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 ring-4 ring-cyber-400/20">
              <AvatarImage src={student.avatar_url || undefined} alt={student.name} />
              <AvatarFallback className="bg-gradient-to-br from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 text-lg">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="gradient-text">{student.name}</span>
              </h1>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <LanguagesIcon className="h-4 w-4" />
                <span>{languageInfo.name}</span>
                <span>•</span>
                <Badge variant="outline" className="capitalize border-cyber-400/30">
                  {student.level}
                </Badge>
                {nativeLanguageInfo && (
                  <>
                    <span>•</span>
                    <span className="text-xs">Native: {nativeLanguageInfo.flag} {nativeLanguageInfo.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          
          <TabsList className="grid w-full grid-cols-4 glass-effect border-cyber-400/20">
            <TabsTrigger value="ai-architect" className="flex items-center space-x-2 data-[state=active]:bg-cyber-400/20">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Lesson Architect</span>
              <span className="sm:hidden">AI Plans</span>
            </TabsTrigger>
            <TabsTrigger value="lesson-material" className="flex items-center space-x-2 data-[state=active]:bg-cyber-400/20">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Lesson Material</span>
              <span className="sm:hidden">Material</span>
            </TabsTrigger>            
            <TabsTrigger value="history" className="flex items-center space-x-2 data-[state=active]:bg-cyber-400/20">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Lesson History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>            
            <TabsTrigger value="profile" className="flex items-center space-x-2 data-[state=active]:bg-cyber-400/20">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Learning Profile</span>
              <span className="sm:hidden">Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* AI Lesson Architect Tab */}
          <TabsContent value="ai-architect" className="space-y-6 animate-scale-in">
            <Card className="floating-card glass-effect border-cyber-400/20 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-cyber-400" />
                  AI Lesson Architect
                  {showOnboarding && (
                    <Badge variant="secondary" className="ml-2 animate-pulse">
                      <Lightbulb className="w-3 h-3 mr-1" />
                      New!
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Generate personalized lesson plans with focused sub-topics based on {student.name}'s profile and learning history
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
                            Instantly create tailored lesson plans with focused sub-topics for {student.name}! Our AI analyzes their profile to suggest objectives, activities, materials, and specific sub-topics you can turn into interactive lessons.
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

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-cyber-400/20">
                  <div className="space-y-2 flex-1">
                    <p className="font-medium">
                      {upcomingLesson ? 
                        `Generate lesson ideas with focused sub-topics for ${student.name}'s upcoming lesson` :
                        `Generate new lesson ideas with sub-topics tailored to ${student.name}'s learning style and goals`
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
                      Generate 3 personalized lesson plans with focused sub-topics based on {student.name}'s profile
                    </p>
                    {isGenerating && (
                      <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span>{getProgressMessage()}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 lg:mt-0 lg:ml-4 w-full lg:w-auto">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleGenerateLessons}
                            disabled={isGenerating}
                            size="lg"
                            className="w-full bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300"
                          >
                            {getButtonIcon()}
                            {getButtonText()}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {upcomingLesson?.generated_lessons ? 
                              'Create new lesson ideas with sub-topics for this student' :
                              'Generate AI-powered lesson plans with focused sub-topics tailored to this student'
                            }
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>


                {generatedLessons.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                        {generatedLessons.length} Lesson Plans Ready!
                      </h3>
                      <div className="flex items-center space-x-2">
                        {upcomingLesson?.generated_lessons && (
                          <Badge variant="outline" className="text-xs border-cyber-400/30">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI Generated
                          </Badge>
                        )}
                        {availableSubTopics.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Target className="w-3 h-3 mr-1" />
                            {availableSubTopics.length} Sub-topics
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Accordion type="single" collapsible className="w-full">
                      {generatedLessons.map((lesson, index) => {
                        return (
                          <AccordionItem key={index} value={`lesson-${index}`}>
                            <AccordionTrigger className="text-left hover:no-underline">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-cyber-400/20 to-neon-400/20 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-bold text-cyber-600 dark:text-cyber-400">{index + 1}</span>
                                </div>
                                <span className="font-medium">{lesson.title}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-6 pt-4">
                              {/* Action Buttons */}
                              <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-r from-cyber-50/50 to-neon-50/50 dark:from-cyber-900/20 dark:to-neon-900/20 rounded-lg border border-cyber-400/20">
                                <Button 
                                  size="sm" 
                                  className="flex-1 min-w-[120px] bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0"
                                  onClick={() => handleUseLessonPlan(index)}
                                  disabled={!upcomingLesson || isGeneratingInteractive || !availableSubTopics.length}
                                >
                                  {isGeneratingInteractive ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Creating...
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-4 h-4 mr-2" />
                                      Choose Sub-topic
                                    </>
                                  )}
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1 min-w-[120px] border-cyber-400/30 hover:bg-cyber-400/10">
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Plan
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => copyLessonPlan(lesson)}
                                  className="flex-1 min-w-[120px] border-cyber-400/30 hover:bg-cyber-400/10"
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy to Clipboard
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1 min-w-[120px] border-cyber-400/30 hover:bg-cyber-400/10">
                                  <FileText className="w-4 h-4 mr-2" />
                                  Export
                                </Button>
                              </div>

                              {/* Interactive Generation Progress */}
                              {isGeneratingInteractive && (
                                <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
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
                        );
                      })}
                    </Accordion>
                  </div>
                )}

                {generatedLessons.length === 0 && !isGenerating && (
                  <div className="text-center py-12 border-2 border-dashed border-cyber-400/20 rounded-lg">
                    <Brain className="h-12 w-12 text-cyber-400 mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-2">Ready to Create Amazing Lessons?</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                      Our AI will analyze {student.name}'s learning profile and create personalized lesson plans with focused sub-topics, objectives, activities, materials, and assessment ideas.
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
                      <div className="flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        Focused Sub-topics
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lesson Material Tab */}
          <TabsContent value="lesson-material" className="space-y-6 animate-scale-in">
            <Card className="floating-card glass-effect border-cyber-400/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-cyber-400" />
                  Interactive Lesson Material
                </CardTitle>
                <CardDescription>
                  Personalized lesson content for {student.name} with interactive exercises
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedLessonId ? (
                  <LessonMaterialDisplay 
                    lessonId={selectedLessonId} 
                    studentNativeLanguage={student.native_language}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-cyber-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-cyber-400" />
                    </div>
                    <h3 className="font-medium text-lg mb-2">No Lesson Selected</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                      Generate lesson plans in the AI Lesson Architect tab, then choose a sub-topic to create interactive lesson material here.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("ai-architect")}
                      className="border-cyber-400/30 hover:bg-cyber-400/10"
                    >
                      Go to AI Lesson Architect
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lesson History Tab */}
          <TabsContent value="history" className="space-y-6 animate-scale-in">
            <Card className="floating-card glass-effect border-cyber-400/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Book className="mr-2 h-5 w-5 text-cyber-400" />
                  Lesson History
                </CardTitle>
                <CardDescription>Recent lessons and upcoming sessions with {student.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg">Next Lesson</h3>
                      <Calendar className="h-5 w-5 text-cyber-400" />
                    </div>
                    {loadingUpcomingLesson ? (
                      <div className="flex items-center space-x-2 p-4 border border-cyber-400/20 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin text-cyber-400" />
                        <span className="text-sm text-muted-foreground">Loading...</span>
                      </div>
                    ) : upcomingLesson ? (
                      <div className="p-4 border border-cyber-400/20 rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
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
                          {upcomingLesson.sub_topics && upcomingLesson.sub_topics.length > 0 && (
                            <Badge variant="outline" className="text-xs border-cyber-400/30">
                              <Target className="w-3 h-3 mr-1" />
                              {upcomingLesson.sub_topics.length} Sub-topics
                            </Badge>
                          )}
                          {upcomingLesson.interactive_lesson_content && (
                            <Badge variant="outline" className="text-xs border-cyber-400/30">
                              <BookOpen className="w-3 h-3 mr-1" />
                              Interactive Material Ready
                            </Badge>
                          )}
                          {upcomingLesson.lesson_template_id && (
                            <Badge variant="outline" className="text-xs border-cyber-400/30">
                              <BookOpen className="w-3 h-3 mr-1" />
                              Template Applied
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border border-cyber-400/20 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          No upcoming lessons scheduled
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg">Last Lesson</h3>
                      <MessageSquare className="h-5 w-5 text-cyber-400" />
                    </div>
                    <div className="p-4 border border-cyber-400/20 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        No previous lessons recorded
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-cyber-400/20" />

                <div>
                  <h3 className="font-medium mb-4 text-lg">Lesson Statistics</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 border border-cyber-400/20 rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
                      <div className="text-2xl font-bold gradient-text">0</div>
                      <div className="text-sm text-muted-foreground">Total Lessons</div>
                    </div>
                    <div className="text-center p-4 border border-cyber-400/20 rounded-lg bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">0</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center p-4 border border-cyber-400/20 rounded-lg bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
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
          <TabsContent value="profile" className="space-y-6 animate-scale-in">
            <Card className="floating-card glass-effect border-cyber-400/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="mr-2 h-5 w-5 text-cyber-400" />
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
                        <p className="text-sm text-muted-foreground bg-gradient-to-r from-cyber-50/50 to-neon-50/50 dark:from-cyber-900/20 dark:to-neon-900/20 p-3 rounded-md border border-cyber-400/20">
                          {student.end_goals || "No end goals specified"}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Learning Styles</h4>
                        <div className="flex flex-wrap gap-2">
                          {student.learning_styles?.map((style) => (
                            <Badge key={style} variant="secondary" className="bg-gradient-to-r from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 border-cyber-400/30">
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
                      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-cyber-50/50 to-neon-50/50 dark:from-cyber-900/20 dark:to-neon-900/20 rounded-md border border-cyber-400/20">
                        <span className="text-2xl">{languageInfo.flag}</span>
                        <div>
                          <p className="font-medium">Target: {languageInfo.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {student.level} Level
                          </p>
                        </div>
                      </div>
                      
                      {nativeLanguageInfo && (
                        <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-md border border-purple-400/20">
                          <span className="text-2xl">{nativeLanguageInfo.flag}</span>
                          <div>
                            <p className="font-medium">Native: {nativeLanguageInfo.name}</p>
                            <p className="text-sm text-muted-foreground">
                              <Globe className="w-4 h-4 inline mr-1" />
                              Used for translation assistance
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="bg-cyber-400/20" />

                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Areas for Improvement</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="p-4 border border-cyber-400/20 rounded-lg bg-gradient-to-r from-red-50/50 to-pink-50/50 dark:from-red-950/20 dark:to-pink-950/20">
                        <h4 className="font-medium text-red-600 dark:text-red-400 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          Grammar Weaknesses
                        </h4>
                        <p className="text-sm">
                          {student.grammar_weaknesses || "None specified"}
                        </p>
                      </div>
                      <div className="p-4 border border-cyber-400/20 rounded-lg bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
                        <h4 className="font-medium text-orange-600 dark:text-orange-400 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                          Vocabulary Gaps
                        </h4>
                        <p className="text-sm">
                          {student.vocabulary_gaps || "None specified"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="p-4 border border-cyber-400/20 rounded-lg bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
                        <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          Pronunciation Challenges
                        </h4>
                        <p className="text-sm">
                          {student.pronunciation_challenges || "None specified"}
                        </p>
                      </div>
                      <div className="p-4 border border-cyber-400/20 rounded-lg bg-gradient-to-r from-purple-50/50 to-violet-50/50 dark:from-purple-950/20 dark:to-violet-950/20">
                        <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-2 flex items-center">
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

                <Separator className="bg-cyber-400/20" />

                <div>
                  <h3 className="font-medium mb-2">Additional Notes</h3>
                  <div className="bg-gradient-to-r from-cyber-50/50 to-neon-50/50 dark:from-cyber-900/20 dark:to-neon-900/20 p-4 rounded-md border border-cyber-400/20">
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
          onSuccess={() => {
            setIsFormOpen(false);
            // Refresh the page to get updated student data
            window.location.reload();
          }}
        />

        <SubTopicSelectionDialog
          open={isSubTopicDialogOpen}
          onOpenChange={setIsSubTopicDialogOpen}
          subTopics={availableSubTopics}
          onSelectSubTopic={handleSelectSubTopic}
          isGenerating={isGeneratingInteractive}
          generationProgress={interactiveGenerationProgress}
        />
      </div>
    </MainLayout>
  );
}